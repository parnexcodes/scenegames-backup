const Link = require('../../models/link');
const Host = require('../../models/host');
const Release = require('../../models/release');

exports.addLink = async (req, res, next) => {
  if (!req.body.release || !req.body.host || !req.body.name || !req.body.link) {
    return res.status(400).json({
      status: 'fail',
      data: { name: 'You must supply a release name!' },
    });
  }

  const release = await Release.findOne({ name: req.body.release }).select('_id');
  if (!release) {
    return res.status(404).json({
      status: 'fail',
      data: { releaseName: 'No release exists with that name.' },
    });
  }

  const host = await Host.findOne({ key: req.body.host }).select('_id');
  if (!host) {
    return res.status(404).json({
      status: 'fail',
      data: { releaseName: `No host found with key: ${req.body.host}` },
    });
  }

  const link = new Link({
    release: release._id,
    host: host._id,
    name: req.body.name,
    link: req.body.link,
  });

  const savedLink = await link.save();
  if (savedLink) {
    const updateRelease = Release.updateOne({ _id: release.id }, {
      $push: { links: savedLink._id },
      $addToSet: { hosts: host._id },
    }).exec();

    if (!updateRelease) {
      return res.status(500).json({ status: 'fail', data: 'Failed to add link to release' });
    }

    return res.json({ status: 'success', data: null });
  }
  return next();
};

exports.removeLinks = async (req, res) => {
  if (!req.params.releaseName) {
    return res.status(400).json({
      status: 'fail',
      data: 'Supply a release name.',
    });
  }

  const release = await Release.findOne({ name: req.params.releaseName }).select('_id');
  if (!release) {
    return res.status(404).json({
      status: 'fail',
      data: { releaseName: 'No release exists with that name.' },
    });
  }

  const deleteQuery = { release: release._id };

  if (req.params.host) {
    const host = await Host.findOne({ key: req.params.host }).select('_id');
    if (!host) {
      return res.status(404).json({
        status: 'fail',
        data: { host: `No host found with key: ${req.params.host}` },
      });
    }

    deleteQuery.host = host._id;
  }

  // File name supplied via JSON
  if (req.body.name) {
    deleteQuery.name = req.body.name;
  }

  // Get link ids to delete
  const links = await Link.find(deleteQuery).select('_id');

  const deleteLinks = await Link.deleteMany(deleteQuery);

  // Delete refs in Release
  await release.updateOne({
    $pull: {
      links: {
        $in: links,
      },
      // Only remove host if host is specified
      ...(deleteQuery.host ? { hosts: deleteQuery.host } : {}),
    },
    // Only remove all hosts if host is unspecified
    ...(!deleteQuery.host ? { $unset: { hosts: '' } } : {}),
  });

  return res.json({ status: 'success', data: deleteLinks.deletedCount });
};
