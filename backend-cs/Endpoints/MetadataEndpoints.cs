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
