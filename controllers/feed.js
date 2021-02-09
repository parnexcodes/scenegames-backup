const cache = require('memory-cache');
const Release = require('../models/release');

exports.releases = async (req, res) => {
  let output = cache.get('rss_releases');
  if (!output) {
    const releases = await Release.find({})
      .select('name date')
      .sort({ date: -1 })
      .limit(30);
    const pubDate = new Date().getTime();
    output = cache.put('rss_releases', { releases, pubDate }, 120 * 1000); // Cache for 120 seconds
  }

  res.set('Content-Type', 'application/rss+xml');
  res.render('feed/releases', output);
};

exports.torrents = async (req, res) => {
  let output = cache.get('rss_torrents');
  if (!output) {
    const releases = await Release.find({ btih: { $ne: null } })
      .select('name date btih')
      .sort({ date: -1 })
      .limit(30);
    const pubDate = new Date().getTime();
    output = cache.put('rss_torrents', { releases, pubDate }, 120 * 1000); // Cache for 120 seconds
  }

  res.set('Content-Type', 'application/rss+xml');
  res.render('feed/torrent', output);
};
