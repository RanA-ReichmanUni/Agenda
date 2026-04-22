/// <summary>
/// Database model for an Agenda.
/// 
/// Key Operations:
/// - Agenda Class: Represents a board or collection of articles. It holds a list of articles and remembers who created them.
/// </summary>
namespace AgendaCS.Backend.Entities;

public class Agenda
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ShareToken { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User? User { get; set; }

    public ICollection<Article> Articles { get; set; } = new List<Article>();
}


