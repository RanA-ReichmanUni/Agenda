using Microsoft.EntityFrameworkCore;
using AgendaCS.Backend.Entities;

namespace AgendaCS.Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Agenda> Agendas { get; set; }
    public DbSet<Article> Articles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // Configure Agenda
        modelBuilder.Entity<Agenda>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(a => a.User)
                  .WithMany(u => u.Agendas)
                  .HasForeignKey(a => a.UserId);
        });

        // Configure Article
        modelBuilder.Entity<Article>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(a => a.Agenda)
                  .WithMany(ag => ag.Articles)
                  .HasForeignKey(a => a.AgendaId);
        });
    }
}
