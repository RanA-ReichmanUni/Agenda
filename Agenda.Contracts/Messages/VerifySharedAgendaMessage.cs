using System;

namespace Agenda.Contracts.Messages;

public record VerifySharedAgendaMessage
{
    public Guid CorrelationId { get; init; } = Guid.NewGuid();
    public string ShareToken { get; init; } = string.Empty;
    public DateTime RequestedAt { get; init; } = DateTime.UtcNow;
}
