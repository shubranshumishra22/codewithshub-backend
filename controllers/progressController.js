import { addDaysDateString } from '../utils/date.js';
import { badRequest, notFoundError } from '../utils/httpError.js';
import { throwIfSupabaseError } from '../utils/supabaseError.js';
import { updateStreakOnActivity } from './userController.js';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { translatePseudocode, generateTestCases } from '../utils/logicCheck.js';
import { executeInSandbox } from '../utils/sandbox.js';

const getSheetQuestionIds = async (client, sheetId) => {
  const { data: topics, error: topicsError } = await client
    .from('topics')
    .select('id')
    .eq('sheet_id', sheetId);

  throwIfSupabaseError(topicsError);

  const topicIds = topics.map((topic) => topic.id);

  if (topicIds.length === 0) {
    return [];
  }

  const { data: questions, error: questionsError } = await client
    .from('questions')
    .select('id, topic_id, title, difficulty, order_index')
    .in('topic_id', topicIds)
    .order('order_index', { ascending: true });

  throwIfSupabaseError(questionsError);

  return questions;
};

export const getProgressBySheet = async (req, res) => {
  const { sheetId } = req.params;
  const questions = await getSheetQuestionIds(req.supabase, sheetId);
  const questionIds = questions.map((question) => question.id);

  let progressRows = [];

  if (questionIds.length > 0) {
    const { data, error } = await req.supabase
      .from('user_progress')
      .select('id, question_id, is_solved, solved_at, notes')
      .eq('user_id', req.user.id)
      .in('question_id', questionIds);

    throwIfSupabaseError(error);
    progressRows = data;
  }

  const progressByQuestion = progressRows.reduce((acc, progress) => {
    acc[progress.question_id] = progress;
    return acc;
  }, {});

  res.status(200).json({
    progress: questions.map((question) => {
      const progress = progressByQuestion[question.id];

      return {
        question_id: question.id,
        title: question.title,
        difficulty: question.difficulty,
        is_solved: progress?.is_solved || false,
        solved_at: progress?.solved_at || null,
        notes: progress?.notes || null,
      };
    }),
  });
};

export const markQuestionSolved = async (req, res) => {
  const { question_id } = req.body;

  if (!question_id) {
    throw badRequest('question_id is required');
  }

  const { data: question, error: questionError } = await req.supabase
    .from('questions')
    .select('id')
    .eq('id', question_id)
    .maybeSingle();

  throwIfSupabaseError(questionError);

  if (!question) {
    throw notFoundError('Question not found');
  }

  const solvedAt = new Date().toISOString();

  const { data: progress, error: progressError } = await req.supabase
    .from('user_progress')
    .upsert(
      {
        user_id: req.user.id,
        question_id,
        is_solved: true,
        solved_at: solvedAt,
      },
      { onConflict: 'user_id,question_id' },
    )
    .select('id, user_id, question_id, is_solved, solved_at, notes')
    .single();

  throwIfSupabaseError(progressError);

  const { data: profile, error: profileError } = await req.supabase
    .from('profiles')
    .select('revision_intervals')
    .eq('id', req.user.id)
    .single();

  throwIfSupabaseError(profileError);

  const revisionRows = (profile.revision_intervals || []).map((revisionDay) => ({
    user_id: req.user.id,
    question_id,
    revision_day: revisionDay,
    due_date: addDaysDateString(revisionDay),
    is_completed: false,
    completed_at: null,
  }));

  let revisionSchedule = [];

  if (revisionRows.length > 0) {
    const { data, error } = await req.supabase
      .from('revision_schedule')
      .upsert(revisionRows, {
        onConflict: 'user_id,question_id,revision_day',
      })
      .select('id, question_id, revision_day, due_date, is_completed, completed_at');

    throwIfSupabaseError(error);
    revisionSchedule = data;
  }

  await updateStreakOnActivity(req.supabase, req.user.id);

  res.status(201).json({
    progress,
    revision_schedule: revisionSchedule,
  });
};

export const unmarkQuestionSolved = async (req, res) => {
  const { questionId } = req.params;

  const { data: progress, error: progressError } = await req.supabase
    .from('user_progress')
    .update({
      is_solved: false,
      solved_at: null,
    })
    .eq('user_id', req.user.id)
    .eq('question_id', questionId)
    .select('id, user_id, question_id, is_solved, solved_at, notes')
    .maybeSingle();

  throwIfSupabaseError(progressError);

  const { error: revisionError } = await req.supabase
    .from('revision_schedule')
    .delete()
    .eq('user_id', req.user.id)
    .eq('question_id', questionId);

  throwIfSupabaseError(revisionError);

  res.status(200).json({ progress, message: 'Question marked as unsolved' });
};

export const checkLogic = async (req, res) => {
  const { questionId, pseudocode } = req.body;

  if (!questionId || !pseudocode) {
    throw badRequest('questionId and pseudocode are required');
  }

  // 1. Check if the question exists
  const { data: question, error: questionError } = await req.supabase
    .from('questions')
    .select('id, title, difficulty')
    .eq('id', questionId)
    .maybeSingle();

  throwIfSupabaseError(questionError);
  if (!question) {
    throw notFoundError('Question not found');
  }

  // 2. Compute pseudocode hash
  const pseudocodeHash = crypto.createHash('sha256').update(pseudocode.trim()).digest('hex');

  // 3. Check cache
  const { data: cached, error: cacheError } = await req.supabase
    .from('logic_check_cache')
    .select('id, translated_code, assumptions, results, overall_passed')
    .eq('user_id', req.user.id)
    .eq('question_id', questionId)
    .eq('pseudocode_hash', pseudocodeHash)
    .maybeSingle();

  if (cached) {
    console.log('Serving logic check from cache...');
    return res.status(200).json({
      problemId: questionId,
      generatedCode: cached.translated_code,
      language: 'python',
      assumptions: cached.assumptions,
      results: cached.results,
      overallPassed: cached.overall_passed,
    });
  }

  // 4. Retrieve or generate test cases
  const dbClient = supabaseAdmin || req.supabase;
  let { data: tcRow, error: tcError } = await dbClient
    .from('question_test_cases')
    .select('test_cases')
    .eq('question_id', questionId)
    .maybeSingle();

  throwIfSupabaseError(tcError);

  let testCases = [];
  if (tcRow && Array.isArray(tcRow.test_cases) && tcRow.test_cases.length > 0) {
    testCases = tcRow.test_cases;
  } else {
    // Generate new test cases using LLM
    testCases = await generateTestCases(question.title, question.difficulty);
    // Save to database
    const { error: saveTcError } = await dbClient
      .from('question_test_cases')
      .upsert({
        question_id: questionId,
        test_cases: testCases,
      }, { onConflict: 'question_id' });
    
    if (saveTcError) {
      console.error('Error saving generated test cases:', saveTcError);
    }
  }

  // 5. Translate pseudocode to Python code
  let translationResult;
  try {
    translationResult = await translatePseudocode(question.title, question.difficulty, pseudocode);
  } catch (err) {
    return res.status(503).json({
      error: 'AI service is busy, try again',
      details: err.message,
    });
  }

  if (translationResult.untranslatable) {
    return res.status(200).json({
      problemId: questionId,
      untranslatable: true,
      generatedCode: '',
      language: 'python',
      assumptions: [],
      results: [],
      overallPassed: false,
    });
  }

  // 6. Extract function name and run sandbox
  const match = pseudocode.match(/(?:function|def)\s+([a-zA-Z0-9_]+)/);
  const funcName = match ? match[1] : 'solution';

  const execution = await executeInSandbox(translationResult.code, funcName, testCases);

  if (execution.error) {
    // Execution sandbox crashed or compile error
    // Save to cache as failed
    const finalResults = [{
      testCaseId: '1',
      passed: false,
      input: 'Compile/Syntax Check',
      expected: 'Successful Run',
      actual: execution.error,
    }];

    await req.supabase.from('logic_check_cache').insert({
      user_id: req.user.id,
      question_id: questionId,
      pseudocode_hash: pseudocodeHash,
      pseudocode,
      translated_code: translationResult.code,
      assumptions: translationResult.assumptions || [],
      results: finalResults,
      overall_passed: false,
    });

    return res.status(200).json({
      problemId: questionId,
      generatedCode: translationResult.code,
      language: 'python',
      assumptions: translationResult.assumptions || [],
      results: finalResults,
      overallPassed: false,
    });
  }

  // 7. Save to cache
  await req.supabase.from('logic_check_cache').insert({
    user_id: req.user.id,
    question_id: questionId,
    pseudocode_hash: pseudocodeHash,
    pseudocode,
    translated_code: translationResult.code,
    assumptions: translationResult.assumptions || [],
    results: execution.results,
    overall_passed: execution.overallPassed,
  });

  res.status(200).json({
    problemId: questionId,
    generatedCode: translationResult.code,
    language: 'python',
    assumptions: translationResult.assumptions || [],
    results: execution.results,
    overallPassed: execution.overallPassed,
  });
};
