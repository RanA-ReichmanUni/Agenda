/// <summary>
/// Database model for a User.
/// 
/// Key Operations:
/// - User Class: Holds the login credentials (email and password hash) and links to all the Agendas they have created.
/// </summary>
namespace AgendaCS.Backend.Entities;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Agenda> Agendas { get; set; } = new List<Agenda>();
}



