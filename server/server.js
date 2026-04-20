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
app.use(express.static(path.join(__dirname, '../client')));

// ── API routes ──────────────────────────────────────────────────────────────
app.use('/api/admin',         require('./admin-routes/auth'));
app.use('/api/admin/upload',  require('./admin-routes/upload'));
app.use('/api/projects',      require('./admin-routes/projects'));
app.use('/api/skills',        require('./admin-routes/skills'));
app.use('/api/content',       require('./admin-routes/content'));
app.use('/api',               require('./email-routes/api'));

// ── Page routes ─────────────────────────────────────────────────────────────
const page = (name) => path.join(__dirname, `../client/${name}/index.html`);

app.get('/',            (_req, res) => res.sendFile(page('home')));
app.get('/about',       (_req, res) => res.sendFile(page('about')));
app.get('/projects',    (_req, res) => res.sendFile(page('projects')));
app.get('/contact',     (_req, res) => res.sendFile(page('contact')));
app.get('/cv',          (_req, res) => res.sendFile(page('cv')));
app.get('/admin',       (_req, res) => res.sendFile(page('admin')));
app.get('/preview-index.html', (_req, res) => res.sendFile(page('preview')));

// ── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).sendFile(path.join(__dirname, '../client/error/index.html')));

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
