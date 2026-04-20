const express      = require('express');
const auth         = require('../middleware/auth');
const SiteContent  = require('../models/SiteContent');
const connectDB    = require('../db');
const router       = express.Router();

const ALLOWED_TYPES = ['text', 'image', 'json'];

async function withDB(res, fn) {
  try {
    await connectDB();
  } catch {
    return res.status(503).json({ error: 'Database unavailable. Please try again.' });
  }
  return fn();
}

// Public — get all content as key→value map
router.get('/', (req, res) => withDB(res, async () => {
  try {
    const items = await SiteContent.find().lean();
    const map = {};
    items.forEach(i => { map[i.key] = i.value; });
    res.json(map);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load content.' });
  }
}));

// Admin — upsert a key
router.put('/:key', auth, (req, res) => withDB(res, async () => {
  try {
    const key = String(req.params.key).trim();
    if (!key) return res.status(400).json({ error: 'Key is required.' });

    const { value, type } = req.body;
    const contentType = type || 'text';

    if (!ALLOWED_TYPES.includes(contentType)) {
      return res.status(400).json({ error: `Type must be one of: ${ALLOWED_TYPES.join(', ')}` });
    }

    const item = await SiteContent.findOneAndUpdate(
      { key },
      { value, type: contentType },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}));

module.exports = router;
