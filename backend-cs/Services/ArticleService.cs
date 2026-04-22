using Microsoft.EntityFrameworkCore;
using AgendaCS.Backend.Data;
using AgendaCS.Backend.Dto;
using AgendaCS.Backend.Entities;

namespace AgendaCS.Backend.Services;

public class ArticleService : IArticleService
{
    private readonly AppDbContext _context;

    public ArticleService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ArticleDto> CreateArticleAsync(int agendaId, CreateArticleDto dto)
    {
        var article = new Article
        {
            AgendaId = agendaId,
            Title = dto.Title,
            Url = dto.Url,
            Description = dto.Description,
            Image = dto.Image
        };

        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        return new ArticleDto(article.Id, article.Title, article.Url, article.Description, article.Image, article.AgendaId, article.CreatedAt);
    }

    public async Task<bool> DeleteArticleAsync(int id, int agendaId, int userId)
    {
        // First verify the agenda belongs to the user
        var agenda = await _context.Agendas.FirstOrDefaultAsync(a => a.Id == agendaId && a.UserId == userId);
        if (agenda == null) return false;

        var article = await _context.Articles.FirstOrDefaultAsync(a => a.Id == id && a.AgendaId == agendaId);
        if (article == null) return false;

        _context.Articles.Remove(article);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ArticleDto?> GetArticleByIdAsync(int id)
    {
        var article = await _context.Articles.FindAsync(id);
        if (article == null) return null;

        return new ArticleDto(article.Id, article.Title, article.Url, article.Description, article.Image, article.AgendaId, article.CreatedAt);
    }

    public async Task<List<ArticleDto>> GetArticlesByAgendaIdAsync(int agendaId)
    {
        return await _context.Articles
            .Where(a => a.AgendaId == agendaId)
            .Select(a => new ArticleDto(a.Id, a.Title, a.Url, a.Description, a.Image, a.AgendaId, a.CreatedAt))
            .ToListAsync();
    }
}