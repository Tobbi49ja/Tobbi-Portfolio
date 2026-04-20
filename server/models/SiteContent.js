const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: String,
  type:  { type: String, enum: ['text', 'image', 'json'], default: 'text' },
});


module.exports = mongoose.models.SiteContent || mongoose.model('SiteContent', siteContentSchema);
