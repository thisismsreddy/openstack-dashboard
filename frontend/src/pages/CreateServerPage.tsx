import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import DarkModeToggle from '../components/DarkModeToggle';
import ImageGroups from '../components/ImageGroups';

interface Flavor {
  id: string;
  name: string;
  vcpus: number;
  ram: number; // in MB
  disk: number; // in GB
}
interface Network {
  id: string;
  name: string;
}

const CreateServerPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [serverName, setServerName] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ name: string; version: string }>({ name: '', version: '' });
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // load flavors and networks
    if (!projectId) return;
    api.get<any>(`/servers/${projectId}/flavors`).then((res) => {
      const data = res.data;
      if (Array.isArray(data)) {
        setFlavors(data);
        if (data.length) setSelectedFlavor(data[0].id);
      } else if (data && Array.isArray(data.flavors)) {
        setFlavors(data.flavors);
        if (data.flavors.length) setSelectedFlavor(data.flavors[0].id);
      } else {
        console.error('Unexpected flavors data:', data);
        setFlavors([]);
      }
    });
    api.get<any>(`/servers/${projectId}/networks`).then((res) => {
      const data = res.data;
      if (Array.isArray(data)) {
        setNetworks(data);
        if (data.length) setSelectedNetwork(data[0].id);
      } else if (data && Array.isArray(data.networks)) {
        setNetworks(data.networks);
        if (data.networks.length) setSelectedNetwork(data.networks[0].id);
      } else {
        console.error('Unexpected networks data:', data);
        setNetworks([]);
      }
    });
  }, [projectId]);

  const handleImageSelect = (name: string, version: string) => {
    setSelectedImage({ name, version });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      await api.post(`/servers/${projectId}`, {
        name: serverName,
        imageRef: selectedImage.version,
        flavorRef: selectedFlavor,
        networks: [selectedNetwork],
      });
      navigate(`/projects/${projectId}/servers`);
    } catch (err: any) {
      console.error('Create server error', err);
      setError(err.response?.data?.message || 'Failed to create server');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex justify-end mb-6">
        <DarkModeToggle />
      </div>
      <h1 className="text-2xl font-semibold mb-4">Create a Cloud Server</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="text-red-500">{error}</div>}
        <div>
          <label className="block mb-1">Name</label>
          <input
            type="text"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none"
            placeholder="My Server"
            required
          />
        </div>
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Image</h2>
          <ImageGroups onSelectionChange={handleImageSelect} />
        </section>
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Flavor</h2>
          <select
            value={selectedFlavor}
            onChange={(e) => setSelectedFlavor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none"
          >
            {flavors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.vcpus} vCPU, {f.ram / 1024} GB RAM, {f.disk} GB Disk)
              </option>
            ))}
          </select>
        </section>
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Network</h2>
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none"
          >
            {networks.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </section>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Server
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateServerPage;