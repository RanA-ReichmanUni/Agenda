using AgendaCS.Backend.Dto;
using AgendaCS.Backend.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System;

namespace AgendaCS.Backend.Endpoints;

public class RawAnalyzeDto { public string[] Urls { get; set; } }

public static class AgendaEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapGroup("/agendas");

        group.MapGet("/", async (IAgendaService agendaService, HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();

            var agendas = await agendaService.GetUserAgendasAsync(userId);
            return Results.Ok(agendas);
        }).RequireAuthorization();

        group.MapPost("/", async (IAgendaService agendaService, CreateAgendaDto dto, HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();

            var agenda = await agendaService.CreateAgendaAsync(userId, dto);
            return Results.Ok(agenda);
        }).RequireAuthorization();

        group.MapGet("/{id:int}", async (IAgendaService agendaService, int id, HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();

            var agenda = await agendaService.GetAgendaByIdAsync(id, userId);
            return agenda != null ? Results.Ok(agenda) : Results.NotFound();
        }).RequireAuthorization();

        group.MapDelete("/{id:int}", async (IAgendaService agendaService, int id, HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();

            var success = await agendaService.DeleteAgendaAsync(id, userId);
            return success ? Results.NoContent() : Results.NotFound();
        }).RequireAuthorization();

        // Share
        group.MapPost("/{id:int}/share", async (IAgendaService agendaService, int id, HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();
            
            var agenda = await agendaService.GetAgendaByIdAsync(id, userId);
            if (agenda == null) return Results.NotFound();
            
            var token = Guid.NewGuid().ToString(); 
            return Results.Ok(new { shareURL = $"http://localhost:5173/shared/{token}", shareToken = token });
        }).RequireAuthorization();

        group.MapPost("/{id:int}/unshare", async (IAgendaService agendaService, int id, HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();
            return Results.Ok(new { message = "Unshared" });
        }).RequireAuthorization();

        group.MapGet("/shared/{token}", async (IAgendaService agendaService, string token) =>
        {
            var agenda = await agendaService.GetAgendaByShareTokenAsync(token);
            return agenda != null ? Results.Ok(agenda) : Results.NotFound();
        });

        group.MapGet("/shared/{token}/articles", async (IAgendaService agendaService, IArticleService articleService, string token) =>
        {
            var agenda = await agendaService.GetAgendaByShareTokenAsync(token);
            if (agenda == null) return Results.NotFound();
            var articles = await articleService.GetArticlesByAgendaIdAsync(agenda.Id);
            return Results.Ok(articles);
        });

        group.MapPost("/shared/{token}/analyze", async (IAgendaService agendaService, string token) =>
        {
            return Results.Ok(new { analysis = "Mock analysis for shared agenda." });
        });

        group.MapGet("/{agendaId:int}/articles", async (IArticleService articleService, int agendaId, HttpContext ctx) =>
        {
            var articles = await articleService.GetArticlesByAgendaIdAsync(agendaId);
            return Results.Ok(articles);
        });

        group.MapPost("/{agendaId:int}/articles", async (IArticleService articleService, int agendaId, CreateArticleDto dto, HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
            if (userId == 0) return Results.Unauthorized();

            try {
                var article = await articleService.CreateArticleAsync(agendaId, dto);
                return Results.Ok(article);
            } catch (Exception ex) {
                return Results.BadRequest(new { detail = ex.Message });
            }
        }).RequireAuthorization();

        group.MapPost("/{id:int}/analyze", async (IAgendaService agendaService, int id, HttpContext ctx) =>
        {
            return Results.Ok(new { analysis = "Mock analysis" });
        });

        group.MapPost("/analyze-raw", (object payload) =>
        {
            return Results.Ok(new { analysis = "Mock raw analysis" });
        });
    }

    private static int GetUserId(HttpContext ctx)
    {
        var claim = ctx.User.Claims.FirstOrDefault(c => c.Type == "user_id");
        return int.TryParse(claim?.Value, out int id) ? id : 0;
    }
}
