const { model, Schema } = require('mongoose');

const hostSchema = new Schema({
  key: { type: String, unique: true, required: true },
  name: { type: String, required: true },
});

module.exports = model('Host', hostSchema);
