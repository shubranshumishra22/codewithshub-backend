import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

const NEETCODE_DATA = [
  {
    topicName: 'Arrays & Hashing',
    questions: [
      { title: 'Contains Duplicate', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/contains-duplicate/', video_url: 'https://www.youtube.com/watch?v=3OamzN90hDg' },
      { title: 'Valid Anagram', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/valid-anagram/', video_url: 'https://www.youtube.com/watch?v=g8R14_g-T-U' },
      { title: 'Two Sum', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/two-sum/', video_url: 'https://www.youtube.com/watch?v=KLlXCFG5Tk0' },
      { title: 'Group Anagrams', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/group-anagrams/', video_url: 'https://www.youtube.com/watch?v=vzdNOK2oB2E' },
      { title: 'Top K Frequent Elements', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/top-k-frequent-elements/', video_url: 'https://www.youtube.com/watch?v=YPTqKIgVk-k' },
      { title: 'Product of Array Except Self', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/product-of-array-except-self/', video_url: 'https://www.youtube.com/watch?v=bNvIQI2wAjk' },
      { title: 'Longest Consecutive Sequence', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/longest-consecutive-sequence/', video_url: 'https://www.youtube.com/watch?v=P6RZZMu_maU' }
    ]
  },
  {
    topicName: 'Two Pointers',
    questions: [
      { title: 'Valid Palindrome', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/valid-palindrome/', video_url: 'https://www.youtube.com/watch?v=jJXJ16kPFWg' },
      { title: 'Two Sum II - Input Array Is Sorted', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', video_url: 'https://www.youtube.com/watch?v=cQ1Oz4ckceM' },
      { title: '3Sum', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/3sum/', video_url: 'https://www.youtube.com/watch?v=jzZsG8n2R9A' },
      { title: 'Container With Most Water', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/container-with-most-water/', video_url: 'https://www.youtube.com/watch?v=UuiTKBwPgFY' }
    ]
  },
  {
    topicName: 'Sliding Window',
    questions: [
      { title: 'Best Time to Buy and Sell Stock', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', video_url: 'https://www.youtube.com/watch?v=1pkOgXD63yU' },
      { title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', video_url: 'https://www.youtube.com/watch?v=wiGpG14c558' },
      { title: 'Longest Repeating Character Replacement', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/longest-repeating-character-replacement/', video_url: 'https://www.youtube.com/watch?v=gqXU1UyA8pk' },
      { title: 'Minimum Window Substring', difficulty: 'hard', leetcode_url: 'https://leetcode.com/problems/minimum-window-substring/', video_url: 'https://www.youtube.com/watch?v=jSto0O4AJbM' }
    ]
  },
  {
    topicName: 'Stack',
    questions: [
      { title: 'Valid Parentheses', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/valid-parentheses/', video_url: 'https://www.youtube.com/watch?v=WTzjT9MYSO8' },
      { title: 'Min Stack', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/min-stack/', video_url: 'https://www.youtube.com/watch?v=QKlaG-fKoGc' },
      { title: 'Evaluate Reverse Polish Notation', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', video_url: 'https://www.youtube.com/watch?v=iu0082c4OhI' },
      { title: 'Daily Temperatures', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/daily-temperatures/', video_url: 'https://www.youtube.com/watch?v=cTBiBSnjO3c' }
    ]
  },
  {
    topicName: 'Binary Search',
    questions: [
      { title: 'Binary Search', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/binary-search/', video_url: 'https://www.youtube.com/watch?v=s4DPM8ct1Hs' },
      { title: 'Search a 2D Matrix', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/search-a-2d-matrix/', video_url: 'https://www.youtube.com/watch?v=Ber2DZUPegk' },
      { title: 'Koko Eating Bananas', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/koko-eating-bananas/', video_url: 'https://www.youtube.com/watch?v=U2SozAs9RmA' },
      { title: 'Find Minimum in Rotated Sorted Array', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', video_url: 'https://www.youtube.com/watch?v=nIVW4P8F1s0' }
    ]
  },
  {
    topicName: 'Linked List',
    questions: [
      { title: 'Reverse Linked List', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/reverse-linked-list/', video_url: 'https://www.youtube.com/watch?v=G0_I-ZF0S38' },
      { title: 'Merge Two Sorted Lists', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/merge-two-sorted-lists/', video_url: 'https://www.youtube.com/watch?v=XIdigk956u0' },
      { title: 'Reorder List', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/reorder-list/', video_url: 'https://www.youtube.com/watch?v=S5yA1439gVo' },
      { title: 'Remove Nth Node From End of List', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', video_url: 'https://www.youtube.com/watch?v=XVuQxVXR6y8' }
    ]
  },
  {
    topicName: 'Trees',
    questions: [
      { title: 'Invert Binary Tree', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/invert-binary-tree/', video_url: 'https://www.youtube.com/watch?v=OnSn2XEQ4MY' },
      { title: 'Maximum Depth of Binary Tree', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', video_url: 'https://www.youtube.com/watch?v=hTM3phVI6Oc' },
      { title: 'Diameter of Binary Tree', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/diameter-of-binary-tree/', video_url: 'https://www.youtube.com/watch?v=bkxqA8Rfv_g' },
      { title: 'Balanced Binary Tree', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/balanced-binary-tree/', video_url: 'https://www.youtube.com/watch?v=QfJsau0ItOY' },
      { title: 'Same Tree', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/same-tree/', video_url: 'https://www.youtube.com/watch?v=vRbbcKJuYUM' },
      { title: 'Subtree of Another Tree', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/subtree-of-another-tree/', video_url: 'https://www.youtube.com/watch?v=HdMs2Fl_I-g' }
    ]
  },
  {
    topicName: 'Heap / Priority Queue',
    questions: [
      { title: 'Kth Largest Element in a Stream', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/', video_url: 'https://www.youtube.com/watch?v=hOjGWurSzgQ' },
      { title: 'Last Stone Weight', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/last-stone-weight/', video_url: 'https://www.youtube.com/watch?v=B-QCxeNpkdQ' },
      { title: 'K Closest Points to Origin', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/k-closest-points-to-origin/', video_url: 'https://www.youtube.com/watch?v=rI2EBUEMfTk' }
    ]
  },
  {
    topicName: 'Backtracking',
    questions: [
      { title: 'Subsets', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/subsets/', video_url: 'https://www.youtube.com/watch?v=REOH22Xwdkk' },
      { title: 'Combination Sum', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/combination-sum/', video_url: 'https://www.youtube.com/watch?v=GBKI9VSKdGg' },
      { title: 'Permutations', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/permutations/', video_url: 'https://www.youtube.com/watch?v=s7AvT7cGdSo' }
    ]
  },
  {
    topicName: 'Graphs',
    questions: [
      { title: 'Number of Islands', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/number-of-islands/', video_url: 'https://www.youtube.com/watch?v=pV2kpPD66nE' },
      { title: 'Clone Graph', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/clone-graph/', video_url: 'https://www.youtube.com/watch?v=mQeF6bN8hMc' },
      { title: 'Max Area of Island', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/max-area-of-island/', video_url: 'https://www.youtube.com/watch?v=amwm_yKDpIE' }
    ]
  },
  {
    topicName: 'Dynamic Programming (1-D)',
    questions: [
      { title: 'Climbing Stairs', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/climbing-stairs/', video_url: 'https://www.youtube.com/watch?v=Y0lT9Fck7qI' },
      { title: 'Min Cost Climbing Stairs', difficulty: 'easy', leetcode_url: 'https://leetcode.com/problems/min-cost-climbing-stairs/', video_url: 'https://www.youtube.com/watch?v=ktmzAZWkEZ0' },
      { title: 'House Robber', difficulty: 'medium', leetcode_url: 'https://leetcode.com/problems/house-robber/', video_url: 'https://www.youtube.com/watch?v=73r3KWiEvyk' }
    ]
  }
];

async function main() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error('Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
  }

  const seedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, supabaseOptions);

  const sheetName = 'Neetcode 150';
  const sheetDescription = 'The curated 150 practice list of coding interview questions compiled by Neetcode, complete with video explanations.';

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
  const topicsToUpsert = NEETCODE_DATA.map((t, idx) => ({
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
  NEETCODE_DATA.forEach((t, tIdx) => {
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
  console.log(`Seeded Neetcode Sheet: ${NEETCODE_DATA.length} topics, ${questionsToUpsert.length} questions successfully.`);
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exitCode = 1;
});
