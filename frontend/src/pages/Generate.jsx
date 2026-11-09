import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, ChevronDown, Loader2, CheckCircle, Info } from 'lucide-react';
import { generateTestCases, getAiStatus } from '../services/api';
import { MockAiBanner, RealAiBanner } from '../components/ui';
import { priorityBadge, testTypeBadge } from '../utils/helpers';

const TESTING_TYPES = ['Functional', 'Integration', 'Regression', 'Smoke', 'Performance', 'Security', 'Usability'];
const PRIORITIES = ['High', 'Medium', 'Low'];

export default function Generate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    project_name: '',
    module_name: '',
    feature_name: '',
    requirement_description: '',
    user_story: '',
    testing_type: 'Functional',
    priority: 'Medium',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.project_name.trim()) e.project_name = 'Project name is required';
    if (!form.module_name.trim()) e.module_name = 'Module name is required';
    if (!form.feature_name.trim()) e.feature_name = 'Feature name is required';
    if (!form.requirement_description.trim()) e.requirement_description = 'Requirement description is required';
    if (form.requirement_description.trim().length < 10) e.requirement_description = 'Description must be at least 10 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    setResult(null);
    try {
      const data = await generateTestCases(form);
      setResult(data);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field) =>
    `input-field ${errors[field] ? 'border-red-400 focus:ring-red-400' : ''}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Form Card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Wand2 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Generate Test Cases</h2>
            <p className="text-sm text-gray-500">Enter your requirements and let AI generate comprehensive test cases</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Project Name <span className="text-red-500">*</span></label>
              <input
                className={fieldClass('project_name')}
                placeholder="e.g. Banking App"
                value={form.project_name}
                onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))}
              />
              {errors.project_name && <p className="text-xs text-red-500 mt-1">{errors.project_name}</p>}
            </div>
            <div>
              <label className="label">Module Name <span className="text-red-500">*</span></label>
              <input
                className={fieldClass('module_name')}
                placeholder="e.g. Authentication"
                value={form.module_name}
                onChange={e => setForm(f => ({ ...f, module_name: e.target.value }))}
              />
              {errors.module_name && <p className="text-xs text-red-500 mt-1">{errors.module_name}</p>}
            </div>
            <div>
              <label className="label">Feature Name <span className="text-red-500">*</span></label>
              <input
                className={fieldClass('feature_name')}
                placeholder="e.g. User Login"
                value={form.feature_name}
                onChange={e => setForm(f => ({ ...f, feature_name: e.target.value }))}
              />
              {errors.feature_name && <p className="text-xs text-red-500 mt-1">{errors.feature_name}</p>}
            </div>
          </div>

          {/* Requirement Description */}
          <div>
            <label className="label">
              Requirement Description <span className="text-red-500">*</span>
            </label>
            <textarea
              className={`${fieldClass('requirement_description')} h-36 resize-y font-mono text-sm`}
              placeholder="Describe the feature, functionality, or workflow to be tested in detail. Include inputs, outputs, business rules, and expected behaviors..."
              value={form.requirement_description}
              onChange={e => setForm(f => ({ ...f, requirement_description: e.target.value }))}
            />
            <div className="flex justify-between mt-1">
              {errors.requirement_description
                ? <p className="text-xs text-red-500">{errors.requirement_description}</p>
                : <span />}
              <span className="text-xs text-gray-400">{form.requirement_description.length} chars</span>
            </div>
          </div>

          {/* User Story */}
          <div>
            <label className="label">
              User Story <span className="text-gray-400 font-normal text-xs ml-1">(optional)</span>
            </label>
            <textarea
              className="input-field h-20 resize-none text-sm"
              placeholder='e.g. "As a registered user, I want to log in to the system so that I can access my account."'
              value={form.user_story}
              onChange={e => setForm(f => ({ ...f, user_story: e.target.value }))}
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Testing Type</label>
              <select
                className="input-field"
                value={form.testing_type}
                onChange={e => setForm(f => ({ ...f, testing_type: e.target.value }))}
              >
                {TESTING_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input-field"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Info note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
            <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              The system will generate test cases covering Positive, Negative, Boundary Value, Edge Case, Functional, and Validation testing. Results are based strictly on your described requirements.
            </p>
          </div>

          {/* Submit */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">⚠ {apiError}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating test cases…
              </>
            ) : (
              <>
                <Wand2 size={18} />
                Generate Test Cases
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && <GenerationResult result={result} onViewAll={() => navigate('/test-cases')} />}
    </div>
  );
}

function GenerationResult({ result, onViewAll }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Summary */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle size={22} className="text-emerald-500" />
          <div>
            <p className="font-semibold text-gray-900">
              Generated {result.test_cases.length} Test Cases
            </p>
            <p className="text-sm text-gray-500">
              Project: {result.project.project_name} · Requirement #{result.requirement.id}
            </p>
          </div>
        </div>
        {result.generation_mode === 'gemini'
          ? <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="text-emerald-500">✨</span>
              <p className="text-xs text-emerald-800">
                <strong>Generated by Google Gemini ({result.model || 'gemini-2.0-flash'})</strong> — Test cases produced by real AI.
              </p>
            </div>
          : <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="text-amber-500">🤖</span>
              <p className="text-xs text-amber-800">
                <strong>Mock Generation Active</strong>
                {result.fallback_reason ? ` — Gemini fallback: ${result.fallback_reason}` : ' — Add GEMINI_API_KEY to backend/.env to enable real AI.'}
              </p>
            </div>
        }
        <div className="flex gap-3 mt-4">
          <button onClick={onViewAll} className="btn-primary">
            View in Test Case Manager →
          </button>
        </div>
      </div>

      {/* Test cases list */}
      <div className="space-y-3">
        {result.test_cases.map((tc, idx) => (
          <div key={tc.id} className="card overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(expanded === idx ? null : idx)}
            >
              <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex-shrink-0">
                {tc.test_case_id}
              </span>
              <span className="flex-1 font-medium text-sm text-gray-800 truncate">{tc.title}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={testTypeBadge(tc.test_type)}>{tc.test_type}</span>
                <span className={`badge-${tc.priority?.toLowerCase()}`}>{tc.priority}</span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${expanded === idx ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {expanded === idx && (
              <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Detail label="Test Scenario" value={tc.test_scenario} />
                  <Detail label="Description" value={tc.description} />
                  <Detail label="Preconditions" value={tc.preconditions} />
                  <Detail label="Test Data" value={tc.test_data} />
                  <div className="md:col-span-2">
                    <Detail label="Test Steps" value={tc.test_steps} pre />
                  </div>
                  <div className="md:col-span-2">
                    <Detail label="Expected Result" value={tc.expected_result} highlight />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ label, value, pre, highlight }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      {pre ? (
        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white rounded p-2 border border-gray-200">
          {value}
        </pre>
      ) : (
        <p className={`text-sm ${highlight ? 'text-emerald-700 font-medium' : 'text-gray-700'}`}>{value}</p>
      )}
    </div>
  );
}
