const Vote = require('../../models/vote');
const Release = require('../../models/release');
const queueList = require('../../lib/getQueue');

exports.getQueue = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || false;
  const queue = await queueList(limit);

  res.json({
    status: 'success',
    data: queue,
  });
};


exports.deleteQueue = async (req, res) => {
  if (!req.params.releaseName) {
    const delQueueAll = await Vote.deleteMany({});
    return res.json({ status: 'success', data: delQueueAll.deletedCount });
  }

  const release = await Release.findOne({ name: req.params.releaseName }).select('_id');
  if (!release) {
    return res.status(404).json({
      status: 'fail',
      data: { releaseName: 'No release exists with that name.' },
    });
  }

  const delQueue = await Vote.deleteMany({ release: release._id });
  return res.json({ status: 'success', data: delQueue.deletedCount });
};
