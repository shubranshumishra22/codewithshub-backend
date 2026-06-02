import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedFilePath = path.resolve(__dirname, '../db/seed.sql');

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

function parseSqlLiteral(value) {
  const trimmed = value.trim();

  if (trimmed.toLowerCase() === 'null') {
    return null;
  }

  if (trimmed.startsWith("'")) {
    let parsed = '';

    for (let index = 1; index < trimmed.length - 1; index += 1) {
      const char = trimmed[index];

      if (char === "'" && trimmed[index + 1] === "'") {
        parsed += "'";
        index += 1;
      } else {
        parsed += char;
      }
    }

    return parsed;
  }

  const numericValue = Number(trimmed);
  return Number.isNaN(numericValue) ? trimmed : numericValue;
}

function parseTupleLine(line) {
  const cleaned = line.trim().replace(/,$/, '');

  if (!cleaned.startsWith('(') || !cleaned.endsWith(')')) {
    return null;
  }

  const content = cleaned.slice(1, -1);
  const values = [];
  let current = '';
  let inString = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (char === "'") {
      current += char;

      if (inString && content[index + 1] === "'") {
        current += content[index + 1];
        index += 1;
        continue;
      }

      inString = !inString;
      continue;
    }

    if (char === ',' && !inString) {
      values.push(parseSqlLiteral(current));
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    values.push(parseSqlLiteral(current));
  }

  return values;
}

function extractBlock(source, marker, nextMarker) {
  const startIndex = source.indexOf(marker);

  if (startIndex === -1) {
    throw new Error(`Could not find SQL block: ${marker}`);
  }

  const endIndex = source.indexOf(nextMarker, startIndex);

  if (endIndex === -1) {
    throw new Error(`Could not find end marker: ${nextMarker}`);
  }

  return source.slice(startIndex, endIndex);
}

function extractTuples(source) {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseTopicTuple(line) {
  const match = line.match(/^\(\s*'((?:[^']|'{2})*)'\s*,\s*(\d+)\s*\),?$/);

  if (!match) {
    return null;
  }

  return [parseSqlLiteral(`'${match[1]}'`), Number(match[2])];
}

function parseQuestionTuple(line) {
  const match = line.match(
    /^\(\s*(\d+)\s*,\s*'((?:[^']|'{2})*)'\s*,\s*'((?:[^']|'{2})*)'\s*,\s*(null|'((?:[^']|'{2})*)')\s*,\s*(\d+)\s*\),?$/
  );

  if (!match) {
    return null;
  }

  return [
    Number(match[1]),
    parseSqlLiteral(`'${match[2]}'`),
    parseSqlLiteral(`'${match[3]}'`),
    match[4].toLowerCase() === 'null' ? null : parseSqlLiteral(`'${match[5]}'`),
    Number(match[6]),
  ];
}

async function main() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error('Missing Supabase service-role environment variables.');
  }

  const sql = await fs.readFile(seedFilePath, 'utf8');
  const seedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, supabaseOptions);
  const sheetName = 'Striver A-Z';
  const sheetDescription = "Striver's A to Z DSA Sheet: a structured roadmap from DSA basics to advanced topics.";

  const topicBlock = extractBlock(
    sql,
    'topic_seed (name, order_index) as (',
    'insert into public.questions (topic_id, title, difficulty, leetcode_url, order_index)'
  );
  const questionBlock = extractBlock(sql, 'question_seed (topic_order, title, difficulty, leetcode_url, order_index) as (', 'insert into public.questions (topic_id, title, difficulty, leetcode_url, order_index)');

  const topicTuples = extractTuples(topicBlock);
  const questionTuples = extractTuples(questionBlock);

  const parsedTopicTuples = topicTuples
    .map(parseTopicTuple)
    .filter(Boolean);

  const parsedQuestionTuples = questionTuples
    .map(parseQuestionTuple)
    .filter(Boolean);

  const { data: existingSheets, error: sheetFetchError } = await seedClient
    .from('sheets')
    .select('id, name')
    .eq('name', sheetName)
    .limit(1);

  if (sheetFetchError) {
    throw sheetFetchError;
  }

  let sheet = existingSheets?.find((row) => row.name === sheetName) || null;

  if (!sheet) {
    const { data: insertedSheet, error: sheetInsertError } = await seedClient
      .from('sheets')
      .insert([{ name: sheetName, description: sheetDescription }])
      .select('id, name')
      .single();

    if (sheetInsertError) {
      throw sheetInsertError;
    }

    sheet = insertedSheet;
  }

  if (!sheet) {
    throw new Error('Seed sheet was not created.');
  }

  const topicsToUpsert = parsedTopicTuples.map(([name, orderIndex]) => ({
    sheet_id: sheet.id,
    name,
    order_index: orderIndex,
  }));

  const { error: topicError } = await seedClient
    .from('topics')
    .upsert(topicsToUpsert, { onConflict: 'sheet_id,order_index' });

  if (topicError) {
    throw topicError;
  }

  const { data: savedTopics, error: savedTopicsError } = await seedClient
    .from('topics')
    .select('id, order_index')
    .eq('sheet_id', sheet.id);

  if (savedTopicsError) {
    throw savedTopicsError;
  }

  const topicIdByOrder = new Map(savedTopics.map((topic) => [topic.order_index, topic.id]));

  const questionsToUpsert = parsedQuestionTuples.map(([topicOrder, title, difficulty, leetcodeUrl, orderIndex]) => ({
    topic_id: topicIdByOrder.get(topicOrder),
    title,
    difficulty,
    leetcode_url: leetcodeUrl,
    order_index: orderIndex,
  }));

  const missingTopicQuestion = questionsToUpsert.find((question) => !question.topic_id);

  if (missingTopicQuestion) {
    throw new Error(`Missing topic mapping for question: ${missingTopicQuestion.title}`);
  }

  const { error: questionError } = await seedClient
    .from('questions')
    .upsert(questionsToUpsert, { onConflict: 'topic_id,order_index' });

  if (questionError) {
    throw questionError;
  }

  console.log(`Seeded ${sheetName}: ${topicsToUpsert.length} topics, ${questionsToUpsert.length} questions.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});