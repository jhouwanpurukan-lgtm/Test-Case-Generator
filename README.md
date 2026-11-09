# 🧪 TestCase AI — AI-Powered Test Case Generator

A complete, modern, full-stack web application for automatically generating structured software test cases from application requirements.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Real-time statistics: total test cases, scenarios, positive/negative counts, charts |
| **Generate Test Cases** | AI-powered generation from requirement descriptions, user stories, and feature specs |
| **Test Case Management** | View, search, filter, edit, delete, and update execution status |
| **Test Case Detail** | Full detail view with all test case fields |
| **Generation History** | Complete history of all generation sessions with ability to reopen |
| **AI Assistant** | Requirement clarity analysis, gap identification, and testing recommendations |
| **Export** | CSV, Excel (.xlsx), and PDF export with formatted output |
| **Settings** | AI configuration status, generation defaults, database info |

## 🚀 Quick Start

### Prerequisites
- **Node.js v22+** (uses built-in `node:sqlite` — no native compilation required)
- npm

### 1. Clone / open the project
```bash
cd "Test Case Generator"
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env`:
```
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here    # optional — app works without it (mock mode)
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### 3. Install dependencies
```bash
# Backend
cd backend
npm install --ignore-scripts
cd ..

# Frontend
cd frontend
npm install --ignore-scripts
cd ..
```

### 4. Start the application

**Terminal 1 — Backend:**
```bash
cd backend
node server.js
# Running at http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Running at http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## 🤖 AI Integration

### Real AI Mode
Set `OPENAI_API_KEY` in `backend/.env` with a valid key. The system uses GPT-4o-mini (or any OpenAI-compatible model) to generate highly relevant, context-aware test cases.

### Mock Mode (no API key)
When no valid API key is configured, the system uses a **clearly labeled rule-based mock engine** that:
- Analyzes keywords in requirements (login, search, filter, auth, etc.)
- Generates contextually relevant test cases for Positive, Negative, Boundary, Edge Case, Functional, and Validation types
- Shows a prominent amber banner on all mock-generated content

**Mock results are never presented as real AI output.**

---

## 📐 Architecture

```
Test Case Generator/
├── backend/                    # Node.js + Express API
│   ├── server.js               # Main Express server
│   ├── db.js                   # SQLite via node:sqlite (built-in, no npm needed)
│   ├── aiService.js            # AI service layer (real AI + mock fallback)
│   ├── routes/
│   │   ├── projects.js         # CRUD for projects
│   │   ├── requirements.js     # Requirement input + test case generation
│   │   ├── testCases.js        # Test case CRUD + filtering
│   │   ├── history.js          # Generation history
│   │   ├── ai.js               # AI analysis + status
│   │   └── export.js           # CSV, Excel, PDF-data export
│   └── data/
│       └── testcases.db        # SQLite database (auto-created)
│
└── frontend/                   # React + Vite + Tailwind CSS
    └── src/
        ├── App.jsx             # Router
        ├── components/
        │   ├── Layout.jsx      # App shell with sidebar
        │   ├── Sidebar.jsx     # Navigation sidebar
        │   └── ui.jsx          # Shared UI components
        ├── pages/
        │   ├── Dashboard.jsx   # Stats + charts
        │   ├── Generate.jsx    # Requirement input + generation
        │   ├── TestCaseManagement.jsx  # Table with filters
        │   ├── TestCaseDetail.jsx      # Single TC view
        │   ├── TestCaseEdit.jsx        # Edit form
        │   ├── GenerationHistory.jsx   # History list
        │   ├── AIAssistant.jsx         # Requirement analysis
        │   └── Settings.jsx            # Configuration
        ├── services/api.js     # Axios API client
        └── utils/
            ├── helpers.js      # Badge colors, formatting
            └── pdfExport.js    # jsPDF export utility
```

## 🗄 Database Schema

- **projects**: id, project_name, description, created_at
- **requirements**: id, project_id, module_name, feature_name, requirement_description, user_story, testing_type, priority, created_at
- **test_cases**: id, test_case_id, requirement_id, test_scenario, title, description, preconditions, test_steps, test_data, expected_result, priority, test_type, execution_status, created_at, updated_at
- **generation_history**: id, project_id, requirement_id, total_test_cases, generation_mode, generation_date

## 📦 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Lucide React |
| Backend | Node.js v24, Express.js |
| Database | SQLite via `node:sqlite` (built-in, no install needed) |
| AI | OpenAI API (GPT-4o-mini) with mock fallback |
| Export | xlsx (Excel), jsPDF + autotable (PDF), native CSV |

## 🔒 Security Notes
- API keys are stored only in `backend/.env` — never in frontend code
- All API communication goes through the backend proxy
- Input validation on all endpoints
- SQLite foreign keys enforced
