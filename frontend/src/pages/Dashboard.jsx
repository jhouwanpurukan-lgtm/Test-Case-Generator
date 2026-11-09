import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, CheckCircle, XCircle, AlertTriangle, TrendingUp,
  Wand2, Clock, ArrowRight, FolderOpen, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getStats } from '../services/api';
import { LoadingPage, ErrorMessage } from '../components/ui';
import { formatDate, statusBadge, testTypeBadge } from '../utils/helpers';

const TYPE_COLORS = {
  Positive: '#10b981', Negative: '#ef4444', Boundary: '#3b82f6',
  'Edge Case': '#8b5cf6', Functional: '#06b6d4', Validation: '#f59e0b'
};
const STATUS_COLORS = { 'Not Executed': '#94a3b8', Passed: '#22c55e', Failed: '#ef4444', Blocked: '#f97316' };

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStats();
      setStats(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingPage message="Loading dashboard…" />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const typeChartData = stats.by_type.map(t => ({ name: t.test_type, value: t.count }));
  const statusChartData = stats.by_status.map(s => ({ name: s.execution_status, value: s.count }));
  const priorityChartData = stats.by_priority.map(p => ({ name: p.priority, count: p.count }));

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">Welcome to TestCase AI</h2>
        <p className="text-blue-200 text-sm mb-4">AI-powered test case generation for modern QA teams.</p>
        <Link to="/generate" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Wand2 size={16} />
          Generate Test Cases
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={ClipboardList} label="Total Test Cases" value={stats.total} color="bg-blue-600" />
        <StatCard icon={BarChart3} label="Test Scenarios" value={stats.scenarios} color="bg-indigo-600" />
        <StatCard icon={CheckCircle} label="Positive Tests" value={stats.positive} color="bg-emerald-600" />
        <StatCard icon={XCircle} label="Negative Tests" value={stats.negative} color="bg-red-600" />
        <StatCard icon={AlertTriangle} label="Edge Cases" value={stats.edge_case} color="bg-purple-600" />
        <StatCard icon={FolderOpen} label="Projects" value={stats.projects} color="bg-cyan-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart: by priority */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Test Cases by Priority</h3>
          {priorityChartData.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart: by type */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribution by Test Type</h3>
          {typeChartData.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={typeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={false}>
                  {typeChartData.map((entry, i) => (
                    <Cell key={i} fill={TYPE_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart: by status */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Execution Status</h3>
          {statusChartData.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={false}>
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Recent Test Cases</h3>
          </div>
          <Link to="/test-cases" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {stats.recent_activity.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No test cases yet.{' '}
            <Link to="/generate" className="text-blue-600 hover:underline">Generate your first ones →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['Test Case ID', 'Feature', 'Title', 'Type', 'Priority', 'Status', 'Created'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent_activity.map((tc) => (
                  <tr key={tc.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{tc.test_case_id}</td>
                    <td className="px-4 py-3 text-gray-600">{tc.feature_name || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{tc.title}</td>
                    <td className="px-4 py-3"><span className={testTypeBadge(tc.test_type)}>{tc.test_type}</span></td>
                    <td className="px-4 py-3">
                      <span className={`badge-${tc.priority?.toLowerCase()}`}>{tc.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(tc.execution_status)}>{tc.execution_status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(tc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
