using System;
using System.Threading.Tasks;
using Xunit;
using Microsoft.EntityFrameworkCore;
using AgendaCS.Backend.Data;
using AgendaCS.Backend.Entities;
using AgendaCS.Backend.Services;
using System.Reflection;
using AgendaCS.Backend.Dto;

namespace AgendaCS.Backend.Tests
{
    public class AgendaServiceTests
    {
        // מקימים מסד נתונים וירטואלי נקי שחי רק בזיכרון ה-RAM
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task DeleteAgendaAsync_HackerTriesToDeleteAnotherUserAgenda_ReturnsFalse()
        {
            // ==========================================
            // 1. Arrange (הכנה)
            // ==========================================
            using var context = GetInMemoryDbContext();
            var service = new AgendaService(context);

            int realOwnerId = 1;
            int hackerId = 99; // משתמש זר
            int testAgendaId = 100;

            // "שותלים" במסד הנתונים הווירטואלי אג'נדה סודית ששייכת למשתמש החוקי
            context.Agendas.Add(new Agenda { Id = testAgendaId, UserId = realOwnerId, Title = "My Secret Agenda" });
            await context.SaveChangesAsync();

            // ==========================================
            // 2. Act (פעולה)
            // ==========================================
            // ה"האקר" מנסה למחוק את האג'נדה
            var result = await service.DeleteAgendaAsync(testAgendaId, hackerId);

            // ==========================================
            // 3. Assert (וידוא)
            // ==========================================
            // מוודאים שהשירות בלם אותו והחזיר False (כי ה-UserId לא תאם)
            Assert.False(result);

            // מוודאים שברמת מסד הנתונים - האג'נדה שלנו עדיין שם ולא נמחקה בטעות!
            var agendaInDb = await context.Agendas.FindAsync(testAgendaId);
            Assert.NotNull(agendaInDb);
        }

        
        [Fact]
        public async Task CreateAgendaWithShortTitle_ThrowsArgumentException()
        {
            // ==========================================
            // 1. Arrange (הכנה)
            // ==========================================
            using var context = GetInMemoryDbContext();
            var service = new AgendaService(context);

            int realOwnerId = 1;
  
            var dto = new CreateAgendaDto("my");

             // ==========================================
            // 2. Act
            // ==========================================
            // Call the method, passing the variables directly (without type declarations)
            // To test for an exception, typically you'd use Assert.ThrowsAsync
        
            var exception = await Assert.ThrowsAsync<ArgumentException>(()=>
            service.CreateAgendaAsync(realOwnerId,dto)
            );

            // ==========================================
            // 3. Assert
            // ==========================================
            Assert.NotNull(exception);
            
        }
    }
}