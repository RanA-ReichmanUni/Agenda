using AgendaCS.Backend.Dto;

namespace AgendaCS.Backend.Services;

public interface IAiVerificationService
{
    Task<AnalysisResultDto> AnalyzeAgendaAsync(int agendaId, int userId, bool forceRefresh = false);
    Task<AnalysisResultDto> AnalyzeSharedAgendaAsync(string shareToken);
    Task<AnalysisResultDto> AnalyzeRawClaimAsync(string claim, List<CreateArticleDto> articles);
}
