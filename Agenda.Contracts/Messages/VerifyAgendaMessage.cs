using System;
using System.Collections.Generic;

namespace Agenda.Contracts.Messages;

public record VerifyAgendaMessage
{
    public Guid CorrelationId { get; init; } = Guid.NewGuid();
    public int AgendaId { get; init; }
    public int UserId { get; init; }
    public bool ForceRefresh { get; init; }
    public DateTime RequestedAt { get; init; } = DateTime.UtcNow;
    public IEnumerable<ArticleInfo>? Articles { get; init; }
}
