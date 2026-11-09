// Uses Node.js built-in sqlite (available since Node.js v22.5, stable in v24)
// No npm package required — zero native compilation.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'testcases.db');

let db;

function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new DatabaseSync(DB_PATH);
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`PRAGMA journal_mode = WAL`);
  db.exec(`PRAGMA foreign_keys = ON`);
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      module_name TEXT NOT NULL,
      feature_name TEXT NOT NULL,
      requirement_description TEXT NOT NULL,
      user_story TEXT,
      testing_type TEXT DEFAULT 'Functional',
      priority TEXT DEFAULT 'Medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_case_id TEXT UNIQUE NOT NULL,
      requirement_id INTEGER NOT NULL,
      test_scenario TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      preconditions TEXT,
      test_steps TEXT NOT NULL,
      test_data TEXT,
      expected_result TEXT NOT NULL,
      priority TEXT DEFAULT 'Medium',
      test_type TEXT DEFAULT 'Functional',
      execution_status TEXT DEFAULT 'Not Executed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS generation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      requirement_id INTEGER NOT NULL,
      total_test_cases INTEGER DEFAULT 0,
      generation_mode TEXT DEFAULT 'mock',
      generation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE
    );
  `);
}

module.exports = { getDb };
