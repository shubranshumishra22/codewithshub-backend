import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

async function main() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error('Missing Supabase service-role environment variables.');
  }

  const dataPath = path.resolve(__dirname, 'google_questions.json');
  const questions = JSON.parse(await fs.readFile(dataPath, 'utf8'));

  const seedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, supabaseOptions);

  const sheetName = 'Google Sheet';
  const sheetDescription = 'Curated pattern-wise Google coding interview questions.';

  // 1. Create or get the Google Sheet
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

  console.log(`Using Sheet: ${sheet.name} (id: ${sheet.id})`);

  // 2. Extract and unique-ify the list of topics, preserving their relative sorting/order
  const topicList = [];
  const topicMap = new Map();
  
  for (const q of questions) {
    if (!topicMap.has(q.topic)) {
      topicMap.set(q.topic, []);
      topicList.push(q.topic);
    }
    topicMap.get(q.topic).push(q);
  }

  console.log(`Discovered ${topicList.length} unique topics.`);

  const topicsToUpsert = topicList.map((topicName, idx) => ({
    sheet_id: sheet.id,
    name: topicName,
    order_index: idx + 1,
  }));

  // 3. Upsert topics
  const { error: topicError } = await seedClient
    .from('topics')
    .upsert(topicsToUpsert, { onConflict: 'sheet_id,order_index' });

  if (topicError) {
    throw topicError;
  }

  console.log('Topics upserted successfully.');

  // 4. Fetch the database IDs for the upserted topics
  const { data: savedTopics, error: savedTopicsError } = await seedClient
    .from('topics')
    .select('id, name, order_index')
    .eq('sheet_id', sheet.id);

  if (savedTopicsError) {
    throw savedTopicsError;
  }

  const topicIdByName = new Map(savedTopics.map((topic) => [topic.name, topic.id]));

  // 5. Prepare questions to upsert, group per topic and order them
  const finalQuestions = [];
  
  for (const topicName of topicList) {
    const topicId = topicIdByName.get(topicName);
    const problems = topicMap.get(topicName);
    problems.forEach((problem, pIdx) => {
      finalQuestions.push({
        topic_id: topicId,
        title: problem.title,
        difficulty: problem.difficulty,
        leetcode_url: problem.leetcodeUrl || null,
        order_index: pIdx + 1,
      });
    });
  }

  console.log(`Prepared ${finalQuestions.length} questions to upsert.`);

  // 6. Upsert questions
  const { error: questionError } = await seedClient
    .from('questions')
    .upsert(finalQuestions, { onConflict: 'topic_id,order_index' });

  if (questionError) {
    throw questionError;
  }

  console.log(`Successfully seeded ${sheetName} sheet: ${topicsToUpsert.length} topics, ${finalQuestions.length} questions.`);
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exitCode = 1;
});
