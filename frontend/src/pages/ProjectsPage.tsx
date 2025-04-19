import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const ProjectsPage: React.FC = () => {
  const { projects, createProject } = useAuth();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createProject(newName.trim());
      setNewName('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Your Projects</h1>
      <ul className="mb-6 space-y-2">
        {projects.map((p) => (
          <li key={p.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
            <Link
              to={`/projects/${p.id}/servers`}
              className="text-lg font-medium hover:underline"
            >
              {p.name}
            </Link>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Create New Project</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectsPage;