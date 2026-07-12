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

  const mdPath = path.resolve('scripts/leetcode_top_150.md');
  if (!fs.existsSync(mdPath)) {
    throw new Error(`Dataset not found at ${mdPath}. Run curl download first.`);
  }

  const content = fs.readFileSync(mdPath, 'utf8');
  const rows = content.split('<tr>');
  let currentTopic = 'Array / String';
  const parsedQuestions = [];

  for (let r of rows) {
    if (r.includes('colspan="5"') || r.includes('colspan=5')) {
      const topicMatch = r.match(/<strong>(.*?)<\/strong>/);
      if (topicMatch) {
        currentTopic = topicMatch[1].replace(/<[^>]*>/g, '').trim();
      }
      continue;
    }
    if (r.includes('<td')) {
      const tds = r.split('</td>');
      if (tds.length >= 2) {
        const firstTd = tds[0];
        let title = '';
        let url = null;
        if (firstTd.includes('href=')) {
          const urlMatch = firstTd.match(/href="([^"]+)"/);
          if (urlMatch) url = urlMatch[1].trim();
          const textMatch = firstTd.match(/>([^<]+)<\/a>/);
          if (textMatch) {
            title = textMatch[1].trim();
          } else {
            title = firstTd.replace(/<[^>]*>/g, '').trim();
          }
        } else {
          title = firstTd.replace(/<[^>]*>/g, '').trim();
        }
        if (title.toLowerCase() === 'problem' || title.includes('Questions List') || title.includes('Id')) {
          continue;
        }
        const secondTd = tds[1];
        const diffText = secondTd.replace(/<[^>]*>/g, '').trim();
        const diff = diffText.toLowerCase();
        const difficulty = (diff === 'easy' || diff === 'medium' || diff === 'hard') ? diff : 'medium';
        if (title.length > 0 && !title.startsWith('Id')) {
          const cleanTitle = title.replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
          const finalUrl = url || 'https://leetcode.com/problems/' + cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '/';
          parsedQuestions.push({
            topic: currentTopic.replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim(),
            title: cleanTitle,
            difficulty,
            leetcode_url: finalUrl
          });
        }
      }
    }
  }

  const seedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, supabaseOptions);

  const sheetName = 'Interview Questions';
  const sheetDescription = 'The complete 150 popular and frequently asked coding questions in technical interviews on LeetCode.';

  // 1. Create or get Leetcode sheet
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
  const topicsMap = {};
  parsedQuestions.forEach(q => {
    topicsMap[q.topic] = true;
  });
  const topicsList = Object.keys(topicsMap);
  const topicsToUpsert = topicsList.map((cat, idx) => ({
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
  const topicCounter = {};

  parsedQuestions.forEach((q) => {
    const topicId = topicIdByName.get(q.topic);
    topicCounter[q.topic] = (topicCounter[q.topic] || 0) + 1;

    // Search query for video explanation on YouTube
    const video_url = `https://www.youtube.com/results?search_query=leetcode+${encodeURIComponent(q.title)}+explanation`;

    questionsToUpsert.push({
      topic_id: topicId,
      title: q.title,
      difficulty: q.difficulty,
      leetcode_url: q.leetcode_url,
      video_url,
      order_index: topicCounter[q.topic],
    });
  });

  // Upsert questions
  const { error: questionError } = await seedClient
    .from('questions')
    .upsert(questionsToUpsert, { onConflict: 'topic_id,order_index' });

  if (questionError) throw questionError;
  console.log(`Successfully seeded ALL ${questionsToUpsert.length} Leetcode Top Interview questions!`);
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exitCode = 1;
});
