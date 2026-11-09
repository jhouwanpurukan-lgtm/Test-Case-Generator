import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import TestCaseManagement from './pages/TestCaseManagement';
import TestCaseDetail from './pages/TestCaseDetail';
import TestCaseEdit from './pages/TestCaseEdit';
import GenerationHistory from './pages/GenerationHistory';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="generate" element={<Generate />} />
          <Route path="test-cases" element={<TestCaseManagement />} />
          <Route path="test-cases/:id" element={<TestCaseDetail />} />
          <Route path="test-cases/:id/edit" element={<TestCaseEdit />} />
          <Route path="history" element={<GenerationHistory />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
