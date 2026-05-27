import { Routes, Route, Link } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ProjectView } from './pages/ProjectView';
import { MindMapView } from './pages/MindMapView';
import { GraphsView } from './pages/GraphsView';
import { SettingsView } from './pages/SettingsView';

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">Planora</Link>
          <nav className="main-nav">
            <Link to="/">Dashboard</Link>
            <Link to="/settings">Settings</Link>
            <Link to="/documentation">Documentation</Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:id" element={<ProjectView />} />
          <Route path="/project/:id/mindmap" element={<MindMapView />} />
          <Route path="/project/:id/graphs" element={<GraphsView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </main>
    </div>
  );
}
