using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrustEstate.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminFlagging : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FlagReason",
                table: "InspectionReports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FlaggedAt",
                table: "InspectionReports",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlagged",
                table: "InspectionReports",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FlagReason",
                table: "InspectionReports");

            migrationBuilder.DropColumn(
                name: "FlaggedAt",
                table: "InspectionReports");

            migrationBuilder.DropColumn(
                name: "IsFlagged",
                table: "InspectionReports");
        }
    }
}
