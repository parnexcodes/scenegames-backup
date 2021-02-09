const linkifyStr = require('linkifyjs/string');

const Release = require('../models/release');
const File = require('../models/file');
const validFileTypes = require('../lib/validFileTypes');

exports.get = async (req, res, fileType) => {
  const release = await Release.findOne({ name: req.params.releaseName }).select('_id');
  if (!release) {
    return res.status(404).json({
      status: 'fail',
      data: { releaseName: 'No release exists with that name.' },
    });
  }

  const file = await File.findOne({ release: release._id, type: fileType }).select('file name');
  if (file && file.file && file.name) {
    res.set('Content-Disposition', `attachment; filename="${file.name}"`);
    return res.send(file.file);
  }

  return res.status(404).json({
    status: 'fail',
    data: { file: 'File does not exist.' },
  });
};

exports.getNfo = async (req, res) => this.get(req, res, 'nfo');

exports.getSfv = async (req, res) => this.get(req, res, 'sfv');

exports.getFileId = async (req, res) => this.get(req, res, 'file_id');

exports.viewFile = async (req, res, next) => {
  if (!validFileTypes.includes(req.params.type)) {
    next();
  }

  const release = await Release.findOne({ name: req.params.releaseName }).select('_id name');
  if (!release) {
    return res.status(404).render('nfo', { not_found: true });
  }

  const file = await File.findOne({ release: release._id, type: req.params.type }).select('file name type');
  if (file && file.file && file.name) {
    file.str = linkifyStr(file.utf8, {
      className: false,
      validate: {
        url: (value) => /^(http|ftp)s?:\/\//.test(value),
      },
    });
    return res.render('nfo', { file, release, not_found: false });
  }

  return res.status(404).render('nfo', { not_found: true });
};
