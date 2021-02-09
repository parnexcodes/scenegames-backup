const Site = require('../../models/site');

exports.get = async (req, res, key) => {
  Site.findOne({ key })
    .then((txt) => {
      if (txt) {
        res.status(200).json({
          status: 'success',
          data: txt.value,
        });
      } else {
        res.status(404).json({
          status: 'fail',
          data: { error: `No ${key} found` },
        });
      }
    }).catch(() => {
      res.status(500).json({
        status: 'fail',
        data: { error: `Could not retrieve ${key}` },
      });
    });
};

exports.add = async (req, res, key) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    Site.deleteOne({ key }).then(() => {
      res.status(200).json({
        status: 'success',
        data: null,
      });
    });
  } else {
    const txt = req.body;
    Site.findOneAndUpdate({ key }, { value: txt }, { upsert: true })
      .then(() => {
        res.status(200).json({
          status: 'success',
          data: null,
        });
      }).catch(() => {
        res.status(500).json({
          status: 'fail',
          data: null,
        });
      });
  }
};

exports.getAnnouncement = async (req, res) => this.get(req, res, 'announcement');
exports.addAnnouncement = async (req, res) => this.add(req, res, 'announcement');
exports.getFaq = async (req, res) => this.get(req, res, 'faq');
exports.addFaq = async (req, res) => this.add(req, res, 'faq');
exports.getDonate = async (req, res) => this.get(req, res, 'donate');
exports.addDonate = async (req, res) => this.add(req, res, 'donate');
