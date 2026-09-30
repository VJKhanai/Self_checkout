function notFound(_req, res) {
  res.status(404).json({ message: 'Route not found' });
}

function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: err.message || 'Something went wrong' });
}

module.exports = { notFound, errorHandler };
