const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  percent:  { type: Number, required: true, min: 0, max: 100 },
  category: { type: String, enum: ['Technical', 'Professional'], required: true },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

skillSchema.index({ category: 1, order: 1 });

module.exports = mongoose.models.Skill || mongoose.model('Skill', skillSchema);
