const Release = require('../models/release');
const Host = require('../models/host');

exports.getLinks = async (req, res, next) => {
  // Check if host exists
  const host = await Host.findOne({ key: req.params.host }).select('_id name key');
  if (!host) {
    next();
  }

  const release = await Release.findOne({ name: req.params.releaseName })
    .select('_id name file_count file_counts last_upload')
    .populate({
      path: 'links',
      match: { host: host._id },
      select: '-_id name link',
      options: {
        sort: {
          name: 1,
        },
      },
    });

  let count = null;
  if (!release.$isEmpty('file_counts')) {
    count = release.file_counts.find((c) => c.host.equals(host._id));
    if (count) count = count.count;
  }

  if (release) {
    const verified = (req.hcaptcha && req.hcaptcha.success);
    res.render('links', {
      host,
      count,
      release,
      verified,
    });
  }
};
