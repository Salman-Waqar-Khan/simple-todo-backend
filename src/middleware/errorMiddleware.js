const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error.';
  let errors;

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed.';
    errors = Object.values(error.errors).map((validationError) => ({
      field: validationError.path,
      message: validationError.message
    }));
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${error.path}.`;
  } else if (error.code === 11000) {
    statusCode = 409;
    message = 'A resource with that value already exists.';
  } else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    statusCode = 400;
    message = 'Request body contains invalid JSON.';
  }

  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler
};
