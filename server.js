import 'express-async-errors';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

const app = express();

app.use(helmet());
const getOrigins = () => {
  if (!env.clientUrl) return [];
  const baseOrigins = env.clientUrl.split(',').map(o => o.trim().replace(/\/$/, ''));
  const allOrigins = new Set();

  baseOrigins.forEach(origin => {
    allOrigins.add(origin);
    if (origin.includes('://www.')) {
      allOrigins.add(origin.replace('://www.', '://'));
    } else if (origin.includes('://')) {
      allOrigins.add(origin.replace('://', '://www.'));
    }
  });

  return Array.from(allOrigins);
};

const allowedOrigins = getOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin) || normalizedOrigin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
  })
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'DSA Quest API is running',
    health: '/api/health',
  });
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
