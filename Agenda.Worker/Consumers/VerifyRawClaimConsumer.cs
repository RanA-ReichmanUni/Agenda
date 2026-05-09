using MassTransit;
using Microsoft.Extensions.Logging;
using Agenda.Contracts.Messages;
using Agenda.Worker.Services;

namespace Agenda.Worker.Consumers;

public class VerifyRawClaimConsumer : IConsumer<VerifyRawClaimMessage>
{
    private readonly ILogger<VerifyRawClaimConsumer> _logger;
    private readonly AiVerificationWorkerService _aiService;

    public VerifyRawClaimConsumer(ILogger<VerifyRawClaimConsumer> logger, AiVerificationWorkerService aiService)
    {
        _logger = logger;
        _aiService = aiService;
    }

    public async Task Consume(ConsumeContext<VerifyRawClaimMessage> context)
    {
        var msg = context.Message;
        _logger.LogInformation("Received VerifyRawClaimMessage, correlationId={CorrelationId}", msg.CorrelationId);

        var articles = msg.Articles?.ToList() ?? new List<ArticleInfo>();
        var result = await _aiService.AnalyzeRawClaimAsync(msg.Claim, articles);
        if (result != null)
        {
            _logger.LogInformation("Raw claim analyzed with score={Score}", result.Score);
        }
    }
}
