const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { generateTestCases, isRealAIAvailable } = require('../aiService');
const { v4: uuidv4 } = require('uuid');

// POST /api/requirements/generate
// Main endpoint: saves requirement + generates test cases
router.post('/generate', async (req, res) => {
  const {
    project_name, module_name, feature_name,
    requirement_description, user_story,
    testing_type, priority
  } = req.body;

  if (!project_name?.trim()) return res.status(400).json({ error: 'project_name is required' });
  if (!module_name?.trim()) return res.status(400).json({ error: 'module_name is required' });
  if (!feature_name?.trim()) return res.status(400).json({ error: 'feature_name is required' });
  if (!requirement_description?.trim() || requirement_description.trim().length < 10) {
    return res.status(400).json({ error: 'requirement_description must be at least 10 characters' });
  }

  const db = getDb();

  try {
    // 1. Upsert project
    let project = db.prepare('SELECT * FROM projects WHERE project_name = ?').get(project_name.trim());
    if (!project) {
      const result = db.prepare('INSERT INTO projects (project_name) VALUES (?)').run(project_name.trim());
      project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    }

    // 2. Save requirement
    const reqResult = db.prepare(`
      INSERT INTO requirements (project_id, module_name, feature_name, requirement_description, user_story, testing_type, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      project.id,
      module_name.trim(),
      feature_name.trim(),
      requirement_description.trim(),
      user_story?.trim() || null,
      testing_type || 'Functional',
      priority || 'Medium'
    );
    const requirementId = reqResult.lastInsertRowid;

    // 3. Generate test cases via AI service
    const aiResult = await generateTestCases({
      project_name, module_name, feature_name,
      requirement_description, user_story, testing_type, priority
    });
    const { testCases, mode, model, requirement_summary, fallback_reason } = aiResult;

    // 4. Persist test cases with unique IDs
    const insertTc = db.prepare(`
      INSERT INTO test_cases (test_case_id, requirement_id, test_scenario, title, description, preconditions, test_steps, test_data, expected_result, priority, test_type, execution_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Not Executed')
    `);

    // Insert all test cases in a manual transaction
    db.exec('BEGIN');
    const insertedIds = [];
    try {
      testCases.forEach((tc, idx) => {
        const tcId = `TC-${Date.now()}-${String(idx + 1).padStart(3, '0')}`;
        insertTc.run(
          tcId,
          requirementId,
          tc.test_scenario || `${feature_name} Scenario`,
          tc.title || `Test Case ${idx + 1}`,
          tc.description || '',
          tc.preconditions || '',
          tc.test_steps || '',
          tc.test_data || '',
          tc.expected_result || '',
          tc.priority || priority || 'Medium',
          tc.test_type || testing_type || 'Functional'
        );
        insertedIds.push(tcId);
      });
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    // 5. Record generation history
    db.prepare(`
      INSERT INTO generation_history (project_id, requirement_id, total_test_cases, generation_mode)
      VALUES (?, ?, ?, ?)
    `).run(project.id, requirementId, insertedIds.length, mode);

    // 6. Fetch inserted test cases to return
    const savedTestCases = db.prepare(`
      SELECT * FROM test_cases WHERE requirement_id = ? ORDER BY id
    `).all(requirementId);

    res.status(201).json({
      message: `Generated ${insertedIds.length} test cases`,
      generation_mode: mode,
      model: model || null,
      requirement_summary: requirement_summary || null,
      fallback_reason: fallback_reason || null,
      is_real_ai: mode === 'gemini',
      project,
      requirement: db.prepare('SELECT * FROM requirements WHERE id = ?').get(requirementId),
      test_cases: savedTestCases,
    });
  } catch (err) {
    console.error('[generate] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requirements
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const requirements = db.prepare(`
      SELECT r.*, p.project_name, COUNT(tc.id) as test_case_count
      FROM requirements r
      LEFT JOIN projects p ON p.id = r.project_id
      LEFT JOIN test_cases tc ON tc.requirement_id = r.id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `).all();
    res.json(requirements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requirements/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const req2 = db.prepare(`
      SELECT r.*, p.project_name
      FROM requirements r
      LEFT JOIN projects p ON p.id = r.project_id
      WHERE r.id = ?
    `).get(req.params.id);
    if (!req2) return res.status(404).json({ error: 'Requirement not found' });
    const testCases = db.prepare('SELECT * FROM test_cases WHERE requirement_id = ? ORDER BY id').all(req.params.id);
    res.json({ ...req2, test_cases: testCases });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
