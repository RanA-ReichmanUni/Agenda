/// <summary>
/// API endpoints for article operations.
/// Defines the URL routes used to delete articles from an agenda.
/// 
/// Key Operations:
/// - MapDelete: Deletes a specific article. It checks to make sure the user actually owns the parent agenda before deleting it.
/// </summary>
using AgendaCS.Backend.Dto;
using AgendaCS.Backend.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Linq;

namespace AgendaCS.Backend.Endpoints;

public static class ArticleEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapGroup("/articles");

        group.MapDelete("/{id:int}", async (IArticleService articleService, IAgendaService agendaService, int id, HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();

            var article = await articleService.GetArticleByIdAsync(id);
            if (article == null) return Results.NotFound();

            var success = await articleService.DeleteArticleAsync(id, article.AgendaId, userId);
            
            return success ? Results.NoContent() : Results.NotFound();
        }).RequireAuthorization();
    }

    private static int GetUserId(HttpContext ctx)
    {
        var claim = ctx.User.Claims.FirstOrDefault(c => c.Type == "user_id");
        return int.TryParse(claim?.Value, out int id) ? id : 0;
    }
}



