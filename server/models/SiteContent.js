const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: String,
  type:  { type: String, enum: ['text', 'image', 'json'], default: 'text' },
});

siteContentSchema.index({ key: 1 });

module.exports = mongoose.models.SiteContent || mongoose.model('SiteContent', siteContentSchema);
