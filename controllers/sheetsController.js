import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { notFoundError } from '../utils/httpError.js';
import { throwIfSupabaseError } from '../utils/supabaseError.js';
import { generateSolutionDetails } from '../utils/solutionGenerator.js';
import { syncCompany } from '../services/githubSync.js';

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
    .select('id, name, description, created_at');

  throwIfSupabaseError(error);

  const filtered = (data || []).filter(
    (s) => s.name !== 'Striver A-Z' && !s.description?.startsWith('Company sheet:')
  );

  const orderMap = {
    'Quest Sheet': 1,
    'Rising Brain Sheet': 1,
    'Google Sheet': 2,
    'Google': 2,
    'Interview Questions': 3,
    'Leetcode Top Interview': 3,
    'Leetcode Top 150': 3,
    'Neetcode 150': 4,
    'AI/ML': 5,
  };

  const sorted = filtered.sort((a, b) => {
    const orderA = orderMap[a.name] ?? 99;
    const orderB = orderMap[b.name] ?? 99;
    return orderA - orderB;
  });

  res.status(200).json({ sheets: sorted });
};

const fetchQuestionsByTopicIds = async (client, topicIds) => {
  if (!topicIds || topicIds.length === 0) return [];
  
  let allQuestions = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const start = page * pageSize;
    const end = start + pageSize - 1;
    
    const { data, error } = await client
      .from('questions')
      .select('id, topic_id, title, difficulty, leetcode_url, video_url, created_at, order_index')
      .in('topic_id', topicIds)
      .order('order_index', { ascending: true })
      .range(start, end);
      
    throwIfSupabaseError(error);
    
    allQuestions = allQuestions.concat(data || []);
    
    if (!data || data.length < pageSize) {
      break;
    }
    page++;
  }
  
  return allQuestions;
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
    .select('id, sheet_id, name, order_index, module, category')
    .eq('sheet_id', id)
    .order('order_index', { ascending: true });

  throwIfSupabaseError(topicsError);

  const topicIds = topics.map((topic) => topic.id);
  const questions = await fetchQuestionsByTopicIds(client, topicIds);

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

export const getCompanySheets = async (_req, res) => {
  const client = catalogClient();
  const { data, error } = await client
    .from('sheets')
    .select('id, name, description, created_at');

  throwIfSupabaseError(error);

  const companySheets = (data || []).filter(
    (s) => s.description?.startsWith('Company sheet:')
  );

  res.status(200).json({ sheets: companySheets });
};

export const getCompanySheetDetails = async (req, res) => {
  const { companyName } = req.params;
  const client = catalogClient();

  // Find the sheet
  let { data: sheet, error: sheetError } = await client
    .from('sheets')
    .select('id, name, description')
    .eq('name', companyName)
    .maybeSingle();

  throwIfSupabaseError(sheetError);

  // If the sheet doesn't exist or doesn't have the Company tag, trigger sync first
  if (!sheet || !sheet.description?.startsWith('Company sheet:')) {
    console.log(`[getCompanySheetDetails] Company ${companyName} not found or untagged. Initializing sync...`);
    try {
      await syncCompany(companyName);
      // Re-fetch
      const { data: newSheet, error: newSheetError } = await client
        .from('sheets')
        .select('id, name, description')
        .eq('name', companyName)
        .single();
      throwIfSupabaseError(newSheetError);
      sheet = newSheet;
    } catch (err) {
      console.error(`[getCompanySheetDetails] Failed to initialize sync for ${companyName}:`, err);
      return res.status(500).json({ error: `Failed to fetch data for ${companyName} from GitHub.` });
    }
  }

  // Now fetch topics and questions
  const { data: topics, error: topicsError } = await client
    .from('topics')
    .select('id, sheet_id, name, order_index')
    .eq('sheet_id', sheet.id)
    .order('order_index', { ascending: true });

  throwIfSupabaseError(topicsError);

  const topicIds = topics.map((topic) => topic.id);
  const questions = await fetchQuestionsByTopicIds(client, topicIds);

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

export const syncCompanySheetDetails = async (req, res) => {
  const { companyName } = req.params;
  try {
    const result = await syncCompany(companyName);
    res.status(200).json({
      message: `Successfully synced ${companyName} from GitHub.`,
      ...result
    });
  } catch (err) {
    console.error(`[syncCompanySheetDetails] Sync failed for ${companyName}:`, err);
    res.status(500).json({ error: `Sync failed: ${err.message}` });
  }
};


