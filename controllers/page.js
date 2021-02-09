const fs = require('fs');
const Site = require('../models/site');
const md = require('../lib/markdown');

exports.get = async (key) => {
  const txt = await Site.findOne({ key });
  if (txt) return txt.value;
  return 'No Data';
};

exports.faq = async (req, res) => {
  const lng = req.language;
  let parsed = '';
  let text = 'Error';
  const pageLang = `./locales/${lng}/pages/faq.md`;

  if (fs.existsSync(pageLang)) {
    try {
      text = fs.readFileSync(pageLang);
    } catch (error) {
      text = 'Error';
    }
  } else {
    text = fs.readFileSync('./views/pages/faq.md'); // Fallback to english
  }

  if (text) {
    parsed = md.render(text.toString());
  }
  res.render('page', {
    title: req.t('common:-:FAQ'),
    content: parsed,
  });
};
