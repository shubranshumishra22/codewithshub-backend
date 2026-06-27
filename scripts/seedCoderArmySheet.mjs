import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

const CODER_ARMY_DATA = [
  {
    topicName: 'Step 1: Introduction & Complexities',
    questions: [
      { title: 'Flowcharts & Pseudocode introduction', difficulty: 'easy', leetcode_url: null, video_url: 'https://www.youtube.com/watch?v=F3a3Jc_s6Q8' },
      { title: 'Check Palindrome Number', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/palindrome-number/', video_url: 'https://www.youtube.com/watch?v=13F1PzLd9jQ' },
      { title: 'Count Digits in an Integer', difficulty: 'easy', leetcode_url: null, video_url: 'https://www.youtube.com/watch?v=13F1PzLd9jQ' }
    ]
  },
  {
    topicName: 'Step 2: Sorting Algorithms',
    questions: [
      { title: 'Selection Sort Implementation', difficulty: 'easy', leetcode_url: null, video_url: 'https://www.youtube.com/watch?v=M9Y2xI9e0yM' },
      { title: 'Bubble Sort Implementation', difficulty: 'easy', leetcode_url: null, video_url: 'https://www.youtube.com/watch?v=6O7eG4V4s1I' },
      { title: 'Insertion Sort Implementation', difficulty: 'easy', leetcode_url: null, video_url: 'https://www.youtube.com/watch?v=yCxV05q-y4E' }
    ]
  },
  {
    topicName: 'Step 3: Arrays & Operations',
    questions: [
      { title: 'Two Sum Problem', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/two-sum/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' },
      { title: 'Kadanes Algorithm (Max Subarray Sum)', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/maximum-subarray/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' },
      { title: 'Move Zeroes to End', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/move-zeroes/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' }
    ]
  },
  {
    topicName: 'Step 4: Binary Search',
    questions: [
      { title: 'Binary Search Implementation', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/binary-search/', video_url: 'https://www.youtube.com/watch?v=Zt2S9tA7-Kk' },
      { title: 'Search Insert Position', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/search-insert-position/', video_url: 'https://www.youtube.com/watch?v=Zt2S9tA7-Kk' }
    ]
  },
  {
    topicName: 'Step 5: Strings',
    questions: [
      { title: 'Valid Anagram Check', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/valid-anagram/', video_url: 'https://www.youtube.com/watch?v=UeC99kP49Jk' },
      { title: 'Reverse Words in a String', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/reverse-words-in-a-string/', video_url: 'https://www.youtube.com/watch?v=UeC99kP49Jk' }
    ]
  },
  {
    topicName: 'Step 6: Recursion & Backtracking',
    questions: [
      { title: 'Fibonacci Number Recursion', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/fibonacci-number/', video_url: 'https://www.youtube.com/watch?v=Ke8_3O947B8' },
      { title: 'Subsets Generation (Power Set)', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/subsets/', video_url: 'https://www.youtube.com/watch?v=Ke8_3O947B8' }
    ]
  },
  {
    topicName: 'Step 7: Linked Lists',
    questions: [
      { title: 'Reverse Singly Linked List', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/reverse-linked-list/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Linked List Cycle Check', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/linked-list-cycle/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' }
    ]
  },
  {
    topicName: 'Step 8: Trees & Graphs',
    questions: [
      { title: 'Binary Tree Inorder Traversal', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/binary-tree-inorder-traversal/', video_url: 'https://www.youtube.com/watch?v=VwV2C4s9W38' },
      { title: 'Clone Graph Representation', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/clone-graph/', video_url: 'https://www.youtube.com/watch?v=gT8v8Yc63X8' }
    ]
  }
];

async function main() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error('Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
  }

  const seedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, supabaseOptions);

  const sheetName = 'Coder Army 180 Days';
  const sheetDescription = 'Syllabus and practice sheets from Rohit Negi\'s Coder Army "180 Days of DSA" challenge.';

  // 1. Create or get Coder Army sheet
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
  const topicsToUpsert = CODER_ARMY_DATA.map((t, idx) => ({
    sheet_id: sheet.id,
    name: t.topicName,
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
  const topicIdByOrder = new Map(savedTopics.map(t => [t.order_index, t.id]));

  // 3. Prepare questions to upsert
  const questionsToUpsert = [];
  CODER_ARMY_DATA.forEach((t, tIdx) => {
    const topicId = topicIdByOrder.get(tIdx + 1);
    t.questions.forEach((q, qIdx) => {
      questionsToUpsert.push({
        topic_id: topicId,
        title: q.title,
        difficulty: q.difficulty,
        leetcode_url: q.leetcode_url,
        video_url: q.video_url,
        order_index: qIdx + 1,
      });
    });
  });

  // Upsert questions
  const { error: questionError } = await seedClient
    .from('questions')
    .upsert(questionsToUpsert, { onConflict: 'topic_id,order_index' });

  if (questionError) throw questionError;
  console.log(`Seeded Coder Army Sheet: ${CODER_ARMY_DATA.length} topics, ${questionsToUpsert.length} questions successfully.`);
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exitCode = 1;
});
