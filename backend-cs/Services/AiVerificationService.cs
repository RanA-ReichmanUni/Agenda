using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using HtmlAgilityPack;
using Microsoft.EntityFrameworkCore;
using AgendaCS.Backend.Data;
using AgendaCS.Backend.Dto;

namespace AgendaCS.Backend.Services;

public class AiVerificationService : IAiVerificationService
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;

    public AiVerificationService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    }

    private async Task<string> FetchArticleExcerptAsync(string url, int maxWords = 200)
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(4));
            var response = await _httpClient.GetAsync(url, cts.Token);
            if (!response.IsSuccessStatusCode) return "Could not fetch content.";

            var html = await response.Content.ReadAsStringAsync();
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            // Remove scripts and styles
            var nodesToRemove = doc.DocumentNode.SelectNodes("//script|//style|//nav|//footer|//header|//aside");
            if (nodesToRemove != null)
            {
                foreach (var node in nodesToRemove) node.Remove();
            }

            var text = HtmlEntity.DeEntitize(doc.DocumentNode.InnerText);
            var words = text.Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
            
            if (words.Length > maxWords)
            {
                return string.Join(" ", words.Take(maxWords)) + "...";
            }
            return string.Join(" ", words);
        }
        catch
        {
            return "Error extracting content.";
        }
    }

    private class OpenRouterResponse
    {
        [JsonPropertyName("choices")]
        public List<OpenRouterChoice>? Choices { get; set; }
    }

    private class OpenRouterChoice
    {
        [JsonPropertyName("message")]
        public OpenRouterMessage? Message { get; set; }
    }

    private class OpenRouterMessage
    {
        [JsonPropertyName("content")]
        public string? Content { get; set; }
    }

    private class AnalysisResultInternal
    {
        [JsonPropertyName("score")]
        public string Score { get; set; } = "Low";
        [JsonPropertyName("reasoning")]
        public string Reasoning { get; set; } = "";
        [JsonPropertyName("article_audits")]
        public List<Audit>? Audits { get; set; }
    }

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

        CRITICAL INSTRUCTIONS:
        1. **Summarize First**: For EACH evidence item, write a 1-sentence summary of what it *actually* says.
        2. **Translate if needed**: If the text is not English, translate the main topic in your summary.
        3. **Strict Relevance Check**: Compare the actual topic to the user's claim. If unrelated, mark it IRRELEVANT.
        4. **Score each article individually**: assign a ""support_score"" (integer 0-100) measuring how specifically the article's ACTUAL content supports THIS exact claim:
           - 80-100: directly and substantively supports the claim
           - 50-79: supports the claim partially or indirectly
           - 20-49: topically related but weak or tangential support
           - 0-19: irrelevant to the claim, or contradicts it

        Output Format (JSON):
        {
            ""article_audits"": [ { ""id"": ""a0"", ""detected_topic"": ""..."", ""verdict"": ""Relevant"" | ""Irrelevant"", ""support_score"": 85 } ],
            ""score"": ""High"" | ""Medium"" | ""Low"",
            ""reasoning"": ""Combine audits into a final judgment. Explicitly mention any rejected articles.""
        }";

    private static string DomainOf(string? url)
    {
        try
        {
            return string.IsNullOrEmpty(url) ? "unknown" : new Uri(url).Host.Replace("www.", "");
        }
        catch
        {
            return "unknown";
        }
    }

    /// <summary>
    /// Aggregates per-article LLM support scores into a single 0-100 credibility score.
    /// base = mean of all per-article scores; corroboration caps single-source claims
    /// (min(1, 0.55 + 0.15 * relevant)); diversity discounts repeated outlets
    /// (0.85 + 0.15 * uniqueDomains / relevant).
    /// </summary>
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

        var final = (int)Math.Round(baseScore * corroboration * diversity);
        return Math.Clamp(final, 0, 100);
    }

    private static string ScoreBand(int numericScore) =>
        numericScore >= 70 ? "High" : numericScore >= 40 ? "Medium" : "Low";

    private AnalysisResultDto BuildResult(string claim, List<EvidenceItem> evidence, AnalysisResultInternal parsed)
    {
        var reasoning = parsed.Reasoning;
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
            // Deterministic aggregation in code; word score derived from the number
            // so badge and score always agree.
            var numeric = ComputeNumericScore(articleScores, evidence);
            return new AnalysisResultDto(ScoreBand(numeric), reasoning, claim, false, false, evidence.Count, numeric, articleScores);
        }

        // Legacy path: model returned no audits; keep its word score.
        return new AnalysisResultDto(parsed.Score, reasoning, claim, false, false, evidence.Count);
    }

    private async Task<AnalysisResultDto?> CallOpenRouterAnalysisAsync(string claim, List<EvidenceItem> evidence)
    {
        var apiKey = _config["OPENROUTER_API_KEY"] ?? Environment.GetEnvironmentVariable("OPENROUTER_API_KEY");
        var model = _config["OPENROUTER_MODEL"] ?? Environment.GetEnvironmentVariable("OPENROUTER_MODEL") ?? "google/gemma-3-27b-it:free";
        if (string.IsNullOrEmpty(apiKey))
        {
            Console.WriteLine("[DEBUG] OPENROUTER_API_KEY is empty or missing.");
            return null;
        }

        Console.WriteLine("[DEBUG] Calling OpenRouter for claim: " + claim);

        var messages = new[]
        {
            new
            {
                role = "system",
                content = AnalysisSystemPrompt
            },
            new
            {
                role = "user",
                content = JsonSerializer.Serialize(new {
                    task = "Evaluate evidence.",
                    agenda_claim = claim,
                    evidence_items = evidence
                })
            }
        };

        var requestContent = new StringContent(JsonSerializer.Serialize(new {
            model = model,
            messages = messages
        }), Encoding.UTF8, "application/json");

        var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions")
        {
            Content = requestContent
        };
        request.Headers.Add("Authorization", $"Bearer {apiKey}");
        request.Headers.Add("HTTP-Referer", "http://localhost:3000");
        request.Headers.Add("X-Title", "Agenda App");

        try
        {
            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                Console.WriteLine("[DEBUG] OpenRouter success Response: " + body);
                
                var result = JsonSerializer.Deserialize<OpenRouterResponse>(body);
                var content = result?.Choices?.FirstOrDefault()?.Message?.Content;

                if (!string.IsNullOrEmpty(content))
                {
                    if (content.Contains("```json"))
                    {
                        content = content.Replace("```json", "").Replace("```", "");
                    }
                    try
                    {
                        var parsed = JsonSerializer.Deserialize<AnalysisResultInternal>(content);
                        if (parsed != null)
                        {
                            return BuildResult(claim, evidence, parsed);
                        }
                        else
                        {
                            Console.WriteLine("[DEBUG] Failed to parse content as AnalysisResultInternal. Content: " + content);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("[DEBUG] JSON Parse Error: " + ex.Message + " | Content: " + content);
                    }
                }
            }
            else
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[DEBUG] OpenRouter HTTP Error: {response.StatusCode} - {errorBody}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("[DEBUG] Exception sending request to OpenRouter: " + ex.Message);
        }

        Console.WriteLine("[DEBUG] CallOpenRouterAnalysisAsync returning null.");
        return null;
    }

    public async Task<AnalysisResultDto> AnalyzeAgendaAsync(int agendaId, int userId, bool forceRefresh = false)
    {
        var agenda = await _context.Agendas.Include(a => a.Articles)
            .FirstOrDefaultAsync(a => a.Id == agendaId && a.UserId == userId);
        if (agenda == null) throw new Exception("Agenda not found");

        var currentCount = agenda.Articles.Count;

        if (!forceRefresh && !string.IsNullOrEmpty(agenda.AnalysisScore) && !string.IsNullOrEmpty(agenda.AnalysisReasoning))
        {
            if (agenda.AnalysisArticleCount == currentCount)
            {
                return new AnalysisResultDto(agenda.AnalysisScore, agenda.AnalysisReasoning, agenda.Title, true, false, currentCount);
            }
        }

        var evidence = new List<EvidenceItem>();
        for (int i = 0; i < agenda.Articles.Count; i++)
        {
            var a = agenda.Articles.ElementAt(i);
            var excerpt = await FetchArticleExcerptAsync(a.Url);
            evidence.Add(new EvidenceItem($"a{i}", a.Title, a.Url, excerpt));
        }

        var result = await CallOpenRouterAnalysisAsync(agenda.Title, evidence);
        if (result != null)
        {
            agenda.AnalysisScore = result.Score;
            agenda.AnalysisReasoning = result.Reasoning;
            agenda.AnalysisArticleCount = currentCount;
            agenda.LastAnalyzedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return result;
        }

        // Fallback simulation
        await Task.Delay(1000);
        return new AnalysisResultDto("Low", "Real AI service unavailable. (Demo mode fallback)", agenda.Title, false, false, currentCount);
    }

    public async Task<AnalysisResultDto> AnalyzeSharedAgendaAsync(string shareToken)
    {
        var agenda = await _context.Agendas.Include(a => a.Articles)
            .FirstOrDefaultAsync(a => a.ShareToken == shareToken);
        if (agenda == null) throw new Exception("Agenda not found");

        var evidence = new List<EvidenceItem>();
        for (int i = 0; i < agenda.Articles.Count; i++)
        {
            var a = agenda.Articles.ElementAt(i);
            var excerpt = await FetchArticleExcerptAsync(a.Url);
            evidence.Add(new EvidenceItem($"a{i}", a.Title, a.Url, excerpt));
        }

        var result = await CallOpenRouterAnalysisAsync(agenda.Title, evidence);
        if (result != null) return result;

        await Task.Delay(1000);
        return new AnalysisResultDto("Medium", "Public view LLM proxy fallback", agenda.Title, false, false, evidence.Count);
    }

    public async Task<AnalysisResultDto> AnalyzeRawClaimAsync(string claim, List<CreateArticleDto> articles)
    {
        var evidence = new List<EvidenceItem>();
        for (int i = 0; i < articles.Count; i++)
        {
            var a = articles[i];
            var excerpt = await FetchArticleExcerptAsync(a.Url) ?? a.Description;
            evidence.Add(new EvidenceItem($"a{i}", a.Title, a.Url, excerpt));
        }

        var result = await CallOpenRouterAnalysisAsync(claim, evidence);
        if (result != null) return result;

        await Task.Delay(1000);
        return new AnalysisResultDto("Low", "Real AI service unavailable. (Demo mode fallback)", claim, false, false, evidence.Count);
    }
}
