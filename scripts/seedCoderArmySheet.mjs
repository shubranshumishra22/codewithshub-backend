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
    topicName: 'Step 1: Introduction & Mathematics',
    questions: [
      { title: 'Flowcharts & Pseudocode introduction', difficulty: 'easy', leetcode_url: null, video_url: 'https://www.youtube.com/watch?v=F3a3Jc_s6Q8' },
      { title: 'Check Palindrome Number', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/palindrome-number/', video_url: 'https://www.youtube.com/watch?v=13F1PzLd9jQ' },
      { title: 'Count Digits in an Integer', difficulty: 'easy', leetcode_url: null, video_url: 'https://www.youtube.com/watch?v=13F1PzLd9jQ' },
      { title: 'Reverse Integer', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/reverse-integer/', video_url: 'https://www.youtube.com/watch?v=13F1PzLd9jQ' },
      { title: 'Power of Two Check', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/power-of-two/', video_url: 'https://www.youtube.com/watch?v=13F1PzLd9jQ' },
      { title: 'Count Primes (Sieve of Eratosthenes)', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/count-primes/', video_url: 'https://www.youtube.com/watch?v=13F1PzLd9jQ' },
      { title: 'Greatest Common Divisor (GCD)', difficulty: 'easy', leetcode_url: null, video_url: 'https://www.youtube.com/watch?v=13F1PzLd9jQ' }
    ]
  },
  {
    topicName: 'Step 2: Searching & Sorting Algorithms',
    questions: [
      { title: 'Selection Sort Implementation', difficulty: 'easy', leetcode_url: null, video_url: 'https://www.youtube.com/watch?v=M9Y2xI9e0yM' },
      { title: 'Bubble Sort Implementation', difficulty: 'easy', leetcode_url: null, video_url: 'https://www.youtube.com/watch?v=6O7eG4V4s1I' },
      { title: 'Insertion Sort Implementation', difficulty: 'easy', leetcode_url: null, video_url: 'https://www.youtube.com/watch?v=yCxV05q-y4E' },
      { title: 'Binary Search Implementation', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/binary-search/', video_url: 'https://www.youtube.com/watch?v=Zt2S9tA7-Kk' },
      { title: 'Search Insert Position', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/search-insert-position/', video_url: 'https://www.youtube.com/watch?v=Zt2S9tA7-Kk' },
      { title: 'Find Peak Element', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/find-peak-element/', video_url: 'https://www.youtube.com/watch?v=Zt2S9tA7-Kk' },
      { title: 'Search in Rotated Sorted Array', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', video_url: 'https://www.youtube.com/watch?v=Zt2S9tA7-Kk' }
    ]
  },
  {
    topicName: 'Step 3: Arrays & Operations',
    questions: [
      { title: 'Two Sum Problem', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/two-sum/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' },
      { title: 'Kadanes Algorithm (Max Subarray Sum)', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/maximum-subarray/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' },
      { title: 'Move Zeroes to End', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/move-zeroes/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' },
      { title: 'Best Time to Buy and Sell Stock', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' },
      { title: 'Majority Element', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/majority-element/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' },
      { title: 'Next Permutation', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/next-permutation/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' },
      { title: 'Rotate Image (Matrix Rotation)', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/rotate-image/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' },
      { title: 'Spiral Matrix Traversal', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/spiral-matrix/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' },
      { title: 'Subarray Sum Equals K', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/subarray-sum-equals-k/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' },
      { title: 'Find All Duplicates in an Array', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/find-all-duplicates-in-an-array/', video_url: 'https://www.youtube.com/watch?v=7_hKj809HqM' }
    ]
  },
  {
    topicName: 'Step 4: Strings',
    questions: [
      { title: 'Valid Anagram Check', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/valid-anagram/', video_url: 'https://www.youtube.com/watch?v=UeC99kP49Jk' },
      { title: 'Reverse Words in a String', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/reverse-words-in-a-string/', video_url: 'https://www.youtube.com/watch?v=UeC99kP49Jk' },
      { title: 'Longest Common Prefix', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/longest-common-prefix/', video_url: 'https://www.youtube.com/watch?v=UeC99kP49Jk' },
      { title: 'Isomorphic Strings Check', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/isomorphic-strings/', video_url: 'https://www.youtube.com/watch?v=UeC99kP49Jk' },
      { title: 'Longest Palindromic Substring', difficulty: 'hard', leetcode_url: 'https://leetcode.com/problems/longest-palindromic-substring/', video_url: 'https://www.youtube.com/watch?v=UeC99kP49Jk' },
      { title: 'String to Integer (atoi) Conversion', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/string-to-integer-atoi/', video_url: 'https://www.youtube.com/watch?v=UeC99kP49Jk' }
    ]
  },
  {
    topicName: 'Step 5: Recursion & Backtracking',
    questions: [
      { title: 'Fibonacci Number Recursion', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/fibonacci-number/', video_url: 'https://www.youtube.com/watch?v=Ke8_3O947B8' },
      { title: 'Subsets Generation (Power Set)', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/subsets/', video_url: 'https://www.youtube.com/watch?v=Ke8_3O947B8' },
      { title: 'Power (x, n) Implementation', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/powx-n/', video_url: 'https://www.youtube.com/watch?v=Ke8_3O947B8' },
      { title: 'Permutations of an Array', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/permutations/', video_url: 'https://www.youtube.com/watch?v=Ke8_3O947B8' },
      { title: 'Combination Sum Problem', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/combination-sum/', video_url: 'https://www.youtube.com/watch?v=Ke8_3O947B8' },
      { title: 'N-Queens Backtracking Solver', difficulty: 'hard', leetcode_url: 'https://leetcode.com/problems/n-queens/', video_url: 'https://www.youtube.com/watch?v=Ke8_3O947B8' },
      { title: 'Word Search in Grid', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/word-search/', video_url: 'https://www.youtube.com/watch?v=Ke8_3O947B8' }
    ]
  },
  {
    topicName: 'Step 6: Linked Lists',
    questions: [
      { title: 'Reverse Singly Linked List', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/reverse-linked-list/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Linked List Cycle Check', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/linked-list-cycle/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Merge Two Sorted Lists', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/merge-two-sorted-lists/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Remove Nth Node From End of List', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Intersection of Two Linked Lists', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/intersection-of-two-linked-lists/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Add Two Numbers Represented by LL', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/add-two-numbers/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Palindrome Linked List', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/palindrome-linked-list/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' }
    ]
  },
  {
    topicName: 'Step 7: Stacks & Queues',
    questions: [
      { title: 'Valid Parentheses String', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/valid-parentheses/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Implement Stack using Queues', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/implement-stack-using-queues/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Implement Queue using Stacks', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/implement-queue-using-stacks/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Min Stack Design', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/min-stack/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Next Greater Element I', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/next-greater-element-i/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Sliding Window Maximum Outlier', difficulty: 'hard', leetcode_url: 'https://leetcode.com/problems/sliding-window-maximum/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' },
      { title: 'Largest Rectangle in Histogram', difficulty: 'hard', leetcode_url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', video_url: 'https://www.youtube.com/watch?v=cM3BvWn8R2U' }
    ]
  },
  {
    topicName: 'Step 8: Trees & BST',
    questions: [
      { title: 'Binary Tree Inorder Traversal', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/binary-tree-inorder-traversal/', video_url: 'https://www.youtube.com/watch?v=VwV2C4s9W38' },
      { title: 'Maximum Depth of Binary Tree', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', video_url: 'https://www.youtube.com/watch?v=VwV2C4s9W38' },
      { title: 'Same Tree Validation', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/same-tree/', video_url: 'https://www.youtube.com/watch?v=VwV2C4s9W38' },
      { title: 'Symmetric Tree Validation', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/symmetric-tree/', video_url: 'https://www.youtube.com/watch?v=VwV2C4s9W38' },
      { title: 'Path Sum Target Exist', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/path-sum/', video_url: 'https://www.youtube.com/watch?v=VwV2C4s9W38' },
      { title: 'Validate Binary Search Tree', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/validate-binary-search-tree/', video_url: 'https://www.youtube.com/watch?v=Z6eC6cT5t3c' },
      { title: 'Lowest Common Ancestor of a BST', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', video_url: 'https://www.youtube.com/watch?v=Z6eC6cT5t3c' }
    ]
  },
  {
    topicName: 'Step 9: Graphs',
    questions: [
      { title: 'Clone Graph Node Copy', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/clone-graph/', video_url: 'https://www.youtube.com/watch?v=gT8v8Yc63X8' },
      { title: 'Number of Islands (Grid BFS/DFS)', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/number-of-islands/', video_url: 'https://www.youtube.com/watch?v=gT8v8Yc63X8' },
      { title: 'Course Schedule I (Cycle in DAG)', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/course-schedule/', video_url: 'https://www.youtube.com/watch?v=gT8v8Yc63X8' },
      { title: 'Network Delay Time (Dijkstras Algorithm)', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/network-delay-time/', video_url: 'https://www.youtube.com/watch?v=gT8v8Yc63X8' }
    ]
  },
  {
    topicName: 'Step 10: Dynamic Programming',
    questions: [
      { title: 'Climbing Stairs DP Way', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/climbing-stairs/', video_url: 'https://www.youtube.com/watch?v=9g0qS-g4dM8' },
      { title: 'Coin Change Minimum Coins', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/coin-change/', video_url: 'https://www.youtube.com/watch?v=9g0qS-g4dM8' },
      { title: 'Longest Increasing Subsequence', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/longest-increasing-subsequence/', video_url: 'https://www.youtube.com/watch?v=9g0qS-g4dM8' },
      { title: 'Longest Common Subsequence', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/longest-common-subsequence/', video_url: 'https://www.youtube.com/watch?v=9g0qS-g4dM8' },
      { title: 'House Robber Max Wealth', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/house-robber/', video_url: 'https://www.youtube.com/watch?v=9g0qS-g4dM8' }
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
