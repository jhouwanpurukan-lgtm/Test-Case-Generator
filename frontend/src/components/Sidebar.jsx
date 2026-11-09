import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wand2, ClipboardList, History,
  Bot, Settings, TestTube2, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/generate', label: 'Generate Test Cases', icon: Wand2 },
  { to: '/test-cases', label: 'Test Case Management', icon: ClipboardList },
  { to: '/history', label: 'Generation History', icon: History },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Bot },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  return (
    <aside className={`flex flex-col bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} min-h-screen flex-shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <TestTube2 size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white leading-tight">TestCase AI</p>
            <p className="text-xs text-slate-400">QA Generator</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-4 border-t border-slate-700 hover:bg-slate-800 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronRight
          size={18}
          className={`text-slate-400 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
        />
      </button>
    </aside>
  );
}
