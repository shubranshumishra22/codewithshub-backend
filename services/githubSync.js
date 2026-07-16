import axios from 'axios';
import { supabase, supabaseAdmin } from '../config/supabase.js';

const client = supabaseAdmin || supabase;

const TIMEFRAME_FILES = [
  { file: '1. Thirty Days.csv', topicName: '30 Days' },
  { file: '2. Three Months.csv', topicName: '3 Months' },
  { file: '3. Six Months.csv', topicName: '6 Months' },
  { file: '4. More Than Six Months.csv', topicName: 'More than 6 Months' },
  { file: '5. All.csv', topicName: 'All' }
];

// Helper to parse CSV line correctly handling quotes and commas
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Fetches and syncs a company's questions from GitHub into the Supabase database.
 * @param {string} companyName - Capitalized company name (e.g. "Google", "Amazon")
 */
export async function syncCompany(companyName) {
  if (!companyName) {
    throw new Error('Company name is required for syncing.');
  }

  // 1. Check or create Company Sheet
  const sheetName = companyName.trim();
  const sheetDescription = `Company sheet: ${sheetName}. Auto-synced from GitHub liquidslr/leetcode-company-wise-problems.`;

  let { data: existingSheets, error: sheetFetchError } = await client
    .from('sheets')
    .select('id, name, description')
    .eq('name', sheetName)
    .limit(1);

  if (sheetFetchError) throw sheetFetchError;

  let sheet = existingSheets?.[0];
  if (!sheet) {
    const { data: newSheet, error: sheetInsertError } = await client
      .from('sheets')
      .insert([{ name: sheetName, description: sheetDescription }])
      .select('id, name, description')
      .single();

    if (sheetInsertError) throw sheetInsertError;
    sheet = newSheet;
  } else if (!sheet.description?.startsWith('Company sheet:')) {
    // If it exists but is not marked as a company sheet, update description
    const { data: updatedSheet, error: sheetUpdateError } = await client
      .from('sheets')
      .update({ description: sheetDescription })
      .eq('id', sheet.id)
      .select('id, name, description')
      .single();

    if (sheetUpdateError) throw sheetUpdateError;
    sheet = updatedSheet;
  }

  // 2. Ensure all topics (timeframes) exist for this sheet
  const topicsToUpsert = TIMEFRAME_FILES.map((tf, idx) => ({
    sheet_id: sheet.id,
    name: tf.topicName,
    order_index: idx + 1
  }));

  const { error: topicUpsertError } = await client
    .from('topics')
    .upsert(topicsToUpsert, { onConflict: 'sheet_id,order_index' });

  if (topicUpsertError) throw topicUpsertError;

  // Retrieve saved topics to map their IDs
  const { data: savedTopics, error: topicsFetchError } = await client
    .from('topics')
    .select('id, name')
    .eq('sheet_id', sheet.id);

  if (topicsFetchError) throw topicsFetchError;

  const topicIdByName = new Map(savedTopics.map((t) => [t.name, t.id]));

  // 3. Sync questions for each timeframe
  let totalSeeded = 0;

  for (const timeframe of TIMEFRAME_FILES) {
    const topicId = topicIdByName.get(timeframe.topicName);
    if (!topicId) continue;

    // Fetch CSV content from GitHub
    const url = `https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/${encodeURIComponent(sheetName)}/${encodeURIComponent(timeframe.file)}`;
    let csvData = '';
    try {
      const res = await axios.get(url);
      csvData = res.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.warn(`[GitHubSync] Timeframe file not found for ${sheetName}: ${timeframe.file}. Skipping.`);
        continue;
      }
      throw err;
    }

    if (!csvData) continue;

    const lines = csvData.split(/\r?\n/);
    const questionsToUpsert = [];
    let orderIndex = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.toLowerCase().startsWith('difficulty,title')) {
        continue; // Skip header or empty line
      }

      const parts = parseCsvLine(trimmed);
      if (parts.length < 5) continue; // Invalid line format

      const [diffCol, titleCol, freqCol, accCol, linkCol] = parts;
      if (!titleCol) continue;

      const rawDiff = diffCol.toLowerCase();
      const difficulty = (rawDiff === 'easy' || rawDiff === 'medium' || rawDiff === 'hard') ? rawDiff : 'medium';
      
      const cleanTitle = titleCol.replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
      const leetcode_url = linkCol || `https://leetcode.com/problems/${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`;
      const video_url = `https://www.youtube.com/results?search_query=leetcode+${encodeURIComponent(cleanTitle)}+explanation`;

      questionsToUpsert.push({
        topic_id: topicId,
        title: cleanTitle,
        difficulty,
        leetcode_url,
        video_url,
        order_index: orderIndex++
      });
    }

    if (questionsToUpsert.length > 0) {
      // Upsert questions
      const { error: questionUpsertError } = await client
        .from('questions')
        .upsert(questionsToUpsert, { onConflict: 'topic_id,order_index' });

      if (questionUpsertError) {
        console.error(`[GitHubSync] Error upserting questions for ${sheetName} -> ${timeframe.topicName}:`, questionUpsertError);
        throw questionUpsertError;
      }
      totalSeeded += questionsToUpsert.length;
    }
  }

  console.log(`[GitHubSync] Successfully synchronized ${sheetName} with ${totalSeeded} questions.`);
  return {
    sheetId: sheet.id,
    sheetName: sheet.name,
    totalQuestions: totalSeeded
  };
}
