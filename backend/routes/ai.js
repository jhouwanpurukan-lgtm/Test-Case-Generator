'use strict';
const express = require('express');
const router  = express.Router();
const {
  analyzeRequirement,
  improveTestCases,
  aiChat,
  getAIStatus,
  isGeminiAvailable,
} = require('../aiService');
const { getDb } = require('../db');

// ─────────────────────────────────────────────────────────────────
// GET /api/ai/status
// Returns current AI configuration status (never exposes the key)
// ─────────────────────────────────────────────────────────────────
router.get('/status', (req, res) => {
  res.json(getAIStatus());
});

// ─────────────────────────────────────────────────────────────────
// POST /api/ai/analyze-requirement
// Analyzes a requirement for clarity, gaps, risks, and recommendations
// ─────────────────────────────────────────────────────────────────
router.post('/analyze-requirement', async (req, res) => {
  const { project_name, module_name, feature_name, requirement_description, user_story } = req.body;

  if (!requirement_description?.trim()) {
    return res.status(400).json({ error: 'requirement_description is required' });
  }
  if (requirement_description.trim().length < 10) {
    return res.status(400).json({ error: 'requirement_description must be at least 10 characters' });
  }

  try {
    const result = await analyzeRequirement({
      project_name, module_name, feature_name, requirement_description, user_story,
    });
    res.json(result);
  } catch (err) {
    console.error('[/api/ai/analyze-requirement]', err.message);
    res.status(503).json({
      error: 'AI analysis failed',
      detail: err.message.includes('API key') ? 'Invalid or missing API key' : err.message,
    });
  }
});

// Legacy alias — kept for backward compatibility with existing frontend calls
router.post('/analyze', async (req, res) => {
  const { project_name, module_name, feature_name, requirement_description, user_story } = req.body;
  if (!requirement_description?.trim()) {
    return res.status(400).json({ error: 'requirement_description is required' });
  }
  try {
    const result = await analyzeRequirement({
      project_name, module_name, feature_name, requirement_description, user_story,
    });
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/ai/improve-test-cases
// Sends existing test cases to Gemini for quality improvement
// Body: { requirement_id: number } OR { test_case_ids: number[] }
// ─────────────────────────────────────────────────────────────────
router.post('/improve-test-cases', async (req, res) => {
  if (!isGeminiAvailable()) {
    return res.status(503).json({
      error: 'Gemini AI is not configured',
      detail: 'Add GEMINI_API_KEY to backend/.env to enable this feature',
    });
  }

  const { requirement_id, test_case_ids } = req.body;

  if (!requirement_id && (!Array.isArray(test_case_ids) || test_case_ids.length === 0)) {
    return res.status(400).json({ error: 'Provide requirement_id or test_case_ids array' });
  }

  try {
    const db = getDb();
    let testCases;
    let context = {};

    if (requirement_id) {
      testCases = db.prepare(
        'SELECT * FROM test_cases WHERE requirement_id = ? ORDER BY id LIMIT 20'
      ).all(requirement_id);
      const req2 = db.prepare(
        'SELECT r.*, p.project_name FROM requirements r LEFT JOIN projects p ON p.id = r.project_id WHERE r.id = ?'
      ).get(requirement_id);
      if (req2) context = req2;
    } else {
      const placeholders = test_case_ids.map(() => '?').join(',');
      testCases = db.prepare(
        `SELECT * FROM test_cases WHERE id IN (${placeholders})`
      ).all(...test_case_ids);
    }

    if (!testCases || testCases.length === 0) {
      return res.status(404).json({ error: 'No test cases found for the given criteria' });
    }

    const result = await improveTestCases(testCases, context);
    res.json(result);
  } catch (err) {
    console.error('[/api/ai/improve-test-cases]', err.message);
    res.status(503).json({
      error: 'AI improvement failed',
      detail: err.message.includes('API key') || err.message.includes('key') ? 'Invalid API key' : err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/ai/chat
// AI assistant free-form chat with optional context
// Body: { message: string, context?: object }
// ─────────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  if (!isGeminiAvailable()) {
    return res.status(503).json({
      error: 'Gemini AI is not configured',
      detail: 'Add GEMINI_API_KEY to backend/.env to enable the AI chat feature',
    });
  }

  const { message, context } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  if (message.trim().length > 4000) {
    return res.status(400).json({ error: 'message exceeds 4000 character limit' });
  }

  try {
    const result = await aiChat(message.trim(), context || {});
    res.json(result);
  } catch (err) {
    console.error('[/api/ai/chat]', err.message);
    res.status(503).json({
      error: 'AI chat failed',
      detail: err.message.includes('API') || err.message.includes('key') ? 'Invalid API key' : err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/ai/generate-test-cases
// Standalone endpoint: generate without saving to DB (for preview use)
// ─────────────────────────────────────────────────────────────────
router.post('/generate-test-cases', async (req, res) => {
  const { project_name, module_name, feature_name, requirement_description, user_story, testing_type, priority } = req.body;

  if (!requirement_description?.trim()) {
    return res.status(400).json({ error: 'requirement_description is required' });
  }

  try {
    const { generateTestCases } = require('../aiService');
    const result = await generateTestCases({ project_name, module_name, feature_name, requirement_description, user_story, testing_type, priority });
    res.json(result);
  } catch (err) {
    console.error('[/api/ai/generate-test-cases]', err.message);
    res.status(503).json({ error: err.message });
  }
});

module.exports = router;
