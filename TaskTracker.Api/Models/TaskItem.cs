using System;
using System.ComponentModel.DataAnnotations;

namespace TaskTracker.Api.Models
{
    // Enum definitions for strict typing
    public enum TaskPriority
    {
        Low,
        Medium,
        High
    }

    public enum TaskStatus
    {
        ToDo,
        InProgress,
        Done
    }

    public class TaskItem
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Task title is required.")]
        [StringLength(100, ErrorMessage = "Title cannot exceed 100 characters.")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Assignee name is required.")]
        public string Assignee { get; set; } = string.Empty;

        [Required]
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        [Required]
        public TaskStatus Status { get; set; } = TaskStatus.ToDo;

        private DateTime _dueDate;

        [Required(ErrorMessage = "Due date is required.")]
        [CustomValidation(typeof(TaskItem), nameof(ValidateDueDate))]
        public DateTime DueDate
        {
            get => _dueDate;
            // Force DateTimeKind.Utc to prevent PostgreSQL Npgsql UTC timestamp exceptions
            set => _dueDate = DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }

        // Custom validation method ensuring due date cannot be set in the past
        public static ValidationResult? ValidateDueDate(DateTime dueDate, ValidationContext context)
        {
            if (dueDate.Date < DateTime.UtcNow.Date)
            {
                return new ValidationResult("Due date cannot be in the past.");
            }

            return ValidationResult.Success;
        }
    }
}