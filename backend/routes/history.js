const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/history
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const history = db.prepare(`
      SELECT 
        gh.*,
        p.project_name,
        r.module_name,
        r.feature_name,
        r.requirement_description,
        r.testing_type,
        r.priority
      FROM generation_history gh
      LEFT JOIN projects p ON p.id = gh.project_id
      LEFT JOIN requirements r ON r.id = gh.requirement_id
      ORDER BY gh.generation_date DESC
    `).all();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/:id — get history item with its test cases
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const item = db.prepare(`
      SELECT gh.*, p.project_name, r.module_name, r.feature_name, r.requirement_description, r.testing_type, r.priority
      FROM generation_history gh
      LEFT JOIN projects p ON p.id = gh.project_id
      LEFT JOIN requirements r ON r.id = gh.requirement_id
      WHERE gh.id = ?
    `).get(req.params.id);
    if (!item) return res.status(404).json({ error: 'History record not found' });

    const testCases = db.prepare('SELECT * FROM test_cases WHERE requirement_id = ? ORDER BY id').all(item.requirement_id);
    res.json({ ...item, test_cases: testCases });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM generation_history WHERE id = ?').run(req.params.id);
    res.json({ message: 'History record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
