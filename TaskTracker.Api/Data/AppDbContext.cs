using Microsoft.EntityFrameworkCore;
using TaskTracker.Api.Models;
using System;

// Alias to resolve conflict with System.Threading.Tasks.TaskStatus
using MyTaskStatus = TaskTracker.Api.Models.TaskStatus;

namespace TaskTracker.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<TaskItem> Tasks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Seed initial 5 tasks into PostgreSQL
            modelBuilder.Entity<TaskItem>().HasData(
                new TaskItem
                {
                    Id = 1,
                    Title = "Set up database connection",
                    Assignee = "Alice",
                    Priority = TaskPriority.High,
                    Status = MyTaskStatus.Done,
                    DueDate = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(1), DateTimeKind.Utc)
                },
                new TaskItem
                {
                    Id = 2,
                    Title = "Build REST API endpoints",
                    Assignee = "Bob",
                    Priority = TaskPriority.High,
                    Status = MyTaskStatus.InProgress,
                    DueDate = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(2), DateTimeKind.Utc)
                },
                new TaskItem
                {
                    Id = 3,
                    Title = "Design React UI dashboard",
                    Assignee = "Charlie",
                    Priority = TaskPriority.Medium,
                    Status = MyTaskStatus.ToDo,
                    DueDate = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(3), DateTimeKind.Utc)
                },
                new TaskItem
                {
                    Id = 4,
                    Title = "Write unit tests",
                    Assignee = "Alice",
                    Priority = TaskPriority.Low,
                    Status = MyTaskStatus.ToDo,
                    DueDate = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(4), DateTimeKind.Utc)
                },
                new TaskItem
                {
                    Id = 5,
                    Title = "Deploy application to cloud",
                    Assignee = "Dave",
                    Priority = TaskPriority.Medium,
                    Status = MyTaskStatus.ToDo,
                    DueDate = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(5), DateTimeKind.Utc)
                }
            );
        }
    }
}