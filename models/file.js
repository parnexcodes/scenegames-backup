/* eslint-disable func-names, no-plusplus, no-continue */

const { model, Schema } = require('mongoose');
const detect = require('charset-detector');
const stripIndent = require('strip-indent');

const Release = require('./release');

const fileSchema = new Schema({
  release: { type: Schema.Types.ObjectId, ref: Release, required: true },
  name: { type: String, trim: true, required: true },
  type: { type: String, enum: ['nfo', 'sfv', 'file_id'], required: true },
  file: { type: Buffer },
});

function cp437ToString(buffer, start, end) {
  const cp437 = '\u0000☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
  let result = '';
  for (let i = start; i < end; i++) {
    // Fix tabs
    if (buffer[i] === 9) {
      result += '\t';
      i++;
      continue;
    }

    // Fix newlines
    if (buffer[i] === 13 && buffer[i + 1] === 10) {
      i++;
      result += '\n';
      continue;
    }

    if (buffer[i] === 10) {
      result += '\n';
      continue;
    }
    result += cp437[buffer[i]];
  }
  return result;
}

// Convert original file to UTF8 for displaying on the site
fileSchema.virtual('utf8').get(function () {
  const matches = detect(this.file);
  let text = '[ error ]';

  // If it's already UTF-8
  if (matches[0].charsetName === 'UTF-8') {
    text = this.file.toString('utf8');
  } else {
    // else then it's (likely) using DOS encoding
    text = cp437ToString(Buffer.from(this.file), 0, this.file.length);
  }

  // trim trailing spaces
  text = text.replace(/[\t ]+$/gm, '');

  // trim leading spaces
  return stripIndent(text);
});

module.exports = model('File', fileSchema);
