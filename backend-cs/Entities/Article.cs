/// <summary>
/// Database model for an Article.
/// 
/// Key Operations:
/// - Article Class: Represents a single saved website piece of evidence. It stores the title, link, and image, and connects back to the Agenda it belongs to.
/// </summary>
namespace AgendaCS.Backend.Entities;

public class Article
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Image { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int AgendaId { get; set; }
    public Agenda? Agenda { get; set; }
}


