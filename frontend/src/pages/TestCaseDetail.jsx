import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { getTestCase, deleteTestCase, patchTestCase } from '../services/api';
import { LoadingPage, ErrorMessage, ConfirmDialog } from '../components/ui';
import { priorityBadge, testTypeBadge, statusBadge, formatDate } from '../utils/helpers';

const STATUSES = ['Not Executed', 'Passed', 'Failed', 'Blocked'];

const statusIcon = (s) => ({
  'Passed': <CheckCircle size={16} className="text-emerald-500" />,
  'Failed': <XCircle size={16} className="text-red-500" />,
  'Blocked': <AlertCircle size={16} className="text-orange-500" />,
}[s] || <Clock size={16} className="text-gray-400" />);

function Section({ label, value, pre }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</p>
      {pre ? (
        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-3 border border-gray-200">
          {value}
        </pre>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
      )}
    </div>
  );
}

export default function TestCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tc, setTc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getTestCase(id)
      .then(setTc)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteTestCase(id);
      navigate('/test-cases');
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      const updated = await patchTestCase(id, { execution_status: newStatus });
      setTc(t => ({ ...t, execution_status: updated.execution_status }));
    } catch (e) {
      alert('Update failed: ' + e.message);
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!tc) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <p className="font-mono text-xs text-blue-600">{tc.test_case_id}</p>
          <h2 className="font-semibold text-gray-900">{tc.title}</h2>
        </div>
        <div className="flex gap-2">
          <Link to={`/test-cases/${id}/edit`} className="btn-secondary text-sm py-1.5">
            <Edit3 size={14} /> Edit
          </Link>
          <button onClick={() => setDeleteOpen(true)} className="btn-danger text-sm py-1.5">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Meta badges */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Type:</span>
          <span className={testTypeBadge(tc.test_type)}>{tc.test_type}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Priority:</span>
          <span className={priorityBadge(tc.priority)}>{tc.priority}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Project:</span>
          <span className="text-sm text-gray-700">{tc.project_name || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Feature:</span>
          <span className="text-sm text-gray-700">{tc.feature_name || '—'}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">Status:</span>
          {statusIcon(tc.execution_status)}
          <select
            className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${statusBadge(tc.execution_status)}`}
            value={tc.execution_status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={statusLoading}
          >
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="card p-6 space-y-5">
        <Section label="Test Scenario" value={tc.test_scenario} />
        <Section label="Description" value={tc.description} />

        <hr className="border-gray-100" />

        <Section label="Preconditions" value={tc.preconditions} />

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Test Steps</p>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 border border-gray-200 leading-relaxed">
            {tc.test_steps || '—'}
          </pre>
        </div>

        <Section label="Test Data" value={tc.test_data} />

        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Expected Result</p>
          <p className="text-sm text-emerald-800 font-medium">{tc.expected_result || '—'}</p>
        </div>

        <hr className="border-gray-100" />

        <div className="flex gap-6 text-xs text-gray-400">
          <span>Created: {formatDate(tc.created_at)}</span>
          <span>Updated: {formatDate(tc.updated_at)}</span>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Test Case"
        message={`Delete "${tc.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        danger
      />
    </div>
  );
}
