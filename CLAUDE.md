# Tobbi Portfolio — CLAUDE.md

## Stack

**Frontend** — Vanilla HTML5/CSS3/JavaScript (no build step, static files served from `client/`)
**Backend** — Node.js + Express.js (`server/`)
**Database** — MongoDB via Mongoose ODM
**Auth** — JWT (Bearer token, 8h expiry)
**Email** — Nodemailer + Gmail App Password
**Image storage** — Cloudinary
**File uploads** — Multer (memory storage)
**Deployment** — Vercel (serverless) or Render (long-running)

## Project Structure

```
├── client/               # Static frontend
│   ├── home/             # Home page
│   ├── about/            # About page
│   ├── projects/         # Projects list page
│   ├── contact/          # Contact page
│   ├── admin/            # Admin panel (JWT-protected)
│   ├── preview/          # Project detail preview
│   ├── error/            # 404 page
│   ├── styles.css        # Global styles
│   ├── script.js         # Shared JS (nav, contact form, toast)
│   └── page-data.js      # API data loader (projects, skills, content)
├── server/
│   ├── server.js         # Express app entry point
│   ├── db.js             # Mongoose connection (cached for serverless)
│   ├── seed.js           # One-time DB seed (projects, skills, content)
│   ├── models/           # Mongoose schemas
│   │   ├── Project.js
│   │   ├── Skill.js
│   │   └── SiteContent.js
│   ├── middleware/
│   │   └── auth.js       # JWT Bearer middleware
│   ├── admin-routes/
│   │   ├── auth.js       # POST /api/admin/login, GET /api/admin/verify
│   │   ├── projects.js   # CRUD /api/projects
│   │   ├── skills.js     # CRUD /api/skills
│   │   ├── content.js    # CRUD /api/content/:key
│   │   └── upload.js     # POST/DELETE /api/admin/upload (Cloudinary)
│   ├── email-routes/
│   │   └── api.js        # POST /api/contact
│   ├── .env              # NOT committed — copy from .env.example
│   └── .env.example      # Template for environment variables
├── vercel.json           # Vercel routing config
└── CLAUDE.md             # This file
```

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/projects | — | Get all projects (optional `?featured=true`) |
| POST | /api/projects | JWT | Create project |
| PUT | /api/projects/:id | JWT | Update project |
| DELETE | /api/projects/:id | JWT | Delete project |
| GET | /api/skills | — | Get all skills |
| POST | /api/skills | JWT | Create skill |
| PUT | /api/skills/:id | JWT | Update skill |
| DELETE | /api/skills/:id | JWT | Delete skill |
| GET | /api/content | — | Get all site content as key→value map |
| PUT | /api/content/:key | JWT | Upsert content entry |
| POST | /api/admin/upload | JWT | Upload image to Cloudinary |
| DELETE | /api/admin/upload | JWT | Delete image from Cloudinary |
| POST | /api/admin/login | — | Admin login, returns JWT |
| GET | /api/admin/verify | JWT | Verify JWT is valid |
| POST | /api/contact | — | Send contact email (rate limited: 5/hr) |

## Environment Variables

See `server/.env.example` for the full list. Required vars:
- `MONGODB_URI` — MongoDB Atlas connection string
- `EMAIL_USER` / `EMAIL_PASS` — Gmail + App Password
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
- `ADMIN_PASSWORD` — Admin panel password (plaintext, compared server-side)
- `JWT_SECRET` — Long random string (32+ chars)
- `ALLOWED_ORIGINS` — Comma-separated production origins for CORS

## Local Development

```bash
cd server
cp .env.example .env   # Fill in your values
npm install
npm run dev            # Starts nodemon on http://localhost:5000
```

## Security Notes

- **Rate limiting**: Global 200 req/15min; login 10 req/15min; contact 5 req/hr
- **CORS**: Controlled via `ALLOWED_ORIGINS` env var
- **Input sanitization**: `express-mongo-sanitize` strips `$` operators; all user input validated server-side
- **XSS**: All API data HTML-escaped before `innerHTML` insertion in `page-data.js`
- **JWT**: 8h expiry, Bearer token in `Authorization` header
- **Secrets**: Never commit `.env`; it is in `.gitignore`

## Deployment (Vercel)

Set all environment variables in the Vercel dashboard under Project → Settings → Environment Variables. The `vercel.json` routes all `/api/*` requests to `server/server.js` and serves `client/**` as static files.
