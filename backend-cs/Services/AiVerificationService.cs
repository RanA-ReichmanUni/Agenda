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
    }

    private async Task<AnalysisResultDto?> CallOpenRouterAnalysisAsync(string claim, List<object> evidence)
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
                content = @"You are a strict fact-checking analyst. 
        Your ONLY job is to verify if the *actual content* of the provided articles supports the user's claim.

        CRITICAL INSTRUCTIONS:
        1. **Summarize First**: For EACH evidence item, write a 1-sentence summary what it *actually* says.
        2. **Translate if needed**: If the text is not English, translate the main topic in your summary.
        3. **Strict Relevance Check**: Compare the actual topic to the user's claim.

        Output Format (JSON):
        {
            ""score"": ""High"",
            ""reasoning"": ""Combine audits into a final judgment."",
            ""article_audits"": [ { ""id"": ""a0"", ""detected_topic"": ""..."", ""verdict"": ""Relevant"" } ]
        }"
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
                            var reasoning = parsed.Reasoning;
                            if (parsed.Audits != null && parsed.Audits.Any())
                            {
                                reasoning += "\n\nSource Breakdown:\n" + string.Join("\n", parsed.Audits.Select(a => $"- {a.Id}: {a.DetectedTopic} ({a.Verdict})"));
                            }
                            return new AnalysisResultDto(parsed.Score, reasoning, claim, false, false, evidence.Count);
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

        var evidence = new List<object>();
        for (int i = 0; i < agenda.Articles.Count; i++)
        {
            var a = agenda.Articles.ElementAt(i);
            var excerpt = await FetchArticleExcerptAsync(a.Url);
            evidence.Add(new { id = $"a{i}", title = a.Title, url = a.Url, excerpt = excerpt });
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

        var evidence = new List<object>();
        for (int i = 0; i < agenda.Articles.Count; i++)
        {
            var a = agenda.Articles.ElementAt(i);
            var excerpt = await FetchArticleExcerptAsync(a.Url);
            evidence.Add(new { id = $"a{i}", title = a.Title, url = a.Url, excerpt = excerpt });
        }
        
        var result = await CallOpenRouterAnalysisAsync(agenda.Title, evidence);
        if (result != null) return result;

        await Task.Delay(1000);
        return new AnalysisResultDto("Medium", "Public view LLM proxy fallback", agenda.Title, false, false, evidence.Count);
    }

    public async Task<AnalysisResultDto> AnalyzeRawClaimAsync(string claim, List<CreateArticleDto> articles)
    {
        var evidence = new List<object>();
        for (int i = 0; i < articles.Count; i++)
        {
            var a = articles[i];
            var excerpt = await FetchArticleExcerptAsync(a.Url) ?? a.Description;
            evidence.Add(new { id = $"a{i}", title = a.Title, url = a.Url, excerpt = excerpt });
        }

        var result = await CallOpenRouterAnalysisAsync(claim, evidence);
        if (result != null) return result;

        await Task.Delay(1000);
        return new AnalysisResultDto("Low", "Real AI service unavailable. (Demo mode fallback)", claim, false, false, evidence.Count);
    }
}
