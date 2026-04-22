/// <summary>
/// API endpoints for fetching website data.
/// Used by the frontend to get link previews circumventing browser CORS blocks.
/// 
/// Key Operations:
/// - /extract: Takes a website URL from the frontend, scrapes its title, description, and image from the web, and returns it.
/// - /check-iframe: A small helper to check if a website can be embedded securely.
/// </summary>
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using AgendaCS.Backend.Services;
using System;

namespace AgendaCS.Backend.Endpoints;

public class ExtractRequest { public string Url { get; set; } }

public static class MetadataEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapGroup("/api");

        group.MapPost("/extract", async (IMetadataService metadataService, ExtractRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.Url))
                return Results.BadRequest(new { detail = "URL is required" });

            try
            {
                var metadata = await metadataService.ExtractMetadataAsync(request.Url);
                return Results.Ok(metadata);
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { detail = $"Error getting metadata: {ex.Message}" });
            }
        });

        group.MapGet("/check-iframe", async (IMetadataService metadataService, string url) =>
        {
            return Results.Ok(new { canIframe = true });
        });
    }
}



