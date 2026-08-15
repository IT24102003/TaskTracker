using Microsoft.EntityFrameworkCore;
using TaskTracker.Api.Data;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Controllers & Convert Enums to Strings in JSON (Low/Medium/High, ToDo/InProgress/Done)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// 2. Register DbContext with PostgreSQL Connection String from appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 3. Configure CORS Policy to allow requests from React frontend
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// 4. Enable CORS Middleware (Must be before MapControllers)
app.UseCors("AllowAll");

app.MapControllers();

app.Run();