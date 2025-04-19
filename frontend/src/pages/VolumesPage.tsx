import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

interface Volume {
  id: string;
  name: string;
  size: number;
  status: string;
}

const VolumesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [newName, setNewName] = useState('');
  const [newSize, setNewSize] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVolumes = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.get<Volume[]>(`/volumes/${projectId}`);
      setVolumes(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load volumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumes();
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      await api.post(`/volumes/${projectId}`, { name: newName, size: newSize });
      setNewName('');
      setNewSize(1);
      fetchVolumes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create volume');
    }
  };

  const handleDelete = async (volumeId: string) => {
    if (!projectId || !window.confirm('Delete this volume?')) return;
    try {
      await api.delete(`/volumes/${projectId}/${volumeId}`);
      fetchVolumes();
    } catch {
      alert('Delete failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Volumes</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && volumes.length === 0 && <p>No volumes found.</p>}
      <ul className="space-y-2 mb-6">
        {volumes.map((v) => (
          <li
            key={v.id}
            className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded shadow"
          >
            <div>
              <span className="font-medium">{v.name || v.id}</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {v.size} GB • {v.status}
              </p>
            </div>
            <button
              onClick={() => handleDelete(v.id)}
              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Create New Volume</h2>
        <div className="flex space-x-2 items-end">
          <div className="flex-1">
            <label className="block mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-1">Size (GB)</label>
            <input
              type="number"
              value={newSize}
              min={1}
              onChange={(e) => setNewSize(Number(e.target.value))}
              className="w-20 px-3 py-2 border rounded focus:outline-none"
              required
            />
          </div>
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

export default VolumesPage;