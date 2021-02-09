/* eslint-disable func-names */

const { model, Schema } = require('mongoose');
const crypto = require('crypto');

const voteSchema = new Schema({
  release: { type: Schema.Types.ObjectId, ref: 'Release', required: true },
  uuid: { type: String, required: true },
});

voteSchema.index({ release: 1, uuid: 1 }, { unique: true });

function hashIp(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

voteSchema.pre('save', function (next) {
  // Store ip address as a hash
  if (!this.isModified('uuid')) return next();
  this.uuid = hashIp(this.uuid);
  return next();
});

voteSchema.pre('find', function () {
  // Convert IP to hash when using find
  if (this.getQuery().uuid) {
    this.where({ uuid: hashIp(this.getQuery().uuid) });
  }
});

module.exports = model('Vote', voteSchema);
