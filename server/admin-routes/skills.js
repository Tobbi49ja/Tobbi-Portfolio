const express   = require('express');
const auth      = require('../middleware/auth');
const Skill     = require('../models/Skill');
const connectDB = require('../db');
const router    = express.Router();

const ALLOWED_FIELDS = ['name', 'percent', 'category', 'order'];

function pick(obj) {
  const result = {};
  ALLOWED_FIELDS.forEach(f => { if (f in obj) result[f] = obj[f]; });
  return result;
}

async function withDB(res, fn) {
  try {
    await connectDB();
  } catch {
    return res.status(503).json({ error: 'Database unavailable. Please try again.' });
  }
  return fn();
}

// Public — get all skills
router.get('/', (req, res) => withDB(res, async () => {
  try {
    const skills = await Skill.find().sort({ category: 1, order: 1 }).lean();
    res.json(skills);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load skills.' });
  }
}));

router.post('/', auth, (req, res) => withDB(res, async () => {
  try {
    const data = pick(req.body);
    if (!data.name)     return res.status(400).json({ error: 'Name is required.' });
    if (!data.category) return res.status(400).json({ error: 'Category is required.' });
    const skill = await Skill.create(data);
    res.status(201).json(skill);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}));

router.put('/:id', auth, (req, res) => withDB(res, async () => {
  try {
    const data = pick(req.body);
    const skill = await Skill.findByIdAndUpdate(
      req.params.id, { $set: data }, { new: true, runValidators: true }
    );
    if (!skill) return res.status(404).json({ error: 'Skill not found.' });
    res.json(skill);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}));

router.delete('/:id', auth, (req, res) => withDB(res, async () => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found.' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete skill.' });
  }
}));

module.exports = router;
