const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route Not Found',
    path: req.originalUrl
  });
};

module.exports = notFoundHandler;

