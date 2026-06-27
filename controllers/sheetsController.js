import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { notFoundError } from '../utils/httpError.js';
import { throwIfSupabaseError } from '../utils/supabaseError.js';
import { generateSolutionDetails } from '../utils/solutionGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cachePath = path.resolve(__dirname, '../db/solutions_cache.json');

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const loadCache = async () => {
  try {
    const data = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
};

const saveCache = async (cache) => {
  try {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write solution cache:', err);
  }
};

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
      .select('id, topic_id, title, difficulty, leetcode_url, video_url, created_at, order_index')
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

export const getQuestionBySlug = async (req, res) => {
  const { slug } = req.params;
  const client = catalogClient();

  const { data: questions, error } = await client
    .from('questions')
    .select('id, title, difficulty, leetcode_url, video_url, topic_id, topics (sheet_id)');

  throwIfSupabaseError(error);

  const question = questions.find((q) => slugify(q.title) === slug);

  if (!question) {
    throw notFoundError('Question not found');
  }

  const cache = await loadCache();
  let solutionDetails = cache[question.id];

  if (!solutionDetails) {
    try {
      console.log(`[getQuestionBySlug] Cache miss for ${question.title}. Generating solutions...`);
      solutionDetails = await generateSolutionDetails(question.title, question.difficulty);
      cache[question.id] = solutionDetails;
      await saveCache(cache);
    } catch (err) {
      console.error(`[getQuestionBySlug] Failed to generate solution for ${question.title}:`, err);
      solutionDetails = {
        description: 'Failed to generate solution explanation. Please check your network or try again later.',
        time_complexity: 'N/A',
        space_complexity: 'N/A',
        solution_cpp: '// Solution unavailable. Please try again.',
        solution_java: '// Solution unavailable. Please try again.',
        solution_python: '# Solution unavailable. Please try again.',
        solution_javascript: '// Solution unavailable. Please try again.',
      };
    }
  }

  res.status(200).json({
    question,
    details: solutionDetails,
  });
};

