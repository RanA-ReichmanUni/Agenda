using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgendaCS.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAiVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AnalysisArticleCount",
                table: "Agendas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnalysisReasoning",
                table: "Agendas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnalysisScore",
                table: "Agendas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastAnalyzedAt",
                table: "Agendas",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnalysisArticleCount",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "AnalysisReasoning",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "AnalysisScore",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "LastAnalyzedAt",
                table: "Agendas");
        }
    }
}
