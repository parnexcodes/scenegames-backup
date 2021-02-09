const { model, Schema } = require('mongoose');
require('mongoose-type-url');

const linkSchema = new Schema({
  release: { type: Schema.Types.ObjectId, ref: 'Release', required: true },
  host: { type: Schema.Types.ObjectId, ref: 'Host', required: true },
  name: { type: String, trim: true, required: true },
  link: { type: Schema.Types.Url, trim: true, required: true },
});

module.exports = model('Link', linkSchema);
