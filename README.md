# Minimal MERN Blog

Simple, modern MERN blog with admin-only JWT auth, Markdown posts, and a clean
typography-focused UI.

## Structure
- `backend/` Express + MongoDB + JWT
- `frontend/` React (Vite) + Tailwind

## Prerequisites
- Node.js 18+
- MongoDB running locally or a cloud URI

## Backend Setup
1. `cd backend`
2. `npm install`
3. Create `.env` in `backend/`:
   - `PORT=5000`
   - `MONGO_URI=mongodb://127.0.0.1:27017/minimal_blog`
   - `JWT_SECRET=change_this_secret`
   - `CLIENT_URL=http://localhost:5173`
   - `ADMIN_EMAIL=admin@example.com`
   - `ADMIN_PASSWORD=admin123`
4. Seed data: `npm run seed`
5. Run server: `npm run dev`

## Frontend Setup
1. `cd frontend`
2. `npm install`
3. Create `.env` in `frontend/`:
   - `VITE_API_URL=http://localhost:5000/api`
4. Run app: `npm run dev`

## API Overview
- `POST /api/auth/login` admin login
- `GET /api/blogs` list published blogs (pagination via `page`, `limit`)
- `GET /api/blogs/:slug` published blog by slug
- `GET /api/admin/blogs` list all blogs (protected)
- `POST /api/admin/blogs` create blog (protected)
- `PUT /api/admin/blogs/:id` update blog (protected)
- `DELETE /api/admin/blogs/:id` delete blog (protected)

## Notes
- Admin JWT stored in `localStorage` on the client.
- Markdown rendered with `react-markdown` + `remark-gfm`, sanitized with `rehype-sanitize`.
