const queueList = require('../lib/getQueue');

exports.queue = async (req, res) => {
  const queue = await queueList();
  res.render('queue', { queue });
};
