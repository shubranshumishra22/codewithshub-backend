import { createSupabaseForToken, supabase } from '../config/supabase.js';
import { unauthorized } from '../utils/httpError.js';

const getBearerToken = (authorizationHeader = '') => {
  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

export const authMiddleware = async (req, _res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    throw unauthorized('Missing Bearer token');
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw unauthorized('Invalid or expired token');
  }

  req.accessToken = token;
  req.user = data.user;
  req.supabase = createSupabaseForToken(token);

  next();
};
