const express   = require('express');
const auth      = require('../middleware/auth');
const Project   = require('../models/Project');
const connectDB = require('../db');
const router    = express.Router();

const ALLOWED_FIELDS = [
  'id', 'title', 'shortDescription', 'writeup', 'writeup2',
  'image', 'imagePublicId', 'tags', 'repoUrl', 'liveDemoUrl',
  'featured', 'order',
];

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

// Public — get all or featured projects
router.get('/', (req, res) => withDB(res, async () => {
  try {
    const filter = req.query.featured === 'true' ? { featured: true } : {};
    const projects = await Project.find(filter).sort({ order: 1 }).lean();
    res.json(projects);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load projects.' });
  }
}));

// Admin — create
router.post('/', auth, (req, res) => withDB(res, async () => {
  try {
    const data = pick(req.body);
    if (!data.title) return res.status(400).json({ error: 'Title is required.' });
    if (!data.id)    return res.status(400).json({ error: 'ID is required.' });
    const project = await Project.create(data);
    res.status(201).json(project);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'A project with that ID already exists.' });
    res.status(400).json({ error: e.message });
  }
}));

// Admin — update
router.put('/:id', auth, (req, res) => withDB(res, async () => {
  try {
    const data = pick(req.body);
    const project = await Project.findByIdAndUpdate(
      req.params.id, { $set: data }, { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}));

// Admin — delete
router.delete('/:id', auth, (req, res) => withDB(res, async () => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete project.' });
  }
}));

module.exports = router;
