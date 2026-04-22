/// <summary>
/// API endpoints for user authentication.
/// Defines the URLs used for registration and logging in.
/// 
/// Key Operations:
/// - /register: Takes a name, email, and password, creates a new user, and gives them a login token.
/// - /login: Checks if the email and password are correct, and gives the frontend a secure session token.
/// - /me: Reads the user's active token and returns their basic profile info so the frontend knows who is actively logged in.
/// </summary>
using AgendaCS.Backend.Dto;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Linq;

namespace AgendaCS.Backend.Endpoints;

public static class AuthEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapGroup("/auth");

        group.MapPost("/register", async (Services.IAuthService authService, UserRegisterDto dto) =>
        {
            var result = await authService.RegisterAsync(dto);
            if (result == null) return Results.BadRequest(new { detail = "User already exists" });
            return Results.Ok(new { access_token = result.AccessToken, token_type = "bearer" });
        });

        group.MapPost("/login", async (Services.IAuthService authService, UserLoginDto dto) =>
        {
            var result = await authService.LoginAsync(dto);
            if (result == null) return Results.Unauthorized();
            return Results.Ok(new { access_token = result.AccessToken, token_type = "bearer" });
        });

        group.MapGet("/me", (HttpContext ctx) =>
        {
            var claimEmail = ctx.User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value;
            var claimId = ctx.User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
            if (claimId == null) return Results.Unauthorized();
            
            return Results.Ok(new { id = int.Parse(claimId), email = claimEmail });
        }).RequireAuthorization();
    }
}



