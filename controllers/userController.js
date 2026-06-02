import { todayDateString, yesterdayDateString } from '../utils/date.js';
import { badRequest } from '../utils/httpError.js';
import { throwIfSupabaseError } from '../utils/supabaseError.js';

const validateRevisionIntervals = (revisionIntervals) => {
  if (!Array.isArray(revisionIntervals) || revisionIntervals.length === 0) {
    throw badRequest('revision_intervals must be a non-empty array of positive integers');
  }

  const invalidValue = revisionIntervals.find(
    (interval) => !Number.isInteger(interval) || interval <= 0,
  );

  if (invalidValue !== undefined) {
    throw badRequest('revision_intervals must contain only positive integers');
  }

  return [...new Set(revisionIntervals)].sort((a, b) => a - b);
};

export const getSettings = async (req, res) => {
  const { data, error } = await req.supabase
    .from('profiles')
    .select('id, username, avatar_url, created_at, streak_count, last_activity_date, revision_intervals')
    .eq('id', req.user.id)
    .single();

  throwIfSupabaseError(error);

  res.status(200).json({ profile: data });
};

export const updateSettings = async (req, res) => {
  const revisionIntervals = validateRevisionIntervals(req.body.revision_intervals);

  const { data, error } = await req.supabase
    .from('profiles')
    .update({ revision_intervals: revisionIntervals })
    .eq('id', req.user.id)
    .select('id, username, avatar_url, created_at, streak_count, last_activity_date, revision_intervals')
    .single();

  throwIfSupabaseError(error);

  res.status(200).json({ profile: data });
};

export const updateStreak = async (req, res) => {
  const { data: profile, error: profileError } = await req.supabase
    .from('profiles')
    .select('id, streak_count, last_activity_date')
    .eq('id', req.user.id)
    .single();

  throwIfSupabaseError(profileError);

  const today = todayDateString();
  const yesterday = yesterdayDateString();

  let nextStreakCount = profile.streak_count || 0;

  if (profile.last_activity_date === today) {
    nextStreakCount = profile.streak_count || 1;
  } else if (profile.last_activity_date === yesterday) {
    nextStreakCount += 1;
  } else {
    nextStreakCount = 1;
  }

  const { data, error } = await req.supabase
    .from('profiles')
    .update({
      streak_count: nextStreakCount,
      last_activity_date: today,
    })
    .eq('id', req.user.id)
    .select('id, streak_count, last_activity_date')
    .single();

  throwIfSupabaseError(error);

  res.status(200).json({ profile: data });
};
