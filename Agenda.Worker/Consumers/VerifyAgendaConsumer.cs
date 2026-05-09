using System.Threading.Tasks;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Agenda.Contracts.Messages;
using AgendaCS.Backend.Data;
using Agenda.Worker.Services;

namespace Agenda.Worker.Consumers;

public class VerifyAgendaConsumer : IConsumer<VerifyAgendaMessage>
{
    private readonly AppDbContext _context;
    private readonly ILogger<VerifyAgendaConsumer> _logger;
    private readonly AiVerificationWorkerService _aiService;

    public VerifyAgendaConsumer(
        AppDbContext context,
        ILogger<VerifyAgendaConsumer> logger,
        AiVerificationWorkerService aiService)
    {
        _context = context;
        _logger = logger;
        _aiService = aiService;
    }

    public async Task Consume(ConsumeContext<VerifyAgendaMessage> context)
    {
        var msg = context.Message;
        _logger.LogInformation("Received VerifyAgendaMessage for AgendaId={AgendaId}", msg.AgendaId);

        var agenda = await _context.Agendas.Include(a => a.Articles)
            .FirstOrDefaultAsync(a => a.Id == msg.AgendaId);
        if (agenda == null)
        {
            _logger.LogWarning("Agenda {AgendaId} not found", msg.AgendaId);
            return;
        }

        try
        {
            var result = await _aiService.AnalyzeAgendaAsync(agenda);
            if (result != null)
            {
                agenda.AnalysisScore = result.Score;
                agenda.AnalysisReasoning = result.Reasoning;
                agenda.AnalysisArticleCount = result.ArticleCount;
                agenda.LastAnalyzedAt = System.DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Updated agenda {AgendaId} analysis", msg.AgendaId);
            }
        }
        catch (System.Exception ex)
        {
            _logger.LogError(ex, "Error processing VerifyAgendaMessage for {AgendaId}", msg.AgendaId);
        }
    }
}
