const Release = require('../../models/release');
const Vote = require('../../models/vote');

exports.addVote = async (req, res, next) => {
  const release = await Release.findOne({ name: req.params.releaseName }).select('_id last_upload');
  if (!release) {
    return res.status(404).json({
      status: 'fail',
      data: { releaseName: 'No release exists with that name.' },
    });
  }

  // Check if allowed to vote
  const lastUpload = new Date(release.last_upload);
  const expireTime = new Date(lastUpload.getTime() + process.env.RELEASE_EXPIRE_SECONDS * 1000);
  if (expireTime.getTime() > new Date().getTime()) {
    return res.status(403).json({ status: 'fail', data: { error: 'Release not old enough to vote on!' } });
  }

  const vote = new Vote({
    release: release._id,
    uuid: req.ip,
  });

  try {
    const savedvote = await vote.save();
    if (savedvote) {
      return res.json({ status: 'success', data: 'Successfully voted!' });
    }
    return res.status(500).json({ status: 'fail', data: { error: 'Could not cast vote.' } });
  } catch (error) {
    if (error.code === 11000) return res.status(500).json({ status: 'fail', data: { error: 'You already voted on this release!' } });
    return res.status(500).json({ status: 'fail', data: null });
  }
};
