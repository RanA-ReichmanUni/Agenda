// Import necessary namespaces for database and application setup
using Microsoft.EntityFrameworkCore;
using MyCSharpApp;

// Create a builder for configuring the web application
var builder = WebApplication.CreateBuilder(args);

// Register the database context with an in-memory database
builder.Services.AddDbContext<DumpAndForgetContext>(options =>
 // Configure the database context to use an in-memory database named "RemindersDB". 
 // This type of database stores data in memory (RAM) for faster access, 
 // but the data is temporary and will be lost when the application stops.
    options.UseInMemoryDatabase("RemindersDB"));

// Build the web application
var app = builder.Build();

// Seed the database with initial data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DumpAndForgetContext>();
    db.Reminders.AddRange(
        new Reminder { Id = 1, Content = "Buy groceries", IsHandled = false },
        new Reminder { Id = 2, Content = "Call mom", IsHandled = false },
        new Reminder { Id = 3, Content = "Finish project", IsHandled = true }
    );
    db.SaveChanges();
}

// Define an API endpoint to add a new reminder
app.MapPost("/dump", async (DumpAndForgetContext db, Reminder newReminder) =>
{
    db.Reminders.Add(newReminder);
    await db.SaveChangesAsync();
    // Return a 201 Created response with the new reminder's details
    return Results.Created($"/reminders/{newReminder.Id}", newReminder);
});

// Define an API endpoint to retrieve pending reminders
app.MapGet("/reminders/pending", async (DumpAndForgetContext db) =>
{
    // Fetch reminders that are not yet handled
    var pending = await db.Reminders
        .Where(r => r.IsHandled == false)
        .ToListAsync();
    // Return the list of pending reminders as an HTTP 200 OK response
    return Results.Ok(pending);
});

// Start the web application
app.Run();







//2nd file CS muti-threading and DI concepts 


// See https://aka.ms/new-console-template for more information


// 1. פתיחת "המחסן" (אוסף השירותים)
using Microsoft.Extensions.DependencyInjection;

// 2. רישום למלאי (Registration) - מלמדים את המחסן את החוקים
// כאן אתה כותב שורה במחברת: "חוק מספר 1: כשמישהו יבקש ממך IMessageSender, 
// תייצר לו SMSSender חדש".
var services = new ServiceCollection();
services.AddTransient<IMessageSender, SMSSender>();
services.AddTransient<AuthService>();

// 3. בניית המחסן הסופי (ה-Provider שמוכן לחלק אובייקטים)

// This is the most important line in manual DI setup for a console app.
// After registering all the rules (services) in the ServiceCollection (like writing recipes in a notebook),
// calling BuildServiceProvider() "locks" the notebook and builds a real engine (ServiceProvider).
// From this point, you can't add more rules, and the ServiceProvider is responsible for creating objects
// according to the rules you defined—it's your "warehouse manager" that knows how to actually instantiate services.

var serviceProvider = services.BuildServiceProvider();


// Here you actively ask the "warehouse manager" (ServiceProvider): "Give me an AuthService now."
// The manager checks the rules, sees that AuthService needs an SMSSender, creates it,
// injects it, and hands you a fully constructed AuthService object.

var authService = serviceProvider.GetRequiredService<AuthService>();

authService.SendLoginCode("Me");


// OR use the service directly without DI, using new keyword:
var smsSender = new SMSSender();
authService = new AuthService(smsSender);
authService.SendLoginCode("Her");





await processTickets();

async Task processTickets()
{
    var ticketManager = new TicketManager();
    var tasks = new List<Task<bool>>();

    for (int i=0; i<10; i++)
    {
        tasks.Add(
            Task.Run(()=>
            {
                return ticketManager.TryBuyTicket();
            }));
    }
    bool[] results = await Task.WhenAll(tasks);
    int successfulPurchases = results.Count(r=>r==true);
    Console.WriteLine($"Total Successful Purchases is: {successfulPurchases}");

}

public interface IMessageSender
{
    void SendMessage(string to, string body);

}

public class EmailSender : IMessageSender
{
    public void SendMessage(string to, string body)
    {
        // Implementation for sending email
    
        Console.WriteLine($"Sending EMAIL to {to} with body: {body}");
    }
}

public class SMSSender : IMessageSender
{
    public void SendMessage(string to, string body)
    {
        // Implementation for sending SMS
    
        Console.WriteLine($"Sending SMS to {to} with body: {body}");
    }
}

public class AuthService
{
    private readonly IMessageSender _messageSender;

    public AuthService(IMessageSender messageSender)
    {
        _messageSender = messageSender;
    }

    public void SendLoginCode(string userContact)
    {
        _messageSender.SendMessage(userContact, "Your login code is: 123456");
      
    } 
}










public class TicketManager
{
    private readonly object syncLock = new object(); 
    private int ticketCount = 1;

    public bool TryBuyTicket()
    {
        lock(syncLock)
        {
            if (ticketCount > 0)
            {
                Console.WriteLine("Processing...");
                ticketCount--;
                return true;
            }
            return false;
        }
    }


}



//3rd file - OOP Concepts - Payment System Example



using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Transactions;
using Microsoft.Extensions.DependencyInjection;

namespace AdvancedPaymentSystem
{
    // ==========================================
    // 1. Database (Do not change this class)
    // ==========================================
    public class TransactionDatabase
    {
        public void SaveTransaction(decimal amount, bool isSuccess)
        {
            if (new Random().Next(0, 2) == 0)
                throw new Exception("FATAL: Database connection lost!");
            Console.WriteLine($"[DB] Transaction of {amount} saved. Status: {isSuccess}");
        }
    }

    // ==========================================
    // 2. Interfaces & Base Classes
    // ==========================================
    
    // TODO: הוסף לכאן את הפונקציות/מאפיינים שספק תשלום חייב לממש
    public interface IPaymentProvider
    {
        string ProviderName { get; }
        void ProcessPayment(decimal amount);
    }

    // TODO: הפוך את המחלקה הזו לבסיס חכם שמונע שכפול קוד. 
    // היא צריכה לממש את הממשק, ולהכיל פונקציה שהבנים חייבים לממש, ועוד פונקציה שהבנים יכולים לדרוס או להשתמש בה כמות שהיא.
    public abstract class BasePaymentProvider : IPaymentProvider
    {
        public string ProviderName{get;} = "DefaultProvider";
        
        public BasePaymentProvider(string name)
        {
            ProviderName = name;
        }

        public virtual void ProcessPayment(decimal amount)
        {
            Console.WriteLine($"Processing {amount}...");
        }

        public abstract void PrintName();
 
        
    }

    // ==========================================
    // 3. Concrete Implementations
    // ==========================================

    public class CreditCardProvider : BasePaymentProvider // TODO: ירש ממה שצריך וממש
    {
     
        public CreditCardProvider():base("CreditCardProvider")
        {}

        public override void PrintName()
        {
            Console.WriteLine($"My Name is {ProviderName}");
        }
        
        
    }

    public class PayPalProvider : BasePaymentProvider // TODO: ירש ממה שצריך וממש
    {

        public PayPalProvider():base("PayPal")
        {}

        public override void PrintName()
        {
            Console.WriteLine($"My Name is {ProviderName}");
        }
        
    }

    // ==========================================
    // 4. The Core Manager (DI & Events & Try-Catch)
    // ==========================================

    public class PaymentManager
    {
        // TODO: הגדר כאן את האירוע (Event). הוא צריך להעביר הלאה את הסכום ואת הסטטוס (הצלחה/כישלון).
        public event Action<decimal,bool>? doneEvent;

        private List<IPaymentProvider> providers = new List<IPaymentProvider>();

        private TransactionDatabase transaction;

        // TODO: בנה בנאי שמקבל את רשימת הספקים (IEnumerable) ואת ה-Database בהזרקת תלויות (DI).
        public PaymentManager(IEnumerable<IPaymentProvider> payments,TransactionDatabase transaction)
        {
            this.transaction = transaction;

            foreach(IPaymentProvider payment in payments)
            {
                providers.Add(payment);          
            }
            
        }
        // TODO: כתוב פונקציה ProcessPayment(string providerName, decimal amount)
        // 1. מצא את הספק המתאים מהרשימה לפי השם. אם לא נמצא - זרוק שגיאה.
        // 2. נסה לבצע חיוב דרך הספק.
        // 3. נסה לשמור ל-DB בעזרת בלוק try-catch כדי למנוע קריסה.
        // 4. בסוף הכל - הפעל את האירוע שלך.

        public void ProcessPayment(string providerName, decimal amount)
        {
            bool isSuccess = false;
            foreach(IPaymentProvider provider in providers)
            {
                if (string.Equals(provider.ProviderName, providerName, StringComparison.OrdinalIgnoreCase))
                {
                    try{
                        provider.ProcessPayment(amount);
                        transaction.SaveTransaction(amount, true);
                        isSuccess=true;
                    }
                    catch (Exception ex)
                    {
                       Console.WriteLine($"Error processing payment with {providerName}: {ex.Message} !");
                    }
                }
            }

            doneEvent?.Invoke(amount,isSuccess);

        }
    }

    // ==========================================
    // 5. The Subscriber
    // ==========================================

    public class ReceiptSender
    {
        // TODO: כתוב פונקציה שתתאים לחתימה של האירוע, ותדפיס "Receipt sent" רק אם התשלום הצליח.

        public void printer(decimal amount,bool status)
        {
            if (status == true)
                Console.WriteLine($"Suceessful Transaction of {amount}");
            else
                Console.WriteLine($"Transaction Failed !!!");

        }
    
    }

    // ==========================================
    // 6. Application Entry Point
    // ==========================================

    class Program
    {
        static void Main(string[] args)
        {
            // TODO: הקם את "מחסן ה-DI" (ידנית, כמו שעשינו בשיעור הקודם).
            // יצר מופע של ה-Database, רשימה של ה-Providers, והזריק אותם ל-PaymentManager.
            var services = new ServiceCollection();
            services.AddTransient<IPaymentProvider, CreditCardProvider>();
            services.AddTransient<IPaymentProvider, PayPalProvider>();
            services.AddTransient<ReceiptSender>();
            services.AddTransient<TransactionDatabase>();

            services.AddTransient <PaymentManager>();
            var serviceProvider = services.BuildServiceProvider();
           
            var paymentManager = serviceProvider.GetRequiredService<PaymentManager>();

            // TODO: יצר את ה-ReceiptSender, ורשום אותו להאזין לאירוע של המנהל (+=).
            var reciptSender = serviceProvider.GetRequiredService<ReceiptSender>();
            paymentManager.doneEvent+=reciptSender.printer;

            // TODO: הפעל את PaymentManager.ProcessPayment פעמיים. פעם עבור CreditCard ופעם עבור PayPal.
            paymentManager.ProcessPayment("creditcardprovider", 100);
            paymentManager.ProcessPayment("paypal", 200);
          
        }
    }
}



//4th file - db and LINQ concepts - Ecommerce Reporting Example

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata.Ecma335; // מדמה את EF Core

namespace EcommerceReporting
{
    // ==========================================
    // 1. Entities & DTOs
    // ==========================================
    
    // TODO: Build Order, OrderItem, and OrderSummaryDto
    public class Order
    {
        public int Id {get;set;}
        public string CustomerName {get;set;} = "NewCustomer";

        public DateTime OrderDate {get;set;}

    }

    public class OrderItem
    {
        public int Id {get;set;}
        public string ProductName{get;set;}

        public decimal Price {get;set;}

        public int OrderId {get;set;}
    }

    public class OrderSummaryDto
    {
        [System.ComponentModel.DataAnnotations.Key]
        public string CustomerName {get;set;}

        public int TotalItems {get;set;}

        public decimal TotalPrice {get;set;}

    }

    // ==========================================
    // 2. Database Context (Mocked for you)
    // ==========================================
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
        // אלו הטבלאות שלך במסד הנתונים
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }

        public DbSet<OrderSummaryDto> OrderSummaries {get;set;}
    }

    // ==========================================
    // 3. The Report Service
    // ==========================================
    
    // TODO: Build OrderReportService
    public class OrderReportService
    {
        
        AppDbContext db {get;}

        public OrderReportService(AppDbContext appDbContext)
        {
            db = appDbContext;

            db.OrderItems.AddRange(
            new OrderItem { Id = 1, ProductName = "Printer", Price = 650, OrderId=1 },
            new OrderItem { Id = 2, ProductName = "PC", Price = 2650, OrderId=2 },
            new OrderItem { Id = 3, ProductName = "Laptop", Price = 1050, OrderId=3 }
            );
            db.Orders.AddRange(
            new Order { Id = 1, CustomerName = "Alice", OrderDate = DateTime.Today.AddDays(-1) },
            new Order { Id = 2, CustomerName = "Bob", OrderDate = DateTime.Today },
            new Order { Id = 3, CustomerName = "Charlie", OrderDate = DateTime.Today }
            );
     
            
            db.SaveChanges();
        }

        public async Task<IEnumerable<OrderSummaryDto>> GetDailyReport(DateTime date)
        {

            var pending = await db.Orders
                .Where(r => r.OrderDate.Date == date.Date)
                .GroupBy(r=> r.CustomerName)
                .Select(g=> new OrderSummaryDto{
                    CustomerName = g.Key,
                    TotalPrice = g.Sum(order => db.OrderItems.Where(c=> c.OrderId==order.Id).Sum(b=>b.Price)),
                    TotalItems = g.Count()
                })
            

                
            
                .ToListAsync();
            
            
            return pending;


            
        }

    }

    // ==========================================
    // 4. Main Application
    // ==========================================
    class Program
    {
        static async Task Main(string[] args)
        {
            // TODO: Setup DI, register services, resolve the service, and execute GetDailyReport(DateTime.Today)
            var services = new ServiceCollection();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("TestDb"));
            services.AddTransient<OrderSummaryDto>();
            services.AddTransient<OrderReportService>();

            var serviceProvider = services.BuildServiceProvider();

            var reportService = serviceProvider.GetRequiredService<OrderReportService>();

            var report = await reportService.GetDailyReport(DateTime.Today);
            foreach (var item in report)
            {
                Console.WriteLine($"Customer: {item.CustomerName}, Total Items: {item.TotalItems}, Total Price: {item.TotalPrice}");
            }
        }
    }
}