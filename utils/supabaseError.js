import { HttpError } from './httpError.js';

export const throwIfSupabaseError = (error, fallbackStatusCode = 400) => {
  if (!error) return;

  const statusCode = error.status || error.statusCode || fallbackStatusCode;
  throw new HttpError(statusCode, error.message || 'Supabase request failed');
};
