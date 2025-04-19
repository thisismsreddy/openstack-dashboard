import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectsPage from './pages/ProjectsPage';
import ServersPage from './pages/ServersPage';
import CreateServerPage from './pages/CreateServerPage';
import ServerDetailsPage from './pages/ServerDetailsPage';
import VolumesPage from './pages/VolumesPage';

// Redirect route to login if not authenticated
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route
      path="/*"
      element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId/servers" element={<ServersPage />} />
              <Route path="projects/:projectId/servers/create" element={<CreateServerPage />} />
              <Route
                path="projects/:projectId/servers/:serverId"
                element={<ServerDetailsPage />}
              />
              <Route path="projects/:projectId/volumes" element={<VolumesPage />} />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      }
    />
  </Routes>
);

export default App;