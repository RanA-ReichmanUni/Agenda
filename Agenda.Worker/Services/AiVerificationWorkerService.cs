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

    private class AnalysisResultInternal { [JsonPropertyName("score")] public string Score { get; set; } = "Low"; [JsonPropertyName("reasoning")] public string Reasoning { get; set; } = ""; [JsonPropertyName("article_audits")] public List<object>? Audits { get; set; } }

    private async Task<AnalysisResultDto?> CallOpenRouterAnalysisAsync(string claim, List<object> evidence)
    {
        var apiKey = System.Environment.GetEnvironmentVariable("OPENROUTER_API_KEY");
        var model = System.Environment.GetEnvironmentVariable("OPENROUTER_MODEL") ?? "google/gemma-3-27b-it:free";
        if (string.IsNullOrEmpty(apiKey)) return null;

        var messages = new[]
        {
            new { role = "system", content = "You are a strict fact-checking analyst.\nOutput: JSON with score, reasoning, article_audits" },
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
                if (parsed != null) return new AnalysisResultDto(parsed.Score, parsed.Reasoning, claim, false, false, evidence.Count);
            }
            catch { }
        }
        catch { }
        return null;
    }

    public async Task<AnalysisResultDto?> AnalyzeAgendaAsync(AgendaCS.Backend.Entities.Agenda agenda)
    {
        var evidence = new List<object>();
        foreach (var a in agenda.Articles)
        {
            var excerpt = await FetchArticleExcerptAsync(a.Url) ?? a.Description;
            evidence.Add(new { id = $"a{a.Id}", title = a.Title, url = a.Url, excerpt = excerpt });
        }

        var result = await CallOpenRouterAnalysisAsync(agenda.Title, evidence);
        if (result != null) return result;
        await Task.Delay(1000);
        return new AnalysisResultDto("Low", "LLM unavailable - fallback", agenda.Title, false, false, evidence.Count);
    }

    public async Task<AnalysisResultDto?> AnalyzeRawClaimAsync(string claim, List<ArticleInfo> articles)
    {
        var evidence = new List<object>();
        for (var i = 0; i < articles.Count; i++)
        {
            var a = articles[i];
            var excerpt = await FetchArticleExcerptAsync(a.Url);
            evidence.Add(new { id = $"a{i}", title = a.Title, url = a.Url, excerpt });
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
