const express   = require('express');
const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const auth      = require('../middleware/auth');
const router    = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ error: 'Server misconfiguration. Contact the administrator.' });
    }
    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.get('/verify', auth, (_req, res) => res.json({ ok: true }));

module.exports = router;
