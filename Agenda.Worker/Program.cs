using System;
using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Agenda.Worker.Consumers;
using Agenda.Worker.Services;
using AgendaCS.Backend.Data;
using Microsoft.EntityFrameworkCore;

IHost host = Host.CreateDefaultBuilder(args)
    .ConfigureServices((context, services) =>
    {
        var configuration = context.Configuration;

        // Database - read DATABASE_URL or ConnectionStrings__DefaultConnection
        static string ResolveConnectionString(Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            var databaseUrl = configuration["DATABASE_URL"] ?? Environment.GetEnvironmentVariable("DATABASE_URL");
            if (!string.IsNullOrWhiteSpace(databaseUrl))
            {
                return ConvertDatabaseUrlToConnectionString(databaseUrl);
            }

            var configuredConnectionString = configuration.GetConnectionString("DefaultConnection");
            if (!string.IsNullOrWhiteSpace(configuredConnectionString))
            {
                return configuredConnectionString;
            }

            return "Host=localhost;Database=agendacs;Username=postgres;Password=postgres";
        }

        static string ConvertDatabaseUrlToConnectionString(string databaseUrl)
        {
            if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != "postgres" && uri.Scheme != "postgresql"))
            {
                return databaseUrl;
            }

            var userInfoParts = uri.UserInfo.Split(':', 2);
            var username = userInfoParts.Length > 0 ? Uri.UnescapeDataString(userInfoParts[0]) : string.Empty;
            var password = userInfoParts.Length > 1 ? Uri.UnescapeDataString(userInfoParts[1]) : string.Empty;
            var host = uri.Host;
            var port = uri.Port > 0 ? uri.Port : 5432;
            var database = uri.AbsolutePath?.TrimStart('/') ?? string.Empty;

            return $"Host={host};Port={port};Database={database};Username={username};Password={password}";
        }

        var conn = ResolveConnectionString(configuration);
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(conn));
        services.AddScoped<AiVerificationWorkerService>();

        // MassTransit + RabbitMQ
        services.AddMassTransit(x =>
        {
            x.AddConsumer<VerifyAgendaConsumer>();
            x.AddConsumer<VerifySharedAgendaConsumer>();
            x.AddConsumer<VerifyRawClaimConsumer>();

            x.UsingRabbitMq((ctx, cfg) =>
            {
                var rabbitUrl = Environment.GetEnvironmentVariable("RABBITMQ_URL");
                if (!string.IsNullOrEmpty(rabbitUrl))
                {
                    cfg.Host(new Uri(rabbitUrl));
                }
                else
                {
                    var host = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "rabbitmq";
                    var user = Environment.GetEnvironmentVariable("RABBITMQ_USERNAME") ?? "guest";
                    var pass = Environment.GetEnvironmentVariable("RABBITMQ_PASSWORD") ?? "guest";
                    cfg.Host(host, "/", h => { h.Username(user); h.Password(pass); });
                }

                cfg.ReceiveEndpoint("verify-agenda-queue", e =>
                {
                    e.ConfigureConsumer<VerifyAgendaConsumer>(ctx);
                });

                cfg.ReceiveEndpoint("verify-shared-agenda-queue", e =>
                {
                    e.ConfigureConsumer<VerifySharedAgendaConsumer>(ctx);
                });

                cfg.ReceiveEndpoint("verify-raw-claim-queue", e =>
                {
                    e.ConfigureConsumer<VerifyRawClaimConsumer>(ctx);
                });
            });
        });
    })
    .Build();

await host.RunAsync();
