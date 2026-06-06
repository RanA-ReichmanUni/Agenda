FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files from repo root (build with repo root as context)
COPY ./backend-cs/AgendaCS.Backend.csproj ./backend-cs/
COPY ./Agenda.Contracts/Agenda.Contracts.csproj ./Agenda.Contracts/
RUN dotnet restore ./backend-cs/AgendaCS.Backend.csproj

# Copy full repo and build
COPY . .
WORKDIR /src/backend-cs
RUN dotnet build "AgendaCS.Backend.csproj" -c Release -o /app/build
RUN dotnet publish "AgendaCS.Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AgendaCS.Backend.dll"]