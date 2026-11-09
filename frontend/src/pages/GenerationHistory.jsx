import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ExternalLink, Trash2, Calendar, FolderOpen, Cpu } from 'lucide-react';
import { getHistory, deleteHistory, getHistoryItem } from '../services/api';
import { LoadingPage, ErrorMessage, EmptyState, ConfirmDialog } from '../components/ui';
import { formatDate } from '../utils/helpers';

export default function GenerationHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const load = () => {
    setLoading(true);
    getHistory()
      .then(setHistory)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    try {
      await deleteHistory(deleteTarget.id);
      setHistory(h => h.filter(i => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const handleView = async (item) => {
    setViewLoading(true);
    try {
      const data = await getHistoryItem(item.id);
      setViewItem(data);
    } catch (e) {
      alert('Failed to load: ' + e.message);
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Generation History</h2>
          <p className="text-sm text-gray-500">{history.length} generation session{history.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <LoadingPage />
      ) : error ? (
        <ErrorMessage message={error} onRetry={load} />
      ) : history.length === 0 ? (
        <EmptyState
          icon={History}
          title="No generation history yet"
          description="Generate test cases to see your history here"
        />
      ) : (
        <div className="space-y-3">
          {history.map(item => (
            <div key={item.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Cpu size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{item.project_name}</h3>
                    <span className="text-gray-400">·</span>
                    <span className="text-sm text-gray-600">{item.module_name}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-sm text-gray-600">{item.feature_name}</span>
                    {item.generation_mode === 'real_ai' ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Real AI</span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Mock</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">{item.requirement_description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {formatDate(item.generation_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FolderOpen size={12} /> {item.total_test_cases} test cases generated
                    </span>
                    <span>Testing type: {item.testing_type}</span>
                    <span>Priority: {item.priority}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleView(item)}
                    disabled={viewLoading}
                    className="btn-secondary text-sm py-1.5"
                    title="View test cases from this session"
                  >
                    <ExternalLink size={14} /> View
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete history record"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History item detail modal */}
      {viewItem && (
        <HistoryModal item={viewItem} onClose={() => setViewItem(null)} navigate={navigate} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete History Record"
        message={`Delete history record for "${deleteTarget?.project_name} - ${deleteTarget?.feature_name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}

function HistoryModal({ item, onClose, navigate }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">{item.project_name} — {item.feature_name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{item.total_test_cases} test cases · {formatDate(item.generation_date)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { navigate('/test-cases'); onClose(); }}
              className="btn-primary text-sm py-1.5"
            >
              Open in Manager →
            </button>
            <button onClick={onClose} className="btn-secondary text-sm py-1.5">Close</button>
          </div>
        </div>
        {/* Test cases list */}
        <div className="overflow-y-auto flex-1 p-5 space-y-2">
          {item.test_cases.map(tc => (
            <div
              key={tc.id}
              className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => { navigate(`/test-cases/${tc.id}`); onClose(); }}
            >
              <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex-shrink-0">
                {tc.test_case_id}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{tc.title}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{tc.test_scenario}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  tc.test_type === 'Positive' ? 'bg-emerald-100 text-emerald-700' :
                  tc.test_type === 'Negative' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'}`}>
                  {tc.test_type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
