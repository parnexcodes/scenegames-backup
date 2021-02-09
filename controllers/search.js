const Release = require('../models/release');
const Site = require('../models/site');
const md = require('../lib/markdown');

exports.search = async (req, res) => {
  let announcement = await Site.findOne({ key: 'announcement' }, 'value');
  if (announcement) announcement = md.render(announcement.value);

  const query = {};
  let searchQuery = null;

  if (req.query.search) {
    searchQuery = req.query.search.trim();
    let term = searchQuery;

    // Extract @grp
    const grpMatch = searchQuery.match(/^(.+ )?@grp ([\dA-z]+)$/);
    if (grpMatch && grpMatch[1]) {
      term = grpMatch[1].trim();
    }

    if (grpMatch && grpMatch[2]) {
      query.group = grpMatch[2].trim();
    }

    // if query doesnt start with @grp then theres a search term
    if (searchQuery.substring(0, 4) !== '@grp') {
      // Try to find exact match first
      const exactRelease = await Release.findOne({ name: term }).populate('hosts');
      if (exactRelease) {
        res.render('index', {
          show_announcement: false,
          announcement,
          searchQuery,
          group: query.group,
          releases: [exactRelease],
        });
        return;
      }

      query.$text = {
        $search: term,
        $caseSensitive: false,
        $diacriticSensitive: false,
      };
    }
  }

  // Releases per page
  const length = 20;

  // Get page number from param
  let page = 1;
  if (!Number.isNaN(req.query.page)) page = parseInt(req.query.page || 1, 10);

  const total = await Release.countDocuments(query);
  const totalPages = Math.ceil(total / length);

  if (page > totalPages) page = totalPages;
  if (page <= 1) page = 1;

  const releases = await Release.find(query)
    .sort({ date: -1 })
    .skip((page - 1) * length)
    .limit(length)
    .populate('hosts');

  res.render('index', {
    show_announcement: !(req.query.search != null),
    announcement,
    releases,
    page,
    totalPages,
    searchQuery,
  });
};
