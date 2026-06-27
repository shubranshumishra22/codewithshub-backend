import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import fs from 'fs';
import path from 'path';

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

async function main() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error('Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
  }

  const jsonPath = path.resolve('scripts/neetcode_150.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Dataset not found at ${jsonPath}. Run curl download first.`);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const seedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, supabaseOptions);

  const sheetName = 'Neetcode 150';
  const sheetDescription = 'The complete 150 practice list of coding interview questions compiled by Neetcode, complete with video explanations.';

  // 1. Create or get Neetcode sheet
  const { data: existingSheets, error: sheetFetchError } = await seedClient
    .from('sheets')
    .select('id, name')
    .eq('name', sheetName)
    .limit(1);

  if (sheetFetchError) throw sheetFetchError;

  let sheet = existingSheets?.find(s => s.name === sheetName) || null;

  if (!sheet) {
    const { data: insertedSheet, error: sheetInsertError } = await seedClient
      .from('sheets')
      .insert([{ name: sheetName, description: sheetDescription }])
      .select('id, name')
      .single();

    if (sheetInsertError) throw sheetInsertError;
    sheet = insertedSheet;
  }

  console.log(`Using Sheet: ${sheet.name} (id: ${sheet.id})`);

  // 2. Prepare topics and questions list
  const categories = Object.keys(rawData);
  const topicsToUpsert = categories.map((cat, idx) => ({
    sheet_id: sheet.id,
    name: cat,
    order_index: idx + 1,
  }));

  // Upsert topics
  const { error: topicError } = await seedClient
    .from('topics')
    .upsert(topicsToUpsert, { onConflict: 'sheet_id,order_index' });

  if (topicError) throw topicError;
  console.log('Topics upserted successfully.');

  // Fetch the saved topics to map their IDs
  const { data: savedTopics, error: savedTopicsError } = await seedClient
    .from('topics')
    .select('id, name, order_index')
    .eq('sheet_id', sheet.id);

  if (savedTopicsError) throw savedTopicsError;
  const topicIdByName = new Map(savedTopics.map(t => [t.name, t.id]));

  // 3. Prepare questions to upsert
  const questionsToUpsert = [];
  categories.forEach((cat) => {
    const topicId = topicIdByName.get(cat);
    const questionsObj = rawData[cat];
    const qNames = Object.keys(questionsObj);

    qNames.forEach((qName, qIdx) => {
      const qData = questionsObj[qName];
      const diff = qData.difficulty.toLowerCase();
      // Ensure difficulty is one of the valid check constraints
      const difficulty = (diff === 'easy' || diff === 'medium' || diff === 'hard') ? diff : 'medium';

      // Fallback video URL directs to YouTube search for the Neetcode explanation
      const video_url = `https://www.youtube.com/results?search_query=neetcode+${encodeURIComponent(qName)}`;

      questionsToUpsert.push({
        topic_id: topicId,
        title: qName,
        difficulty,
        leetcode_url: qData.url || null,
        video_url,
        order_index: qIdx + 1,
      });
    });
  });

  // Upsert questions
  const { error: questionError } = await seedClient
    .from('questions')
    .upsert(questionsToUpsert, { onConflict: 'topic_id,order_index' });

  if (questionError) throw questionError;
  console.log(`Successfully seeded ALL ${questionsToUpsert.length} Neetcode questions!`);
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exitCode = 1;
});
