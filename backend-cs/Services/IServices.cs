/// <summary>
/// Interface blueprints for all services.
/// 
/// Key Operations:
/// - Interfaces: These act as blueprints. They tell the rest of the application what functions a service must have without worrying about how they are actually coded. This keeps the code flexible and organized.
/// </summary>
using AgendaCS.Backend.Dto;

namespace AgendaCS.Backend.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(UserLoginDto dto);
    Task<AuthResponseDto?> RegisterAsync(UserRegisterDto dto);
}

public interface IAgendaService
{
    Task<List<AgendaDto>> GetUserAgendasAsync(int userId);
    Task<AgendaDto?> GetAgendaByIdAsync(int id, int userId);
    Task<AgendaDto?> GetAgendaByShareTokenAsync(string shareToken);
    Task<AgendaDto> CreateAgendaAsync(int userId, CreateAgendaDto dto);
    Task<bool> DeleteAgendaAsync(int id, int userId);
}

public interface IArticleService
{
    Task<List<ArticleDto>> GetArticlesByAgendaIdAsync(int agendaId);
    Task<ArticleDto?> GetArticleByIdAsync(int id);
    Task<ArticleDto> CreateArticleAsync(int agendaId, CreateArticleDto dto);
    Task<bool> DeleteArticleAsync(int id, int agendaId, int userId);
}

public interface IMetadataService
{
    Task<MetadataDto> ExtractMetadataAsync(string url);
}

public record MetadataDto(string Title, string Description, string Image, string Url);


