const MarkdownIt = require('markdown-it');
const MarkdownItColor = require('markdown-it-color').default;

const md = MarkdownIt({
  linkify: true,
  breaks: true,
}).use(MarkdownItColor, { inline: true });

module.exports = md;
