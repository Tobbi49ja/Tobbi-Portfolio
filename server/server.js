const express        = require('express');
const path           = require('path');
const dotenv         = require('dotenv');
const cors           = require('cors');
const helmet         = require('helmet');
const morgan         = require('morgan');
const rateLimit      = require('express-rate-limit');
const mongoSanitize  = require('express-mongo-sanitize');
const connectDB      = require('./db');
const seed           = require('./seed');

dotenv.config({ path: path.join(__dirname, '.env') });

const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_PASSWORD'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(k => console.error(`   - ${k}`));
  console.error('\nSet these in Render Dashboard → Environment → Environment Variables');
  console.error('See server/.env.example for the full list.\n');
  process.exit(1);
}

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5000', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(mongoSanitize());

// ── Theme (light/dark) routing ─────────────────────────────────────────────
// OLD portfolio = light (default). NEW portfolio = dark.
// A single `portfolioTheme` cookie drives which static tree each request reads.
const ROOTS = {
  light: 'legacy-client', // OLD portfolio (default)
  dark:  'client',        // NEW portfolio
};
const DEFAULT_THEME = 'light';

// Files that differ between the two portfolio trees (assets are shared/identical).
const THEME_STATIC = [
  'styles.css', 'script.js', 'page-data.js', 'experience-counter.js', 'robot-bg.js',
  'projects-data.js', 'error.css', 'error.js',
];

function themeFromRequest(req) {
  const cookie = (req.headers.cookie || '').split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('portfolioTheme='));
  const value = cookie ? cookie.split('=')[1] : null;
  return value === 'dark' || value === 'light' ? value : DEFAULT_THEME;
}

function themePath(theme, relative) {
  return path.join(__dirname, `../${ROOTS[theme]}`, relative);
}

// Shared assets + admin panel (identical in both trees), served from the NEW tree.
app.use('/assets', express.static(path.join(__dirname, '../client/assets')));
app.use('/admin',  express.static(path.join(__dirname, '../client/admin')));

// Theme-specific static files served from the matching tree (by cookie).
app.use((req, res, next) => {
  const name = req.path.replace(/^\//, '');
  if (THEME_STATIC.includes(name)) {
    const theme = themeFromRequest(req);
    return res.sendFile(themePath(theme, name));
  }
  return next();
});

// ── API routes ──────────────────────────────────────────────────────────────
app.use('/api/admin',         require('./admin-routes/auth'));
app.use('/api/admin/upload',  require('./admin-routes/upload'));
app.use('/api/projects',      require('./admin-routes/projects'));
app.use('/api/skills',        require('./admin-routes/skills'));
app.use('/api/content',       require('./admin-routes/content'));
app.use('/api',               require('./email-routes/api'));

// ── Page routes (theme-aware) ───────────────────────────────────────────────
const page = (req, name) => themePath(themeFromRequest(req), `${name}/index.html`);

app.get('/',            (req, res) => res.sendFile(page(req, 'home')));
app.get('/about',       (req, res) => res.sendFile(page(req, 'about')));
app.get('/projects',    (req, res) => res.sendFile(page(req, 'projects')));
app.get('/contact',     (req, res) => res.sendFile(page(req, 'contact')));
app.get('/cv',          (req, res) => res.sendFile(page(req, 'cv')));
app.get('/admin',       (_req, res) => res.sendFile(path.join(__dirname, '../client/admin/index.html')));
app.get('/preview-index.html', (req, res) => res.sendFile(page(req, 'preview')));
app.get('/preview',     (req, res) => res.sendFile(page(req, 'preview')));

// ── 404 (theme-aware) ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).sendFile(themePath(themeFromRequest(req), 'error/index.html')));

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  console.error(`[Error] ${err.message}`);
  res.status(status).json({ error: message });
});

// ── Start ────────────────────────────────────────────────────────────────────
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => { console.log('✅ MongoDB connected'); return seed(); })
    .then(() => app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`)))
    .catch(err => { console.error('❌ Startup error:', err.message); process.exit(1); });
}

module.exports = app;
