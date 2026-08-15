using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TaskTracker.Api.Migrations
{
    /// <inheritdoc />
    public partial class PostgresInitial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Assignee = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tasks", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Tasks",
                columns: new[] { "Id", "Assignee", "DueDate", "Priority", "Status", "Title" },
                values: new object[,]
                {
                    { 1, "Alex", new DateTime(2026, 8, 16, 4, 26, 3, 606, DateTimeKind.Utc).AddTicks(5545), 2, 2, "Setup PostgreSQL database" },
                    { 2, "Maria", new DateTime(2026, 8, 17, 4, 26, 3, 606, DateTimeKind.Utc).AddTicks(5553), 2, 1, "Design React Dashboard" },
                    { 3, "Sam", new DateTime(2026, 8, 18, 4, 26, 3, 606, DateTimeKind.Utc).AddTicks(5554), 1, 0, "Implement CORS Headers" },
                    { 4, "Alex", new DateTime(2026, 8, 19, 4, 26, 3, 606, DateTimeKind.Utc).AddTicks(5555), 0, 0, "Write Unit Tests" },
                    { 5, "Maria", new DateTime(2026, 8, 20, 4, 26, 3, 606, DateTimeKind.Utc).AddTicks(5557), 2, 0, "Deploy Application" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Tasks");
        }
    }
}
