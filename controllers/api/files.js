const fs = require('fs');
const path = require('path');
const Release = require('../../models/release');
const File = require('../../models/file');

const validFileTypes = require('../../lib/validFileTypes');

exports.addFile = async (req, res, next) => {
  if (!req.params.releaseName) {
    return res.status(400).json({
      status: 'fail',
      data: 'Invalid params',
    });
  }

  const release = await Release.findOne({ name: req.params.releaseName }).select('_id files');
  if (!release) {
    return res.status(404).json({
      status: 'fail',
      data: { releaseName: 'No release exists with that name.' },
    });
  }

  if (!req.file) {
    return res.status(400).json({
      status: 'fail',
      data: { file: 'You must upload a file.' },
    });
  }

  if (!validFileTypes.includes(req.body.type)) {
    return res.status(415).json({
      status: 'fail',
      data: { type: 'Invalid type.' },
    });
  }

  if (!req.body.name) {
    return res.status(400).json({
      status: 'fail',
      data: { name: 'File name not supplied.' },
    });
  }

  if (!req.file.path) {
    return res.status(500).json({
      status: 'fail',
      data: { name: 'File not uploaded.' },
    });
  }

  const filePath = path.resolve(__dirname, '..', '..', req.file.path);
  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ status: 'fail', data: 'Failed to process file.' });
  }

  // Delete old file first
  await File.deleteMany({ release: release._id, type: req.body.type });

  // Add new file
  const file = new File({
    release: release._id,
    name: req.body.name,
    type: req.body.type,
    file: fs.readFileSync(filePath),
  });

  const savedFile = await file.save();
  if (savedFile) {
    const updateRelease = await Release.updateOne({ _id: release._id }, {
      $set: {
        files: {
          ...release.files,
          [req.body.type]: savedFile._id,
        },
      },
    }).exec();

    if (!updateRelease) {
      return res.status(500).json({ status: 'fail', data: 'Failed to add file to release' });
    }

    fs.unlinkSync(filePath);
    return res.json({ status: 'success', data: null });
  }

  return next();
};

exports.deleteFile = (req, res) => {
  if (req.params.type !== undefined && !validFileTypes.includes(req.params.type)) {
    return res.status(415).json({
      status: 'fail',
      data: { type: 'Invalid type.' },
    });
  }

  Release.findOne({ name: req.params.releaseName })
    .then((release) => {
      if (release) {
        if (req.params.type) {
          // Delete single type of file
          File.deleteOne({ release: release._id, type: req.params.type })
            .then((file) => {
              // Set release files to null
              const updateRelease = Release.updateOne({ _id: release._id }, {
                $set: {
                  files: {
                    ...release.files,
                    [req.params.type]: null,
                  },
                },
              }).exec();

              if (updateRelease) {
                res.json({
                  status: 'success',
                  data: file.deletedCount,
                });
              }
            });
        } else {
          // Delete all files for release
          File.deleteMany({ release: release._id })
            .then((file) => {
              // Set all release files to null
              Release.updateOne({ _id: release._id }, {
                $set: {
                  files: {},
                },
              }).exec();

              res.json({
                status: 'success',
                data: file.deletedCount,
              });
            });
        }
      } else {
        res.status(404).json({
          status: 'fail',
          data: { releaseName: 'No release exists with that name.' },
        });
      }
    })
    .catch((err) => res.status(500).json({ status: 'error', message: err.message }));
};
