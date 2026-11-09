const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const XLSX = require('xlsx');

// GET /api/export/csv?requirement_id=&project_id=
router.get('/csv', (req, res) => {
  try {
    const db = getDb();
    const testCases = getFilteredTestCases(db, req.query);
    if (!testCases.length) return res.status(404).json({ error: 'No test cases found' });

    const rows = testCases.map(buildRow);
    const headers = Object.keys(rows[0]);

    const csvLines = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="test_cases.csv"');
    res.send(csvLines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/excel
router.get('/excel', (req, res) => {
  try {
    const db = getDb();
    const testCases = getFilteredTestCases(db, req.query);
    if (!testCases.length) return res.status(404).json({ error: 'No test cases found' });

    const rows = testCases.map(buildRow);
    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 40 }, { wch: 40 },
      { wch: 30 }, { wch: 50 }, { wch: 30 }, { wch: 40 }, { wch: 12 },
      { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Test Cases');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="test_cases.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/pdf — returns JSON that frontend renders as PDF
router.get('/pdf-data', (req, res) => {
  try {
    const db = getDb();
    const testCases = getFilteredTestCases(db, req.query);
    if (!testCases.length) return res.status(404).json({ error: 'No test cases found' });
    res.json(testCases.map(buildRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getFilteredTestCases(db, query) {
  let sql = `
    SELECT tc.*, r.module_name, r.feature_name, p.project_name
    FROM test_cases tc
    LEFT JOIN requirements r ON r.id = tc.requirement_id
    LEFT JOIN projects p ON p.id = r.project_id
    WHERE 1=1
  `;
  const params = [];
  if (query.requirement_id) { sql += ' AND tc.requirement_id = ?'; params.push(query.requirement_id); }
  if (query.project_id) { sql += ' AND r.project_id = ?'; params.push(query.project_id); }
  sql += ' ORDER BY tc.id';
  return db.prepare(sql).all(...params);
}

function buildRow(tc) {
  return {
    'Test Case ID': tc.test_case_id,
    'Project': tc.project_name || '',
    'Module': tc.module_name || '',
    'Feature': tc.feature_name || '',
    'Test Scenario': tc.test_scenario,
    'Title': tc.title,
    'Description': tc.description,
    'Preconditions': tc.preconditions,
    'Test Steps': tc.test_steps,
    'Test Data': tc.test_data,
    'Expected Result': tc.expected_result,
    'Priority': tc.priority,
    'Test Type': tc.test_type,
    'Execution Status': tc.execution_status,
    'Created At': tc.created_at,
  };
}

module.exports = router;
