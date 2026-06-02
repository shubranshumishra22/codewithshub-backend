import { env } from '../config/env.js';

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: env.nodeEnv === 'production' ? undefined : err.stack,
  });
};
