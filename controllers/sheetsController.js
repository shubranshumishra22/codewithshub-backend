import { supabase, supabaseAdmin } from '../config/supabase.js';
import { notFoundError } from '../utils/httpError.js';
import { throwIfSupabaseError } from '../utils/supabaseError.js';

const catalogClient = () => supabaseAdmin || supabase;

export const getSheets = async (_req, res) => {
  const { data, error } = await catalogClient()
    .from('sheets')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: true });

  throwIfSupabaseError(error);

  res.status(200).json({ sheets: data });
};

export const getTopicsWithQuestions = async (req, res) => {
  const { id } = req.params;
  const client = catalogClient();

  const { data: sheet, error: sheetError } = await client
    .from('sheets')
    .select('id, name, description, created_at')
    .eq('id', id)
    .maybeSingle();

  throwIfSupabaseError(sheetError);

  if (!sheet) {
    throw notFoundError('Sheet not found');
  }

  const { data: topics, error: topicsError } = await client
    .from('topics')
    .select('id, sheet_id, name, order_index')
    .eq('sheet_id', id)
    .order('order_index', { ascending: true });

  throwIfSupabaseError(topicsError);

  const topicIds = topics.map((topic) => topic.id);
  let questions = [];

  if (topicIds.length > 0) {
    const { data, error } = await client
      .from('questions')
      .select('id, topic_id, title, difficulty, leetcode_url, created_at, order_index')
      .in('topic_id', topicIds)
      .order('order_index', { ascending: true });

    throwIfSupabaseError(error);
    questions = data;
  }

  const questionsByTopic = questions.reduce((acc, question) => {
    acc[question.topic_id] ||= [];
    acc[question.topic_id].push(question);
    return acc;
  }, {});

  res.status(200).json({
    sheet,
    topics: topics.map((topic) => ({
      ...topic,
      questions: questionsByTopic[topic.id] || [],
    })),
  });
};
