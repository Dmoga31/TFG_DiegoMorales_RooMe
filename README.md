# RooMe: Full-Stack Architecture

## Overview
RooMe is a university-focused web application for students at Universidad Europea del Atlántico (UNEATLANTICO) to find shared housing and roommates. This project is structured as a full-stack, modular, and scalable application.

## Project Structure

```
/roome/
  /frontend/           # Vue.js app (Vercel-ready)
    /src/
      /components/
      /pages/
      /views/
      /store/
      /router/
      /assets/
      App.vue
      main.js
    /public/
    package.json
    vercel.json
  /backend/            # Node.js + Express API (Supabase/Postgres)
    /src/
      /controllers/
      /models/
      /routes/
      /middleware/
      /utils/
      /services/
      app.js
      server.js
    /config/
      db.js
      supabase.js
    package.json
    .env
  /database/
    schema.sql         # PostgreSQL schema (ERD-based)
    seed_students.xlsx # Institutional email list for validation
  README.md
```

## Key Features
- **Authentication:** JWT, bcrypt, role-based middleware, registration with institutional email validation (Excel or Supabase RLS).
- **User Roles:** Student, Admin.
- **Publication Management:** Only 1 active profile and 1 active room per student.
- **Admin Dashboard:** CRUD for users and posts, logs.
- **Database:** Supabase (PostgreSQL).
- **Frontend:** Vue.js, modular components, role-based routing.
- **Deployment:** Vercel (frontend), Supabase (backend/db).

## Deployment
- Frontend: Deploy `/frontend` to Vercel.
- Backend: Deploy `/backend` to a Node.js host or Supabase Edge Functions.
- Database: Use Supabase (PostgreSQL).

## Getting Started
1. Clone the repo.
2. Install dependencies in both `/frontend` and `/backend`.
3. Set up Supabase project and import `/database/schema.sql`.
4. Place `seed_students.xlsx` in `/database/` for email validation.
5. Configure environment variables in `/backend/.env`.
6. Run backend and frontend locally for development.

---

For more details, see the documentation in each folder and the thesis/UML documents.
