import { todayDateString, yesterdayDateString } from '../utils/date.js';
import { badRequest } from '../utils/httpError.js';
import { throwIfSupabaseError } from '../utils/supabaseError.js';
import { supabaseAdmin } from '../config/supabase.js';

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

  const today = todayDateString();
  const yesterday = yesterdayDateString();
  const isStreakActive = data.last_activity_date === today || data.last_activity_date === yesterday;

  const profile = {
    ...data,
    streak_count: isStreakActive ? (data.streak_count || 0) : 0,
  };

  res.status(200).json({ profile });
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

  const today = todayDateString();
  const yesterday = yesterdayDateString();
  const isStreakActive = data.last_activity_date === today || data.last_activity_date === yesterday;

  const profile = {
    ...data,
    streak_count: isStreakActive ? (data.streak_count || 0) : 0,
  };

  res.status(200).json({ profile });
};

export const updateStreakOnActivity = async (supabase, userId) => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, streak_count, last_activity_date')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching profile for streak update:', profileError);
    return;
  }

  const today = todayDateString();
  const yesterday = yesterdayDateString();

  let nextStreakCount = profile.streak_count || 0;

  if (profile.last_activity_date === today) {
    return; // Already active today, streak doesn't change
  } else if (profile.last_activity_date === yesterday) {
    nextStreakCount += 1;
  } else {
    nextStreakCount = 1;
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      streak_count: nextStreakCount,
      last_activity_date: today,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating streak count:', error);
  }
};

export const updateStreak = async (req, res) => {
  await updateStreakOnActivity(req.supabase, req.user.id);

  const { data, error } = await req.supabase
    .from('profiles')
    .select('id, streak_count, last_activity_date')
    .eq('id', req.user.id)
    .single();

  throwIfSupabaseError(error);

  res.status(200).json({ profile: data });
};

export const getLeaderboard = async (req, res) => {
  const client = supabaseAdmin || req.supabase;
  const { data, error } = await client
    .from('profiles')
    .select('id, username, avatar_url, streak_count, last_activity_date');

  throwIfSupabaseError(error);

  const today = todayDateString();
  const yesterday = yesterdayDateString();

  const leaderboard = data.map((user) => {
    const isStreakActive = user.last_activity_date === today || user.last_activity_date === yesterday;
    return {
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      streak_count: isStreakActive ? (user.streak_count || 0) : 0,
    };
  });

  leaderboard.sort((a, b) => {
    if (b.streak_count !== a.streak_count) {
      return b.streak_count - a.streak_count;
    }
    return (a.username || '').localeCompare(b.username || '');
  });

  res.status(200).json({ leaderboard });
};
