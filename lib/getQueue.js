const Vote = require('../models/vote');

module.exports = (limit = false) => Vote.aggregate([
  {
    $group: {
      _id: '$release',
      votes: { $sum: 1 },
    },
  },
  {
    $sort: {
      votes: -1,
    },
  },
  ...(limit !== false ? [{ $limit: limit }] : []),
  {
    $lookup: {
      from: 'releases',
      localField: '_id',
      foreignField: '_id',
      as: 'release',
    },
  },
  {
    $unwind: '$release',
  },
  {
    $project: {
      _id: false,
      name: '$release.name',
      votes: true,
    },
  },
]);
