using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Agenda.Contracts.Messages;
using AgendaCS.Backend.Data;
using Agenda.Worker.Services;

namespace Agenda.Worker.Consumers;

public class VerifySharedAgendaConsumer : IConsumer<VerifySharedAgendaMessage>
{
    private readonly AppDbContext _context;
    private readonly ILogger<VerifySharedAgendaConsumer> _logger;
    private readonly AiVerificationWorkerService _aiService;

    public VerifySharedAgendaConsumer(
        AppDbContext context,
        ILogger<VerifySharedAgendaConsumer> logger,
        AiVerificationWorkerService aiService)
    {
        _context = context;
        _logger = logger;
        _aiService = aiService;
    }

    public async Task Consume(ConsumeContext<VerifySharedAgendaMessage> context)
    {
        var msg = context.Message;
        _logger.LogInformation("Received VerifySharedAgendaMessage for token={Token}", msg.ShareToken);

        var agenda = await _context.Agendas
            .Include(a => a.Articles)
            .FirstOrDefaultAsync(a => a.ShareToken == msg.ShareToken);
        if (agenda == null)
        {
            _logger.LogWarning("Shared agenda with token {Token} not found", msg.ShareToken);
            return;
        }

        var result = await _aiService.AnalyzeAgendaAsync(agenda);
        if (result == null)
        {
            return;
        }

        agenda.AnalysisScore = result.Score;
        agenda.AnalysisReasoning = result.Reasoning;
        agenda.AnalysisArticleCount = result.ArticleCount;
        agenda.LastAnalyzedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogInformation("Updated shared agenda analysis for AgendaId={AgendaId}", agenda.Id);
    }
}
