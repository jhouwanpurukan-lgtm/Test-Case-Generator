import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const pageTitles = {
  '/': 'Dashboard',
  '/generate': 'Generate Test Cases',
  '/test-cases': 'Test Case Management',
  '/history': 'Generation History',
  '/ai-assistant': 'AI Assistant',
  '/settings': 'Settings',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const title = Object.entries(pageTitles)
    .sort(([a], [b]) => b.length - a.length)
    .find(([path]) => location.pathname.startsWith(path))?.[1] || 'Test Case Generator';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium border border-blue-200">
              AI-Powered
            </span>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 p-6 animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
