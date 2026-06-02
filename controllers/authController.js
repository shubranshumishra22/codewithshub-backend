import { createSupabaseForToken, supabase } from '../config/supabase.js';
import { badRequest, unauthorized } from '../utils/httpError.js';
import { throwIfSupabaseError } from '../utils/supabaseError.js';

const getBearerToken = (authorizationHeader = '') => {
  const [scheme, token] = authorizationHeader.split(' ');
  return scheme === 'Bearer' ? token : null;
};

export const signup = async (req, res) => {
  const { email, password, username, avatar_url } = req.body;

  if (!email || !password) {
    throw badRequest('Email and password are required');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        avatar_url,
      },
    },
  });

  throwIfSupabaseError(error);

  res.status(201).json({
    user: data.user,
    session: data.session,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw badRequest('Email and password are required');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  throwIfSupabaseError(error, 401);

  res.status(200).json({
    user: data.user,
    session: data.session,
  });
};

export const logout = async (req, res) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    throw unauthorized('Missing Bearer token');
  }

  const userSupabase = createSupabaseForToken(token);
  const { error } = await userSupabase.auth.signOut();

  throwIfSupabaseError(error);

  res.status(200).json({ message: 'Logged out successfully' });
};
