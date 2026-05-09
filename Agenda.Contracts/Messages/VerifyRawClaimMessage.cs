using System;
using System.Collections.Generic;

namespace Agenda.Contracts.Messages;

public record VerifyRawClaimMessage
{
    public Guid CorrelationId { get; init; } = Guid.NewGuid();
    public string Claim { get; init; } = string.Empty;
    public IEnumerable<ArticleInfo>? Articles { get; init; }
    public DateTime RequestedAt { get; init; } = DateTime.UtcNow;
}
