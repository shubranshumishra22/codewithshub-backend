import { todayDateString, addDaysDateString } from '../utils/date.js';
import { badRequest, notFoundError } from '../utils/httpError.js';
import { throwIfSupabaseError } from '../utils/supabaseError.js';

const getRevisionRows = async (client, userId, fromDate, toDate = fromDate) => {
  const { data: schedules, error: scheduleError } = await client
    .from('revision_schedule')
    .select('id, user_id, question_id, revision_day, due_date, is_completed, completed_at')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .gte('due_date', fromDate)
    .lte('due_date', toDate)
    .order('due_date', { ascending: true });

  throwIfSupabaseError(scheduleError);

  const questionIds = [...new Set(schedules.map((schedule) => schedule.question_id))];
  let questions = [];

  if (questionIds.length > 0) {
    const { data, error } = await client
      .from('questions')
      .select('id, topic_id, title, difficulty, leetcode_url, order_index')
      .in('id', questionIds);

    throwIfSupabaseError(error);
    questions = data;
  }

  const questionsById = questions.reduce((acc, question) => {
    acc[question.id] = question;
    return acc;
  }, {});

  return schedules.map((schedule) => ({
    ...schedule,
    question: questionsById[schedule.question_id] || null,
  }));
};

export const getTodayRevision = async (req, res) => {
  const today = todayDateString();
  const revisions = await getRevisionRows(req.supabase, req.user.id, today);

  res.status(200).json({ revisions });
};

export const getUpcomingRevision = async (req, res) => {
  const today = todayDateString();
  const nextWeek = addDaysDateString(7);
  const revisions = await getRevisionRows(req.supabase, req.user.id, today, nextWeek);

  res.status(200).json({ revisions });
};

export const completeRevision = async (req, res) => {
  const { revision_schedule_id } = req.body;

  if (!revision_schedule_id) {
    throw badRequest('revision_schedule_id is required');
  }

  const { data, error } = await req.supabase
    .from('revision_schedule')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', revision_schedule_id)
    .eq('user_id', req.user.id)
    .select('id, question_id, revision_day, due_date, is_completed, completed_at')
    .maybeSingle();

  throwIfSupabaseError(error);

  if (!data) {
    throw notFoundError('Revision schedule not found');
  }

  res.status(200).json({ revision: data });
};

export const uncompleteRevision = async (req, res) => {
  const { revision_schedule_id } = req.body;

  if (!revision_schedule_id) {
    throw badRequest('revision_schedule_id is required');
  }

  const { data, error } = await req.supabase
    .from('revision_schedule')
    .update({
      is_completed: false,
      completed_at: null,
    })
    .eq('id', revision_schedule_id)
    .eq('user_id', req.user.id)
    .select('id, question_id, revision_day, due_date, is_completed, completed_at')
    .maybeSingle();

  throwIfSupabaseError(error);

  if (!data) {
    throw notFoundError('Revision schedule not found');
  }

  res.status(200).json({ revision: data });
};
