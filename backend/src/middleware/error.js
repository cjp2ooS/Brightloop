export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      details: null,
    },
  });
};

export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred';
  const details = err.details || null;

  if (status >= 500) {
    console.error('Unhandled Server Error:', err);
  }

  res.status(status).json({
    error: {
      code,
      message,
      details,
    },
  });
};
