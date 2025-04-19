import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

interface Server {
  id: string;
  name: string;
  status: string;
}

const ServersPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.get<any>(`/servers/${projectId}`);
      const data = res.data;
      if (Array.isArray(data)) {
        setServers(data);
      } else if (data && Array.isArray((data as any).servers)) {
        setServers((data as any).servers);
      } else {
        console.error('Unexpected servers data:', data);
        setError('Failed to load servers');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [projectId]);

  const handleAction = async (serverId: string, action: string) => {
    if (!projectId) return;
    try {
      await api.post(`/servers/${projectId}/${serverId}/action`, { action });
      fetchServers();
    } catch (err: any) {
      console.error(err);
      alert('Action failed');
    }
  };

  const handleDelete = async (serverId: string) => {
    if (!projectId || !window.confirm('Delete this server?')) return;
    try {
      await api.delete(`/servers/${projectId}/${serverId}`);
      fetchServers();
    } catch {
      alert('Delete failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Servers</h1>
        <Link
          to={`/projects/${projectId}/servers/create`}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + Create Server
        </Link>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && servers.length === 0 && <p>No servers found.</p>}
      <ul className="space-y-2">
        {servers.map((s) => (
          <li
            key={s.id}
            className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded shadow"
          >
            <div>
              <Link
                to={`/projects/${projectId}/servers/${s.id}`}
                className="text-lg font-medium hover:underline"
              >
                {s.name}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.status}</p>
            </div>
            <div className="space-x-2">
              {s.status === 'ACTIVE' ? (
                <button
                  onClick={() => handleAction(s.id, 'shutdown')}
                  className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => handleAction(s.id, 'start')}
                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Start
                </button>
              )}
              <button
                onClick={() => handleAction(s.id, 'reboot')}
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Reboot
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ServersPage;