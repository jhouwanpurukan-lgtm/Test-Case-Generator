import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Trash2, Eye, Edit3, Download,
  ChevronDown, RefreshCw, ClipboardList, X
} from 'lucide-react';
import { getTestCases, deleteTestCase, patchTestCase, exportPdfData } from '../services/api';
import { LoadingPage, ErrorMessage, EmptyState, ConfirmDialog } from '../components/ui';
import { priorityBadge, testTypeBadge, statusBadge, formatDate, truncate } from '../utils/helpers';
import { downloadPDF } from '../utils/pdfExport';
import { exportUrl } from '../services/api';

const PRIORITIES = ['', 'High', 'Medium', 'Low'];
const TEST_TYPES = ['', 'Positive', 'Negative', 'Boundary', 'Edge Case', 'Functional', 'Validation'];
const STATUSES = ['', 'Not Executed', 'Passed', 'Failed', 'Blocked'];

export default function TestCaseManagement() {
  const navigate = useNavigate();
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', priority: '', test_type: '', execution_status: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.priority) params.priority = filters.priority;
      if (filters.test_type) params.test_type = filters.test_type;
      if (filters.execution_status) params.execution_status = filters.execution_status;
      const data = await getTestCases(params);
      setTestCases(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTestCase(deleteTarget.id);
      setTestCases(tc => tc.filter(t => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const handleStatusChange = async (tc, newStatus) => {
    setStatusUpdating(tc.id);
    try {
      const updated = await patchTestCase(tc.id, { execution_status: newStatus });
      setTestCases(tcs => tcs.map(t => t.id === tc.id ? { ...t, execution_status: updated.execution_status } : t));
    } catch (e) {
      alert('Update failed: ' + e.message);
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleExportCSV = () => window.open(exportUrl('csv'), '_blank');
  const handleExportExcel = () => window.open(exportUrl('excel'), '_blank');
  const handleExportPDF = async () => {
    try {
      const rows = await exportPdfData({});
      downloadPDF(rows, 'Test Cases Report');
    } catch (e) {
      alert('PDF export failed: ' + e.message);
    }
  };

  const clearFilters = () => setFilters({ search: '', priority: '', test_type: '', execution_status: '' });
  const hasFilters = filters.search || filters.priority || filters.test_type || filters.execution_status;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">All Test Cases</h2>
          <p className="text-sm text-gray-500">{testCases.length} test case{testCases.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportCSV} className="btn-secondary text-sm py-1.5">
            <Download size={14} /> CSV
          </button>
          <button onClick={handleExportExcel} className="btn-secondary text-sm py-1.5">
            <Download size={14} /> Excel
          </button>
          <button onClick={handleExportPDF} className="btn-secondary text-sm py-1.5">
            <Download size={14} /> PDF
          </button>
          <button onClick={load} className="btn-secondary text-sm py-1.5">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9 text-sm py-2"
              placeholder="Search by ID, title, feature…"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <select
            className="input-field w-auto text-sm py-2"
            value={filters.priority}
            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.filter(Boolean).map(p => <option key={p}>{p}</option>)}
          </select>
          <select
            className="input-field w-auto text-sm py-2"
            value={filters.test_type}
            onChange={e => setFilters(f => ({ ...f, test_type: e.target.value }))}
          >
            <option value="">All Types</option>
            {TEST_TYPES.filter(Boolean).map(t => <option key={t}>{t}</option>)}
          </select>
          <select
            className="input-field w-auto text-sm py-2"
            value={filters.execution_status}
            onChange={e => setFilters(f => ({ ...f, execution_status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map(s => <option key={s}>{s}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary text-sm py-2">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingPage message="Loading test cases…" />
        ) : error ? (
          <div className="p-6"><ErrorMessage message={error} onRetry={load} /></div>
        ) : testCases.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No test cases found"
            description={hasFilters ? 'Try adjusting your filters' : 'Generate test cases to get started'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Test Case ID', 'Feature', 'Title', 'Type', 'Priority', 'Execution Status', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {testCases.map((tc) => (
                  <tr key={tc.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {tc.test_case_id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate" title={tc.feature_name}>
                      {tc.feature_name || '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[240px]">
                      <span title={tc.title}>{truncate(tc.title, 60)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={testTypeBadge(tc.test_type)}>{tc.test_type}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={priorityBadge(tc.priority)}>{tc.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${statusBadge(tc.execution_status)}`}
                        value={tc.execution_status}
                        onChange={e => handleStatusChange(tc, e.target.value)}
                        disabled={statusUpdating === tc.id}
                      >
                        {STATUSES.filter(Boolean).map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(tc.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/test-cases/${tc.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/test-cases/${tc.id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tc)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Test Case"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
