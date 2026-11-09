import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { getTestCase, updateTestCase } from '../services/api';
import { LoadingPage, ErrorMessage } from '../components/ui';

const TYPES = ['Positive', 'Negative', 'Boundary', 'Edge Case', 'Functional', 'Validation'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['Not Executed', 'Passed', 'Failed', 'Blocked'];

export default function TestCaseEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    getTestCase(id)
      .then(tc => setForm({
        test_scenario: tc.test_scenario || '',
        title: tc.title || '',
        description: tc.description || '',
        preconditions: tc.preconditions || '',
        test_steps: tc.test_steps || '',
        test_data: tc.test_data || '',
        expected_result: tc.expected_result || '',
        priority: tc.priority || 'Medium',
        test_type: tc.test_type || 'Functional',
        execution_status: tc.execution_status || 'Not Executed',
      }))
      .catch(e => setApiError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.test_steps.trim()) e.test_steps = 'Test steps are required';
    if (!form.expected_result.trim()) e.expected_result = 'Expected result is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      await updateTestCase(id, form);
      navigate(`/test-cases/${id}`);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const f = (field) =>
    `input-field ${errors[field] ? 'border-red-400 focus:ring-red-400' : ''}`;

  if (loading) return <LoadingPage />;
  if (!form) return <ErrorMessage message={apiError || 'Not found'} />;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-semibold text-gray-900">Edit Test Case</h2>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <div>
          <label className="label">Test Scenario</label>
          <input className={f('test_scenario')} value={form.test_scenario}
            onChange={e => setForm(f2 => ({ ...f2, test_scenario: e.target.value }))} />
        </div>

        <div>
          <label className="label">Title <span className="text-red-500">*</span></label>
          <input className={f('title')} value={form.title}
            onChange={e => setForm(f2 => ({ ...f2, title: e.target.value }))} />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className={`${f('description')} h-20 resize-none`} value={form.description}
            onChange={e => setForm(f2 => ({ ...f2, description: e.target.value }))} />
        </div>

        <div>
          <label className="label">Preconditions</label>
          <textarea className={`${f('preconditions')} h-20 resize-none`} value={form.preconditions}
            onChange={e => setForm(f2 => ({ ...f2, preconditions: e.target.value }))} />
        </div>

        <div>
          <label className="label">Test Steps <span className="text-red-500">*</span></label>
          <textarea className={`${f('test_steps')} h-32 resize-y font-mono text-sm`} value={form.test_steps}
            onChange={e => setForm(f2 => ({ ...f2, test_steps: e.target.value }))} />
          {errors.test_steps && <p className="text-xs text-red-500 mt-1">{errors.test_steps}</p>}
        </div>

        <div>
          <label className="label">Test Data</label>
          <textarea className={`${f('test_data')} h-20 resize-none`} value={form.test_data}
            onChange={e => setForm(f2 => ({ ...f2, test_data: e.target.value }))} />
        </div>

        <div>
          <label className="label">Expected Result <span className="text-red-500">*</span></label>
          <textarea className={`${f('expected_result')} h-24 resize-none`} value={form.expected_result}
            onChange={e => setForm(f2 => ({ ...f2, expected_result: e.target.value }))} />
          {errors.expected_result && <p className="text-xs text-red-500 mt-1">{errors.expected_result}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Priority</label>
            <select className="input-field" value={form.priority}
              onChange={e => setForm(f2 => ({ ...f2, priority: e.target.value }))}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Test Type</label>
            <select className="input-field" value={form.test_type}
              onChange={e => setForm(f2 => ({ ...f2, test_type: e.target.value }))}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Execution Status</label>
            <select className="input-field" value={form.execution_status}
              onChange={e => setForm(f2 => ({ ...f2, execution_status: e.target.value }))}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">⚠ {apiError}</div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Changes</>}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
