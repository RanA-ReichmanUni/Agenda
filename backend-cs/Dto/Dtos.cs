/// <summary>
/// Data Transfer Objects (DTOs).
/// These are simple containers used to send and receive data from the frontend.
/// 
/// Key Operations:
/// - Requests (e.g. UserLoginDto): Represents the exact data we expect the frontend to send us.
/// - Responses (e.g. UserDto): Represents what we send back to the frontend, intentionally leaving out sensitive info like passwords.
/// </summary>
namespace AgendaCS.Backend.Dto;

// Auth DTOs
public record UserRegisterDto(string Name, string Email, string Password);
public record UserLoginDto(string Email, string Password);
public record AuthResponseDto(string AccessToken, UserDto User);
public record UserDto(int Id, string Name, string Email);

// Agenda DTOs
public record CreateAgendaDto(string Title);
public record AnalysisResultDto(string Score, string Reasoning, string Claim, bool IsCached, bool IsStale, int? ArticleCount);
public record AgendaDto(int Id, int UserId, string Title, DateTime CreatedAt, string? ShareToken, string? OwnerName, AnalysisResultDto? AnalysisResult = null);

// Article DTOs
public record CreateArticleDto(string Title, string Url, string Description, string? Image);
public record ArticleDto(int Id, string Title, string Url, string Description, string? Image, int AgendaId, DateTime CreatedAt);



