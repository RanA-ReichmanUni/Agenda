namespace Agenda.Contracts.Messages;

public record ArticleInfo
(
    int Id,
    string Title,
    string Url,
    string Description
);
