
# Agenda - Evidence Driven Website

**Agenda** is a web application that allows users to present a **personal agenda or narrative**, and back it up with **reliable external sources**, primarily news articles.

Each **agenda** represents a specific claim or statement (e.g., "Biden is unfit to be president" or the contrast, "Biden is a great president").  
The user then attaches **articles from reputable news outlets** that serve as evidence supporting the claim.

The user attaches articles that serve as evidence, and the system **automatically scrapes metadata** (title, thumbnail, description) to generate a rich visual preview. 

Crucially, an integrated **AI Verification Pipeline** then analyzes the actual text content of these sources, cross-referencing them against the user's claim to generate an objective **Credibility Score**, validating whether the cited evidence genuinely supports the stated narrative.

Check out the demo ! https://cutt.ly/Vtl6slaE

![Agenda Front Page](https://i.imgur.com/QcFIh6V.jpeg)
---

## Use Case

This tool is designed for:
- Structuring personal beliefs or arguments with traceable sources
- Gathering credible evidence for political, social, or personal narratives
- Showcasing a curated, article-based "case" for a point of view
- Simplifying research and content organization



---

## Architecture

### Backend (Python FastAPI)
- **Framework**: FastAPI (modern, fast, async)
- **Database**: PostgreSQL
- **Authentication**: JWT tokens with bcrypt password hashing
- **Features**:
  - RESTful API design with router-based architecture
  - Automatic metadata extraction from URLs
  - OpenAPI/Swagger documentation
  - Type validation with Pydantic
  - Raw SQL queries (no ORM used)
  - CORS enabled for frontend
  - Protected endpoints with OAuth2

### Frontend (Vite + React)
- **Framework**: Vite with React 18+
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Authentication**: JWT tokens with localStorage
- **Features**:
  - Lightning-fast HMR (Hot Module Replacement)
  - TypeScript for type safety
  - Modern UI with glassmorphism effects
  - Responsive design
  - Protected routes

---

## Stack & Technologies
**Made using Python FastAPI and Vite + React**


---



## 👨‍💻 Author

This project is developed by an independent developer with two academic degrees in Computer Science, combining deep theoretical foundations with practical, real-world full-stack engineering experience.





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


## Local Development Setup

```powershell
# Start backend + PostgreSQL with Docker
docker-compose up --build

# Start frontend (in a second terminal)
cd frontend
npm install
npm run dev
```

> Access backend on `http://localhost:8000`  
> Access frontend on `http://localhost:5173`

---

## Author

This project is developed by an independent developer with two academic degrees in Computer Science, combining deep theoretical foundations with practical, real-world full-stack engineering experience.
