using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using AgendaCS.Backend.Data;
using AgendaCS.Backend.Services;
using AgendaCS.Backend.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Configuration / DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connStr = builder.Configuration.GetConnectionString("DefaultConnection") 
                  ?? "Host=localhost;Database=agendacs;Username=postgres;Password=postgres";
    options.UseNpgsql(connStr);
});

// 2. Add Services (Dependency Injection - as seen in concepts.cs)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAgendaService, AgendaService>();
builder.Services.AddScoped<IArticleService, ArticleService>();
builder.Services.AddScoped<IMetadataService, MetadataService>();

// 3. Add Authentication via JWT Bearer
var secretKey = builder.Configuration["JwtSettings:Secret"] ?? "super_secret_for_jwt_auth_1234567890_must_be_long_enough_for_hmac_sha256";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Automatically apply EF Core database migrations on startup in Docker!
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var maxRetries = 10;
    for (int i = 0; i < maxRetries; i++)
    {
        try
        {
            db.Database.Migrate();
            break;
        }
        catch (Exception ex)
        {
            if (i == maxRetries - 1) throw;
            Console.WriteLine($"Database not ready yet. Waiting 2 seconds... ({ex.Message})");
            Thread.Sleep(2000);
        }
    }
}

// Configure the HTTP request pipeline.
app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI();

// app.UseHttpsRedirection(); // Removed for local docker proxy routing
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// 5. Map Endpoints (Minimal APIs - matching concepts.cs & Python routers)
AuthEndpoints.Map(app);
AgendaEndpoints.Map(app);
ArticleEndpoints.Map(app);
MetadataEndpoints.Map(app);

app.Run();
