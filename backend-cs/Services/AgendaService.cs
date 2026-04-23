/// <summary>
/// Processes the actual business logic for agendas before talking to the database.
/// 
/// Key Operations:
/// - GetUserAgendasAsync: Looks up all agendas matching a specific user ID in the database.
/// - CreateAgendaAsync: Saves a new agenda to the database.
/// - DeleteAgendaAsync: Finds an agenda, checks if the user owns it, and deletes it permanently.
/// - GetAgendaByShareTokenAsync: Allows anyone with a secret public link to view an agenda without logging in.
/// </summary>
using Microsoft.EntityFrameworkCore;
using AgendaCS.Backend.Data;
using AgendaCS.Backend.Dto;
using AgendaCS.Backend.Entities;

namespace AgendaCS.Backend.Services;

public class AgendaService : IAgendaService
{
    private readonly AppDbContext _context;

    public AgendaService(AppDbContext context)
    {
        _context = context;
    }

    private AgendaDto MapToDto(Agenda a, string? ownerName, bool includeShareToken = true)
    {
        AnalysisResultDto? analysis = null;
        if (!string.IsNullOrEmpty(a.AnalysisScore))
        {
            analysis = new AnalysisResultDto(
                a.AnalysisScore,
                a.AnalysisReasoning ?? "",
                a.Title,
                true, // IsCached default
                false, // IsStale default
                a.AnalysisArticleCount
            );
        }
        return new AgendaDto(
            a.Id, a.UserId, a.Title, a.CreatedAt, 
            includeShareToken ? a.ShareToken : null, 
            ownerName, 
            analysis);
    }

    public async Task<AgendaDto> CreateAgendaAsync(int userId, CreateAgendaDto dto)
    {
        var agenda = new Agenda
        {
            UserId = userId,
            Title = dto.Title,
            ShareToken = Guid.NewGuid().ToString("N")
        };

        _context.Agendas.Add(agenda);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);
        return MapToDto(agenda, user?.Name);
    }

    public async Task<bool> DeleteAgendaAsync(int id, int userId)
    {
        var agenda = await _context.Agendas.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (agenda == null) return false;

        _context.Agendas.Remove(agenda);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AgendaDto?> GetAgendaByIdAsync(int id, int userId)
    {
        var agenda = await _context.Agendas
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (agenda == null) return null;

        return MapToDto(agenda, agenda.User?.Name);
    }

    public async Task<AgendaDto?> GetAgendaByShareTokenAsync(string shareToken)
    {
        var agenda = await _context.Agendas
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.ShareToken == shareToken);

        if (agenda == null) return null;

        return MapToDto(agenda, agenda.User?.Name, false); // false = null out shareToken for safety
    }

    public async Task<List<AgendaDto>> GetUserAgendasAsync(int userId)
    {
        var agendas = await _context.Agendas
            .Include(a => a.User)
            .Where(a => a.UserId == userId)
            .ToListAsync();
            
        return agendas.Select(a => MapToDto(a, a.User?.Name)).ToList();
    }
}


