const { model, Schema } = require('mongoose');

const siteSchema = new Schema({
  key: { type: String, unique: true, required: true },
  value: { type: String, trim: true, required: true },
});

module.exports = model('Site', siteSchema);
