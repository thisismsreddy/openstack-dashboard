import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DarkModeToggle from './DarkModeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { projects, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentProjectId = location.pathname.match(/projects\/(\d+)/)?.[1] || '';

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    navigate(`/projects/${pid}/servers`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 shadow">
        <div className="flex items-center space-x-4">
          <select
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded"
            onChange={handleProjectChange}
            value={currentProjectId}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search"
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 focus:outline-none"
          />
        </div>
        <div className="flex items-center space-x-4">
          <DarkModeToggle />
          <button
            onClick={() => logout()}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded"
          >
            {user?.userId}
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
};

export default Layout;