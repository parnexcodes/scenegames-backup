exports.getIp = (req, res) => {
  res.json({
    status: 'success',
    data: req.ip,
  });
};
