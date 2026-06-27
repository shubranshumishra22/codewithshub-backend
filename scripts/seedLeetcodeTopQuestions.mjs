import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

const LEETCODE_TOP_DATA = [
  {
    topicName: 'Arrays & Strings',
    questions: [
      { title: 'Two Sum', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/two-sum/' },
      { title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
      { title: 'String to Integer (atoi)', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/string-to-integer-atoi/' },
      { title: 'Container With Most Water', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/container-with-most-water/' },
      { title: '3Sum', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/3sum/' },
      { title: 'Letter Combinations of a Phone Number', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/' },
      { title: 'Valid Parentheses', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/valid-parentheses/' },
      { title: 'Merge Two Sorted Lists', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/merge-two-sorted-lists/' },
      { title: 'Generate Parentheses', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/generate-parentheses/' },
      { title: 'Merge k Sorted Lists', difficulty: 'hard', leetcode_url: 'https://leetcode.com/problems/merge-k-sorted-lists/' }
    ]
  },
  {
    topicName: 'Searching & Sorting',
    questions: [
      { title: 'Search in Rotated Sorted Array', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
      { title: 'Find First and Last Position of Element in Sorted Array', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/' },
      { title: 'Search Insert Position', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/search-insert-position/' },
      { title: 'First Missing Positive', difficulty: 'hard', leetcode_url: 'https://leetcode.com/problems/first-missing-positive/' }
    ]
  },
  {
    topicName: 'Matrix & Multi-Dimensional Arrays',
    questions: [
      { title: 'Rotate Image', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/rotate-image/' },
      { title: 'Group Anagrams', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/group-anagrams/' },
      { title: 'Maximum Subarray', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/maximum-subarray/' },
      { title: 'Spiral Matrix', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/spiral-matrix/' }
    ]
  },
  {
    topicName: 'Linked Lists',
    questions: [
      { title: 'Reverse Linked List', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/reverse-linked-list/' },
      { title: 'Linked List Cycle', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/linked-list-cycle/' },
      { title: 'Copy List with Random Pointer', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/copy-list-with-random-pointer/' }
    ]
  },
  {
    topicName: 'Trees & Graphs',
    questions: [
      { title: 'Binary Tree Inorder Traversal', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/binary-tree-inorder-traversal/' },
      { title: 'Validate Binary Search Tree', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/validate-binary-search-tree/' },
      { title: 'Symmetric Tree', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/symmetric-tree/' },
      { title: 'Binary Tree Level Order Traversal', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/' },
      { title: 'Maximum Depth of Binary Tree', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' },
      { title: 'Construct Binary Tree from Preorder and Inorder Traversal', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/' }
    ]
  },
  {
    topicName: 'Dynamic Programming & Greedy',
    questions: [
      { title: 'Climbing Stairs', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/climbing-stairs/' },
      { title: 'Edit Distance', difficulty: 'hard', leetcode_url: 'https://leetcode.com/problems/edit-distance/' },
      { title: 'Jump Game', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/jump-game/' },
      { title: 'Unique Paths', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/unique-paths/' },
      { title: 'Coin Change', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/coin-change/' }
    ]
  }
];

async function main() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error('Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
  }

  const seedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, supabaseOptions);

  const sheetName = 'LeetCode Top Interview Questions';
  const sheetDescription = 'The most popular and frequently asked coding questions in technical interviews on LeetCode.';

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
  const topicsToUpsert = LEETCODE_TOP_DATA.map((t, idx) => ({
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
  LEETCODE_TOP_DATA.forEach((t, tIdx) => {
    const topicId = topicIdByOrder.get(tIdx + 1);
    t.questions.forEach((q, qIdx) => {
      questionsToUpsert.push({
        topic_id: topicId,
        title: q.title,
        difficulty: q.difficulty,
        leetcode_url: q.leetcode_url,
        video_url: null, // No standard video URL for Leetcode general questions
        order_index: qIdx + 1,
      });
    });
  });

  // Upsert questions
  const { error: questionError } = await seedClient
    .from('questions')
    .upsert(questionsToUpsert, { onConflict: 'topic_id,order_index' });

  if (questionError) throw questionError;
  console.log(`Seeded LeetCode Top Questions Sheet: ${LEETCODE_TOP_DATA.length} topics, ${questionsToUpsert.length} questions successfully.`);
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exitCode = 1;
});
