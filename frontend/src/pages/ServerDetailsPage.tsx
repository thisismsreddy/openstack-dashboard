import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

interface Server {
  id: string;
  name: string;
  status: string;
  [key: string]: any;
}

const ServerDetailsPage: React.FC = () => {
  const { projectId, serverId } = useParams<{ projectId: string; serverId: string }>();
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServer = async () => {
    if (!projectId || !serverId) return;
    setLoading(true);
    try {
      const res = await api.get<any>(`/servers/${projectId}`);
      const found = res.data.find((s: Server) => s.id === serverId);
      setServer(found || null);
    } catch (err: any) {
      setError('Failed to load server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServer();
  }, [projectId, serverId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!server) return <p>Server not found.</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{server.name}</h1>
        <Link
          to={`/projects/${projectId}/servers`}
          className="text-blue-500 hover:underline"
        >
          &larr; Back to servers
        </Link>
      </div>
      <pre className="bg-white dark:bg-gray-800 p-4 rounded shadow overflow-auto">
        {JSON.stringify(server, null, 2)}
      </pre>
    </div>
  );
};

export default ServerDetailsPage;