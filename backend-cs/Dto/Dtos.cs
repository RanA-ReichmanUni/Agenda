namespace AgendaCS.Backend.Dto;

// Auth DTOs
public record UserRegisterDto(string Name, string Email, string Password);
public record UserLoginDto(string Email, string Password);
public record AuthResponseDto(string AccessToken, UserDto User);
public record UserDto(int Id, string Name, string Email);

// Agenda DTOs
public record CreateAgendaDto(string Title);
public record AgendaDto(int Id, int UserId, string Title, DateTime CreatedAt, string? ShareToken, string? OwnerName);

// Article DTOs
public record CreateArticleDto(string Title, string Url, string Description, string? Image);
public record ArticleDto(int Id, string Title, string Url, string Description, string? Image, int AgendaId, DateTime CreatedAt);
