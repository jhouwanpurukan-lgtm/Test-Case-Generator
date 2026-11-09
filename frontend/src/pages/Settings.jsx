import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle, ExternalLink, Database, Cpu, Key } from 'lucide-react';
import { getAiStatus, getStats } from '../services/api';

export default function Settings() {
  const [aiStatus, setAiStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [saved, setSaved] = useState(false);
  const [appSettings, setAppSettings] = useState({
    defaultPriority: 'Medium',
    defaultTestingType: 'Functional',
    theme: 'light',
  });

  useEffect(() => {
    getAiStatus().then(setAiStatus).catch(() => {});
    getStats().then(setStats).catch(() => {});
    // Load saved settings from localStorage
    const saved = localStorage.getItem('app_settings');
    if (saved) setAppSettings(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    localStorage.setItem('app_settings', JSON.stringify(appSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* AI Configuration */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
            <Cpu size={18} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Configuration</h3>
            <p className="text-xs text-gray-500">Status of AI integration</p>
          </div>
        </div>

        <div className={`rounded-xl p-4 border ${aiStatus?.gemini_available ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {aiStatus?.gemini_available ? (
              <><CheckCircle size={16} className="text-emerald-600" /><span className="font-medium text-emerald-800 text-sm">Google Gemini Active — {aiStatus.model}</span></>
            ) : (
              <><span className="text-amber-500 text-sm">⚠</span><span className="font-medium text-amber-800 text-sm">Mock Generation Mode</span></>
            )}
          </div>
          <p className="text-xs text-gray-600">{aiStatus?.message}</p>
        </div>

        <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Key size={15} className="text-gray-500" />
            <p className="text-sm font-medium text-gray-700">API Key Configuration</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            API keys hanya disimpan di file <code className="font-mono bg-gray-100 px-0.5 rounded">backend/.env</code> di server.
            Tidak pernah dikirim ke frontend. Dapatkan key gratis di{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 underline">
              aistudio.google.com
            </a>.
          </p>
          <div className="font-mono text-xs bg-white border border-gray-200 rounded-lg p-3 text-gray-700 space-y-1">
            <p className="text-gray-400"># backend/.env  (salin dari backend/.env.example)</p>
            <p>GEMINI_API_KEY=<span className="text-emerald-600">your_gemini_api_key_here</span></p>
            <p>GEMINI_MODEL=<span className="text-emerald-600">gemini-2.0-flash</span></p>
          </div>
        </div>
      </div>

      {/* Default preferences */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
            <SettingsIcon size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Generation Defaults</h3>
            <p className="text-xs text-gray-500">Default values for the Generate Test Cases form</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Default Priority</label>
            <select
              className="input-field"
              value={appSettings.defaultPriority}
              onChange={e => setAppSettings(s => ({ ...s, defaultPriority: e.target.value }))}
            >
              {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Default Testing Type</label>
            <select
              className="input-field"
              value={appSettings.defaultTestingType}
              onChange={e => setAppSettings(s => ({ ...s, defaultTestingType: e.target.value }))}
            >
              {['Functional', 'Integration', 'Regression', 'Smoke', 'Performance', 'Security', 'Usability'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary mt-5">
          {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Preferences</>}
        </button>
      </div>

      {/* Database stats */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-cyan-100 rounded-lg flex items-center justify-center">
            <Database size={18} className="text-cyan-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Database Information</h3>
            <p className="text-xs text-gray-500">SQLite database statistics</p>
          </div>
        </div>

        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Projects', value: stats.projects },
              { label: 'Test Cases', value: stats.total },
              { label: 'Scenarios', value: stats.scenarios },
              { label: 'Passed', value: stats.by_status?.find(s => s.execution_status === 'Passed')?.count || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Loading stats…</p>
        )}

        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">
            Database location: <code className="font-mono text-xs bg-gray-100 px-1 rounded">backend/data/testcases.db</code>
          </p>
        </div>
      </div>

      {/* About */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-3">About TestCase AI</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>Version 1.0.0 — AI-Powered Test Case Generator</p>
          <p>Frontend: React 18 + Vite + Tailwind CSS + Recharts</p>
          <p>Backend: Node.js + Express + SQLite (better-sqlite3)</p>
          <p>AI: OpenAI-compatible API with mock fallback</p>
          <p>Export: CSV, Excel (xlsx), PDF (jsPDF)</p>
        </div>
      </div>
    </div>
  );
}
