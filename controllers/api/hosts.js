const Host = require('../../models/host');
const Link = require('../../models/link');
const Release = require('../../models/release');

exports.addHost = (req, res) => {
  if (!req.body.key || !req.body.name) {
    return res.status(400).json({
      status: 'fail',
      data: { name: 'Must supply host key and name' },
    });
  }

  const host = new Host(req.body);
  host.save()
    .then(() => res.json({ status: 'success', data: null }))
    .catch((err) => res.status(500).json({ status: 'error', message: err.message }));

  return false;
};

exports.editHost = async (req, res) => {
  try {
    const host = await Host.findOneAndUpdate({ key: req.params.key }, req.body, {
      new: true,
      lean: true,
      upsert: false,
      runValidators: true,
      fields: { _id: false, __v: false },
    });

    if (!host) {
      return res.status(404).json({
        status: 'fail',
        data: { host: `No host found with key: ${req.params.key}` },
      });
    }

    return res.json({
      status: 'success',
      data: host,
    });
  } catch (error) {
    if (error.codeName === 'DuplicateKey') return res.status(400).json({ status: 'fail', data: { key: `Duplicate key: ${req.body.key}` } });
    return res.status(400).json({ status: 'fail', data: null });
  }
};

exports.getHost = async (req, res) => {
  const host = await Host.findOne({ key: req.params.key }).select('-_id -__v');
  if (!host) {
    return res.status(404).json({
      status: 'fail',
      data: { host: `No host found with key: ${req.params.key}` },
    });
  }

  return res.json({
    status: 'success',
    data: host,
  });
};

exports.deleteHost = async (req, res) => {
  const host = await Host.findOneAndDelete({ key: req.params.key }).select('_id');
  if (!host) {
    return res.status(404).json({
      status: 'fail',
      data: { host: `No host found with key: ${req.params.key}` },
    });
  }

  // Get link ids to delete
  const links = await Link.find({ host: host._id }).select('_id');
  await Link.deleteMany({ host: host._id });
  await Release.updateMany({
    $pull: {
      links: {
        $in: links,
      },
      hosts: host._id,
    },
  });

  return res.json({
    status: 'success',
    data: null,
  });
};

exports.getHosts = async (req, res) => {
  const hosts = await Host.find({}).select('-_id -__v');

  return res.json({
    status: 'success',
    data: hosts,
  });
};
