const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/test-cases
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search, priority, test_type, execution_status, requirement_id } = req.query;

    let query = `
      SELECT tc.*, r.module_name, r.feature_name, r.project_id, p.project_name
      FROM test_cases tc
      LEFT JOIN requirements r ON r.id = tc.requirement_id
      LEFT JOIN projects p ON p.id = r.project_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (tc.title LIKE ? OR tc.test_scenario LIKE ? OR tc.test_case_id LIKE ? OR r.feature_name LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (priority) { query += ' AND tc.priority = ?'; params.push(priority); }
    if (test_type) { query += ' AND tc.test_type = ?'; params.push(test_type); }
    if (execution_status) { query += ' AND tc.execution_status = ?'; params.push(execution_status); }
    if (requirement_id) { query += ' AND tc.requirement_id = ?'; params.push(requirement_id); }

    query += ' ORDER BY tc.created_at DESC, tc.id ASC';

    const testCases = db.prepare(query).all(...params);
    res.json(testCases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/test-cases/stats
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    const total = db.prepare('SELECT COUNT(*) as count FROM test_cases').get().count;
    const byType = db.prepare(`
      SELECT test_type, COUNT(*) as count FROM test_cases GROUP BY test_type
    `).all();
    const byPriority = db.prepare(`
      SELECT priority, COUNT(*) as count FROM test_cases GROUP BY priority
    `).all();
    const byStatus = db.prepare(`
      SELECT execution_status, COUNT(*) as count FROM test_cases GROUP BY execution_status
    `).all();
    const scenarios = db.prepare('SELECT COUNT(DISTINCT test_scenario) as count FROM test_cases').get().count;
    const positive = db.prepare("SELECT COUNT(*) as count FROM test_cases WHERE test_type = 'Positive'").get().count;
    const negative = db.prepare("SELECT COUNT(*) as count FROM test_cases WHERE test_type = 'Negative'").get().count;
    const edgeCase = db.prepare("SELECT COUNT(*) as count FROM test_cases WHERE test_type = 'Edge Case'").get().count;
    const projects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
    const recentActivity = db.prepare(`
      SELECT tc.*, r.feature_name, r.module_name, p.project_name
      FROM test_cases tc
      LEFT JOIN requirements r ON r.id = tc.requirement_id
      LEFT JOIN projects p ON p.id = r.project_id
      ORDER BY tc.created_at DESC
      LIMIT 10
    `).all();

    res.json({
      total, scenarios, positive, negative, edge_case: edgeCase, projects,
      by_type: byType, by_priority: byPriority, by_status: byStatus,
      recent_activity: recentActivity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/test-cases/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const tc = db.prepare(`
      SELECT tc.*, r.module_name, r.feature_name, r.requirement_description, r.user_story, r.project_id, p.project_name
      FROM test_cases tc
      LEFT JOIN requirements r ON r.id = tc.requirement_id
      LEFT JOIN projects p ON p.id = r.project_id
      WHERE tc.id = ?
    `).get(req.params.id);
    if (!tc) return res.status(404).json({ error: 'Test case not found' });
    res.json(tc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/test-cases/:id
router.patch('/:id', (req, res) => {
  try {
    const db = getDb();
    const tc = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
    if (!tc) return res.status(404).json({ error: 'Test case not found' });

    const allowed = ['test_scenario','title','description','preconditions','test_steps','test_data','expected_result','priority','test_type','execution_status'];
    const updates = [];
    const values = [];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    db.prepare(`UPDATE test_cases SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/test-cases/:id
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const tc = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
    if (!tc) return res.status(404).json({ error: 'Test case not found' });

    const {
      test_scenario, title, description, preconditions,
      test_steps, test_data, expected_result,
      priority, test_type, execution_status
    } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
    if (!test_steps?.trim()) return res.status(400).json({ error: 'test_steps is required' });
    if (!expected_result?.trim()) return res.status(400).json({ error: 'expected_result is required' });

    db.prepare(`
      UPDATE test_cases SET
        test_scenario=?, title=?, description=?, preconditions=?,
        test_steps=?, test_data=?, expected_result=?,
        priority=?, test_type=?, execution_status=?,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      test_scenario || tc.test_scenario, title, description || '',
      preconditions || '', test_steps, test_data || '',
      expected_result, priority || tc.priority,
      test_type || tc.test_type, execution_status || tc.execution_status,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/test-cases/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const tc = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
    if (!tc) return res.status(404).json({ error: 'Test case not found' });
    db.prepare('DELETE FROM test_cases WHERE id = ?').run(req.params.id);
    res.json({ message: 'Test case deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
