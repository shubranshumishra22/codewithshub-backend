import { addDaysDateString } from '../utils/date.js';
import { badRequest, notFoundError } from '../utils/httpError.js';
import { throwIfSupabaseError } from '../utils/supabaseError.js';

const getSheetQuestionIds = async (client, sheetId) => {
  const { data: topics, error: topicsError } = await client
    .from('topics')
    .select('id')
    .eq('sheet_id', sheetId);

  throwIfSupabaseError(topicsError);

  const topicIds = topics.map((topic) => topic.id);

  if (topicIds.length === 0) {
    return [];
  }

  const { data: questions, error: questionsError } = await client
    .from('questions')
    .select('id, topic_id, title, difficulty, order_index')
    .in('topic_id', topicIds)
    .order('order_index', { ascending: true });

  throwIfSupabaseError(questionsError);

  return questions;
};

export const getProgressBySheet = async (req, res) => {
  const { sheetId } = req.params;
  const questions = await getSheetQuestionIds(req.supabase, sheetId);
  const questionIds = questions.map((question) => question.id);

  let progressRows = [];

  if (questionIds.length > 0) {
    const { data, error } = await req.supabase
      .from('user_progress')
      .select('id, question_id, is_solved, solved_at, notes')
      .eq('user_id', req.user.id)
      .in('question_id', questionIds);

    throwIfSupabaseError(error);
    progressRows = data;
  }

  const progressByQuestion = progressRows.reduce((acc, progress) => {
    acc[progress.question_id] = progress;
    return acc;
  }, {});

  res.status(200).json({
    progress: questions.map((question) => {
      const progress = progressByQuestion[question.id];

      return {
        question_id: question.id,
        title: question.title,
        difficulty: question.difficulty,
        is_solved: progress?.is_solved || false,
        solved_at: progress?.solved_at || null,
        notes: progress?.notes || null,
      };
    }),
  });
};

export const markQuestionSolved = async (req, res) => {
  const { question_id } = req.body;

  if (!question_id) {
    throw badRequest('question_id is required');
  }

  const { data: question, error: questionError } = await req.supabase
    .from('questions')
    .select('id')
    .eq('id', question_id)
    .maybeSingle();

  throwIfSupabaseError(questionError);

  if (!question) {
    throw notFoundError('Question not found');
  }

  const solvedAt = new Date().toISOString();

  const { data: progress, error: progressError } = await req.supabase
    .from('user_progress')
    .upsert(
      {
        user_id: req.user.id,
        question_id,
        is_solved: true,
        solved_at: solvedAt,
      },
      { onConflict: 'user_id,question_id' },
    )
    .select('id, user_id, question_id, is_solved, solved_at, notes')
    .single();

  throwIfSupabaseError(progressError);

  const { data: profile, error: profileError } = await req.supabase
    .from('profiles')
    .select('revision_intervals')
    .eq('id', req.user.id)
    .single();

  throwIfSupabaseError(profileError);

  const revisionRows = (profile.revision_intervals || []).map((revisionDay) => ({
    user_id: req.user.id,
    question_id,
    revision_day: revisionDay,
    due_date: addDaysDateString(revisionDay),
    is_completed: false,
    completed_at: null,
  }));

  let revisionSchedule = [];

  if (revisionRows.length > 0) {
    const { data, error } = await req.supabase
      .from('revision_schedule')
      .upsert(revisionRows, {
        onConflict: 'user_id,question_id,revision_day',
      })
      .select('id, question_id, revision_day, due_date, is_completed, completed_at');

    throwIfSupabaseError(error);
    revisionSchedule = data;
  }

  res.status(201).json({
    progress,
    revision_schedule: revisionSchedule,
  });
};

export const unmarkQuestionSolved = async (req, res) => {
  const { questionId } = req.params;

  const { data: progress, error: progressError } = await req.supabase
    .from('user_progress')
    .update({
      is_solved: false,
      solved_at: null,
    })
    .eq('user_id', req.user.id)
    .eq('question_id', questionId)
    .select('id, user_id, question_id, is_solved, solved_at, notes')
    .maybeSingle();

  throwIfSupabaseError(progressError);

  const { error: revisionError } = await req.supabase
    .from('revision_schedule')
    .delete()
    .eq('user_id', req.user.id)
    .eq('question_id', questionId);

  throwIfSupabaseError(revisionError);

  res.status(200).json({ progress, message: 'Question marked as unsolved' });
};
