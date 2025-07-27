# Agenda, Work in Progress

**Agenda** is a web application that allows users to present a **personal agenda or narrative**, and back it up with **reliable external sources**, primarily news articles.

Each **agenda** represents a specific claim or statement (e.g., “Biden is unfit to be president”).  
The user then attaches **articles from reputable news outlets** that serve as evidence supporting the claim.

---

## Use Case

This tool is designed for:
- Structuring personal beliefs or arguments with traceable sources
- Gathering credible evidence for political, social, or personal narratives
- Showcasing a curated, article-based "case" for a point of view
- Simplifying research and content organization

---

## Status: In Progress

This is an ongoing personal project intended to simulate a full production-grade system with a strong emphasis on:
- Scalable backend architecture
- SQL-based persistence (no ORM)
- Modern frontend development
- Real-world development practices (Docker, CI-ready)

---

## Stack & Technologies

| Area       | Tech                                       |
|------------|--------------------------------------------|
| Frontend   | [Next.js](https://nextjs.org/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| Styling    | [TailwindCSS](https://tailwindcss.com/)    |
| Backend    | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/) |
| Database   | [PostgreSQL](https://www.postgresql.org/)  |
| DB Access  | Raw SQL via `pg` (no ORM used)             |
| Dev Env    | [Docker](https://www.docker.com/), `docker-compose` |
| DB Admin   | [pgAdmin](https://www.pgadmin.org/)        |

---



---

## Features Implemented

- [x] Create and list agendas (core narratives)
- [x] Add articles as evidence supporting an agenda
- [x] Store and retrieve all data from PostgreSQL
- [x] RESTful backend built with raw SQL queries (no ORM)
- [x] Dockerized environment with PostgreSQL persistence

---

## Roadmap

- [ ] Delete agendas and articles
- [ ] Tagging or categorization of agendas
- [ ] Public sharing / publishing features
- [ ] Article preview with metadata (image, excerpt)
- [ ] Authentication (future)
- [ ] Responsive design and UI polish

---

## Local Development Setup

```bash
# Start backend + PostgreSQL
docker-compose up --build

# Start frontend (in a second terminal)
cd agenda-frontend
npm install
npm run dev
```

> Access backend on `http://localhost:4000`  
> Access frontend on `http://localhost:3000`

---

## Author

This project is developed by an independent developer with two academic degrees in Computer Science, combining deep theoretical foundations with practical, real-world full-stack engineering experience.
