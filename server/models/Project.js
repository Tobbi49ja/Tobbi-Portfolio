const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  id:               { type: String, required: true, unique: true },
  title:            { type: String, required: true },
  shortDescription: String,
  writeup:          String,
  writeup2:         String,
  image:            String,
  imagePublicId:    String,
  tags:             [String],
  repoUrl:          { type: String, default: '#' },
  liveDemoUrl:      String,
  featured:         { type: Boolean, default: false },
  order:            { type: Number, default: 0 },
}, { timestamps: true });

projectSchema.index({ featured: 1, order: 1 });

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
