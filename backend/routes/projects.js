const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/projects
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const projects = db.prepare(`
      SELECT p.*, 
        COUNT(DISTINCT r.id) as requirement_count,
        COUNT(DISTINCT tc.id) as test_case_count
      FROM projects p
      LEFT JOIN requirements r ON r.project_id = p.id
      LEFT JOIN test_cases tc ON tc.requirement_id = r.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
router.post('/', (req, res) => {
  const { project_name, description } = req.body;
  if (!project_name || !project_name.trim()) {
    return res.status(400).json({ error: 'project_name is required' });
  }
  try {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO projects (project_name, description) VALUES (?, ?)'
    ).run(project_name.trim(), description || '');
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
