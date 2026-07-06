using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using HtmlAgilityPack;
using AgendaCS.Backend.Entities;
using AgendaCS.Backend.Dto;
using Agenda.Contracts.Messages;

namespace Agenda.Worker.Services;

public class AiVerificationWorkerService
{
    private readonly HttpClient _httpClient = new HttpClient();

    public AiVerificationWorkerService()
    {
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Agenda.Worker/1.0");
    }

    private async Task<string> FetchArticleExcerptAsync(string url, int maxWords = 200)
    {
        try
        {
            using var cts = new System.Threading.CancellationTokenSource(System.TimeSpan.FromSeconds(4));
            var response = await _httpClient.GetAsync(url, cts.Token);
            if (!response.IsSuccessStatusCode) return "Could not fetch content.";

            var html = await response.Content.ReadAsStringAsync();
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var nodesToRemove = doc.DocumentNode.SelectNodes("//script|//style|//nav|//footer|//header|//aside");
            if (nodesToRemove != null)
            {
                foreach (var node in nodesToRemove)
                {
                    node.Remove();
                }
            }

            var text = HtmlEntity.DeEntitize(doc.DocumentNode.InnerText);
            var words = text.Split(new[] { ' ', '\t', '\n', '\r' }, System.StringSplitOptions.RemoveEmptyEntries);
            if (words.Length > maxWords) return string.Join(" ", words[..maxWords]) + "...";
            return string.Join(" ", words);
        }
        catch { return "Error extracting content."; }
    }

    private class OpenRouterResponse
    {
        [JsonPropertyName("choices")]
        public List<OpenRouterChoice>? Choices { get; set; }
    }
    private class OpenRouterChoice { [JsonPropertyName("message")] public OpenRouterMessage? Message { get; set; } }
    private class OpenRouterMessage { [JsonPropertyName("content")] public string? Content { get; set; } }

    private class AnalysisResultInternal { [JsonPropertyName("score")] public string Score { get; set; } = "Low"; [JsonPropertyName("reasoning")] public string Reasoning { get; set; } = ""; [JsonPropertyName("article_audits")] public List<Audit>? Audits { get; set; } }

    private class Audit
    {
        [JsonPropertyName("id")] public string? Id { get; set; }
        [JsonPropertyName("detected_topic")] public string? DetectedTopic { get; set; }
        [JsonPropertyName("verdict")] public string? Verdict { get; set; }
        [JsonPropertyName("support_score")] public double? SupportScore { get; set; }
    }

    private record EvidenceItem(
        [property: JsonPropertyName("id")] string Id,
        [property: JsonPropertyName("title")] string Title,
        [property: JsonPropertyName("url")] string Url,
        [property: JsonPropertyName("excerpt")] string Excerpt);

    private const string AnalysisSystemPrompt = @"You are a strict fact-checking analyst.
Your ONLY job is to verify if the *actual content* of the provided articles supports the user's claim.
For EACH evidence item: summarize it in 1 sentence, check strict relevance to the claim, and assign a ""support_score"" (integer 0-100):
80-100 directly supports; 50-79 partial/indirect; 20-49 weak/tangential; 0-19 irrelevant or contradicts.
Output JSON: { ""article_audits"": [ { ""id"": ""a0"", ""detected_topic"": ""..."", ""verdict"": ""Relevant"" | ""Irrelevant"", ""support_score"": 85 } ], ""score"": ""High"" | ""Medium"" | ""Low"", ""reasoning"": ""..."" }";

    private static string DomainOf(string? url)
    {
        try { return string.IsNullOrEmpty(url) ? "unknown" : new Uri(url).Host.Replace("www.", ""); }
        catch { return "unknown"; }
    }

    // Same aggregation formula as the API backend: mean per-article support,
    // capped by corroboration (source count) and domain diversity.
    private static int ComputeNumericScore(List<ArticleScoreDto> articleScores, List<EvidenceItem> evidence)
    {
        if (articleScores.Count == 0) return 0;
        var baseScore = articleScores.Average(a => (double)a.Score);
        var relevant = articleScores.Where(a => a.Score >= 40).ToList();
        var corroboration = Math.Min(1.0, 0.55 + 0.15 * relevant.Count);
        double diversity = 1.0;
        if (relevant.Count > 0)
        {
            var urlById = evidence.ToDictionary(e => e.Id, e => e.Url);
            var domains = relevant
                .Select(a => DomainOf(a.Id != null && urlById.TryGetValue(a.Id, out var u) ? u : null))
                .Distinct()
                .Count();
            diversity = Math.Min(1.0, 0.85 + 0.15 * ((double)domains / relevant.Count));
        }
        return Math.Clamp((int)Math.Round(baseScore * corroboration * diversity), 0, 100);
    }

    private static string ScoreBand(int numericScore) =>
        numericScore >= 70 ? "High" : numericScore >= 40 ? "Medium" : "Low";

    private static AnalysisResultDto BuildResult(string claim, List<EvidenceItem> evidence, AnalysisResultInternal parsed)
    {
        var titleById = evidence.ToDictionary(e => e.Id, e => e.Title);
        var articleScores = (parsed.Audits ?? new List<Audit>())
            .Select(a => new ArticleScoreDto(
                a.Id,
                a.Id != null && titleById.TryGetValue(a.Id, out var t) ? t : "",
                a.DetectedTopic,
                a.Verdict,
                Math.Clamp((int)Math.Round(a.SupportScore ?? 0), 0, 100)))
            .ToList();

        if (articleScores.Count > 0)
        {
            var numeric = ComputeNumericScore(articleScores, evidence);
            return new AnalysisResultDto(ScoreBand(numeric), parsed.Reasoning, claim, false, false, evidence.Count, numeric, articleScores);
        }
        return new AnalysisResultDto(parsed.Score, parsed.Reasoning, claim, false, false, evidence.Count);
    }

    private async Task<AnalysisResultDto?> CallOpenRouterAnalysisAsync(string claim, List<EvidenceItem> evidence)
    {
        var apiKey = System.Environment.GetEnvironmentVariable("OPENROUTER_API_KEY");
        var model = System.Environment.GetEnvironmentVariable("OPENROUTER_MODEL") ?? "google/gemma-3-27b-it:free";
        if (string.IsNullOrEmpty(apiKey)) return null;

        var messages = new[]
        {
            new { role = "system", content = AnalysisSystemPrompt },
            new { role = "user", content = JsonSerializer.Serialize(new { task = "Evaluate", agenda_claim = claim, evidence_items = evidence }) }
        };

        var requestContent = new StringContent(JsonSerializer.Serialize(new { model = model, messages = messages }), Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions") { Content = requestContent };
        request.Headers.Add("Authorization", $"Bearer {apiKey}");

        try
        {
            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode) return null;
            var body = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<OpenRouterResponse>(body);
            var content = result?.Choices?.FirstOrDefault()?.Message?.Content;
            if (string.IsNullOrEmpty(content)) return null;
            if (content.Contains("```json")) content = content.Replace("```json", "").Replace("```", "");
            try
            {
                var parsed = JsonSerializer.Deserialize<AnalysisResultInternal>(content);
                if (parsed != null) return BuildResult(claim, evidence, parsed);
            }
            catch { }
        }
        catch { }
        return null;
    }

    public async Task<AnalysisResultDto?> AnalyzeAgendaAsync(AgendaCS.Backend.Entities.Agenda agenda)
    {
        var evidence = new List<EvidenceItem>();
        var index = 0;
        foreach (var a in agenda.Articles)
        {
            var excerpt = await FetchArticleExcerptAsync(a.Url) ?? a.Description;
            evidence.Add(new EvidenceItem($"a{index++}", a.Title, a.Url, excerpt));
        }

        var result = await CallOpenRouterAnalysisAsync(agenda.Title, evidence);
        if (result != null) return result;
        await Task.Delay(1000);
        return new AnalysisResultDto("Low", "LLM unavailable - fallback", agenda.Title, false, false, evidence.Count);
    }

    public async Task<AnalysisResultDto?> AnalyzeRawClaimAsync(string claim, List<ArticleInfo> articles)
    {
        var evidence = new List<EvidenceItem>();
        for (var i = 0; i < articles.Count; i++)
        {
            var a = articles[i];
            var excerpt = await FetchArticleExcerptAsync(a.Url);
            evidence.Add(new EvidenceItem($"a{i}", a.Title, a.Url, excerpt));
        }

        var result = await CallOpenRouterAnalysisAsync(claim, evidence);
        if (result != null)
        {
            return result;
        }

        await Task.Delay(1000);
        return new AnalysisResultDto("Low", "LLM unavailable - fallback", claim, false, false, evidence.Count);
    }
}
