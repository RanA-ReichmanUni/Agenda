using HtmlAgilityPack;

namespace AgendaCS.Backend.Services;

public class MetadataService : IMetadataService
{
    private readonly HttpClient _httpClient;

    public MetadataService()
    {
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    }

    public async Task<MetadataDto> ExtractMetadataAsync(string url)
    {
        if (!url.StartsWith("http"))
        {
            url = "https://" + url;
        }

        try
        {
            var html = await _httpClient.GetStringAsync(url);
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var title = GetMetaTagContent(doc, "og:title") ?? doc.DocumentNode.SelectSingleNode("//title")?.InnerText?.Trim() ?? "Unknown Title";
            var description = GetMetaTagContent(doc, "og:description") ?? GetMetaTagContent(doc, "description") ?? string.Empty;
            var image = GetMetaTagContent(doc, "og:image") ?? string.Empty;

            return new MetadataDto(title, description, image, url);
        }
        catch
        {
            return new MetadataDto("Error loading preview", "Could not load preview", "", url);
        }
    }

    private string? GetMetaTagContent(HtmlDocument doc, string property)
    {
        // Try property attribute
        var node = doc.DocumentNode.SelectSingleNode($"//meta[@property='{property}']");
        if (node != null) return node.GetAttributeValue("content", null);

        // Try name attribute
        node = doc.DocumentNode.SelectSingleNode($"//meta[@name='{property}']");
        return node?.GetAttributeValue("content", null);
    }
}