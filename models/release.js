/* eslint-disable func-names */

const { model, Schema } = require('mongoose');
require('mongoose-type-url');

const releaseSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
    unique: true,
  },
  name_search: {
    type: String,
    trim: true,
    lowercase: true,
  },
  group: { type: String, trim: true },
  date: { type: Number, required: true, default: Date.now },
  size: Number,
  file_count: Number,
  file_counts: [
    {
      _id: false,
      host: { type: Schema.Types.ObjectId, ref: 'Host' },
      count: Number,
    },
  ],
  last_upload: { type: Number, default: Date.now },
  hidden: { type: Boolean, default: false },
  files: {
    nfo: { type: Schema.Types.ObjectId, ref: 'File' },
    sfv: { type: Schema.Types.ObjectId, ref: 'File' },
    file_id: { type: Schema.Types.ObjectId, ref: 'File' },
  },
  links: [{ type: Schema.Types.ObjectId, ref: 'Link' }],
  hosts: [{ type: Schema.Types.ObjectId, ref: 'Host' }],
  btih: {
    type: String,
    lowercase: true,
    match: /^[A-Fa-f0-9]+$/,
    minlength: 40,
    maxlength: 40,
    trim: true,
    required: false,
  },
  store_link: { type: Schema.Types.Url, trim: true, required: false },
});

releaseSchema.index({ date: -1 });

releaseSchema.index({
  name_search: 'text',
});

// Set group param from release name
releaseSchema.pre('save', function (next) {
  if (this.name) {
    const match = /^(?:.*-)(.+)/.exec(this.name);
    if (match) {
      const [, group] = match;
      this.group = group;

      // Trim underscores and periods
      this.name_search = this.name.replace(`-${group}`, '').replace(/_|\./g, ' ');
    }
  }
  next();
});

// Re-save if findOneAndUpdate to trigger 'save'
releaseSchema.post('findOneAndUpdate', function () {
  this.model.findOne(this.getQuery())
    .then((rls) => {
      if (rls) rls.save();
    });
});

module.exports = model('Release', releaseSchema);
