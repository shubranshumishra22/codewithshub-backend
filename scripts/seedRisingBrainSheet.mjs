import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

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

  const dataPath = '/Users/shubranshushekhar/.gemini/antigravity-ide/scratch/rising_brain_clean.json';
  const cleanTopics = JSON.parse(await fs.readFile(dataPath, 'utf8'));

  const seedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, supabaseOptions);

  const sheetName = 'Quest Sheet';
  const sheetDescription = 'Comprehensive DSA problem sheet for interview preparation';

  // 1. Create or get the Rising Brain Sheet
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

  // 2. Prepare topics and questions list
  const topicsToUpsert = [];
  const questionsToUpsert = [];

  let topicOrderIndex = 1;

  for (const topic of cleanTopics) {
    const subtopics = topic.subtopics || [];

    for (const subtopic of subtopics) {
      const topicName = `${topic.title}: ${subtopic.title}`;
      
      topicsToUpsert.push({
        sheet_id: sheet.id,
        name: topicName,
        order_index: topicOrderIndex,
      });

      // Store problems mapping for this topic's order_index
      const problems = subtopic.problems || [];
      problems.forEach((problem, pIdx) => {
        questionsToUpsert.push({
          topic_order: topicOrderIndex,
          title: problem.title,
          difficulty: (problem.difficulty || 'medium').toLowerCase(),
          leetcode_url: problem.leetcodeUrl || null,
          order_index: pIdx + 1,
        });
      });

      topicOrderIndex++;
    }
  }

  console.log(`Prepared ${topicsToUpsert.length} topics and ${questionsToUpsert.length} questions to upsert.`);

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
    .select('id, order_index')
    .eq('sheet_id', sheet.id);

  if (savedTopicsError) {
    throw savedTopicsError;
  }

  const topicIdByOrder = new Map(savedTopics.map((topic) => [topic.order_index, topic.id]));

  // 5. Map topic IDs to the prepared questions list
  const finalQuestions = questionsToUpsert.map((q) => ({
    topic_id: topicIdByOrder.get(q.topic_order),
    title: q.title,
    difficulty: q.difficulty,
    leetcode_url: q.leetcode_url,
    order_index: q.order_index,
  }));

  const missingTopicQuestion = finalQuestions.find((q) => !q.topic_id);
  if (missingTopicQuestion) {
    throw new Error(`Missing topic mapping for question: ${missingTopicQuestion.title}`);
  }

  // 6. Upsert questions
  const { error: questionError } = await seedClient
    .from('questions')
    .upsert(finalQuestions, { onConflict: 'topic_id,order_index' });

  if (questionError) {
    throw questionError;
  }

  console.log(`Successfully seeded ${sheetName}: ${topicsToUpsert.length} topics, ${finalQuestions.length} questions.`);
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exitCode = 1;
});
