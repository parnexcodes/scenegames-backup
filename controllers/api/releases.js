const Release = require('../../models/release');
const Link = require('../../models/link');
const File = require('../../models/file');
const Host = require('../../models/host');

const formatOutput = (release) => release;

exports.getRelease = (req, res) => {
  Release
    .findOne({ name: req.params.releaseName })
    .select('-_id -__v')
    .populate({
      path: 'links',
      select: '-_id -__v -release',
      populate: {
        path: 'host',
        select: '-_id -__v',
      },
    })
    .then((release) => {
      if (release) {
        return res.json({
          status: 'success',
          data: { release: formatOutput(release) },
        });
      }
      return res.status(404).json({
        status: 'fail',
        data: { releaseName: 'No release exists with that name.' },
      });
    });
};

exports.addRelease = async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({
      status: 'fail',
      data: { name: 'You must supply a release name!' },
    });
  }

  const releaseValues = {};

  // Format host counts
  if (req.body.file_counts && typeof req.body.file_counts === 'object') {
    const fileCounts = [];
    for (let i = 0; i < Object.keys(req.body.file_counts).length; i++) {
      const hostKey = Object.keys(req.body.file_counts)[i];
      const count = req.body.file_counts[hostKey];
      // eslint-disable-next-line no-await-in-loop
      const host = await Host.findOne({ key: hostKey }).select('_id');
      if (host && typeof count === 'number') {
        fileCounts.push({ host, count });
      }
    }
    delete req.body.file_counts;
    releaseValues.$set = { file_counts: fileCounts };
  }

  const release = new Release({ ...req.body, ...releaseValues });
  release.save()
    .then((addedRelease) => res.json({
      status: 'success',
      data: {
        release: formatOutput(addedRelease),
      },
    }))
    .catch((err) => {
      if (err.code === 11000) {
        return res.status(400).json({
          status: 'fail',
          data: { name: 'A release already exists with that name.' },
        });
      }
      return res.status(500).json({ status: 'error', message: err.message });
    });

  return false;
};

exports.editRelease = async (req, res) => {
  const releaseValues = {};

  // Format host counts
  if (req.body.file_counts && typeof req.body.file_counts === 'object') {
    const fileCounts = [];
    for (let i = 0; i < Object.keys(req.body.file_counts).length; i++) {
      const hostKey = Object.keys(req.body.file_counts)[i];
      const count = req.body.file_counts[hostKey];
      // eslint-disable-next-line no-await-in-loop
      const host = await Host.findOne({ key: hostKey }).select('_id');
      if (host && typeof count === 'number') {
        fileCounts.push({ host, count });
      }
    }
    delete req.body.file_counts;
    releaseValues.$set = { file_counts: fileCounts };
  }

  // add
  const release = await Release.findOneAndUpdate({ name: req.params.releaseName },
    { ...req.body, ...releaseValues },
    {
      new: true,
      lean: true,
      upsert: false,
      runValidators: true,
    });

  if (release) {
    res.json({
      status: 'success',
      data: { release: formatOutput(release) },
    });
  } else {
    res.status(404).json({
      status: 'fail',
      data: { releaseName: 'No release exists with that name.' },
    });
  }
};

exports.deleteRelease = (req, res) => {
  Release.findOneAndDelete({ name: req.params.releaseName })
    .then((release) => {
      if (release) {
        const delLinks = Link.deleteMany({ release: release._id });
        const delFiles = File.deleteMany({ release: release._id });
        Promise.all([delLinks, delFiles]).then(() => {
          res.json({
            status: 'success',
            data: null,
          });
        });
      } else {
        res.status(404).json({
          status: 'fail',
          data: { releaseName: 'No release exists with that name.' },
        });
      }
    })
    .catch((err) => res.status(500).json({ status: 'error', message: err.message }));
};
