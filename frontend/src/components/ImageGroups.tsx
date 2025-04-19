import React, { useState, useEffect } from 'react';
import { SiUbuntu, SiDebian, SiCentos, SiFedora } from 'react-icons/si';
import { FaWindows } from 'react-icons/fa';
import { FiChevronDown } from 'react-icons/fi';

interface ImageGroup {
  name: string;
  icon: React.ComponentType<{ size?: number }>;
  versions: string[];
}

const groups: ImageGroup[] = [
  { name: 'Ubuntu', icon: SiUbuntu, versions: ['22.04', '20.04', '18.04'] },
  { name: 'Debian', icon: SiDebian, versions: ['12', '11', '10'] },
  { name: 'CentOS', icon: SiCentos, versions: ['8', '7'] },
  { name: 'Windows', icon: FaWindows, versions: ['2019', '2016'] },
  { name: 'Fedora', icon: SiFedora, versions: ['36', '35'] },
];

interface ImageGroupsProps {
  onSelectionChange?: (name: string, version: string) => void;
}
const ImageGroups: React.FC<ImageGroupsProps> = ({ onSelectionChange }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedVersions, setSelectedVersions] = useState<string[]>(
    groups.map((g) => g.versions[0])
  );
  // Notify initial selection
  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(groups[0].name, groups[0].versions[0]);
    }
  }, []);

  const handleSelect = (index: number) => {
    setActiveIndex(index);
    if (onSelectionChange) {
      onSelectionChange(groups[index].name, selectedVersions[index]);
    }
  };

  const handleVersionChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const newVersions = [...selectedVersions];
    newVersions[index] = e.target.value;
    setSelectedVersions(newVersions);
    if (onSelectionChange) {
      onSelectionChange(groups[index].name, e.target.value);
    }
  };

  return (
    <div className="">
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {groups.map((group, idx) => {
          const Icon = group.icon;
          const isActive = idx === activeIndex;
          return (
            <div
              key={group.name}
              onClick={() => handleSelect(idx)}
              className={
                `flex flex-col items-center min-w-[120px] p-4 rounded-lg cursor-pointer border ` +
                (isActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600')
              }
            >
              <Icon size={36} />
              <span className="mt-2 font-medium">{group.name}</span>
              {isActive ? (
                <div className="mt-2 flex items-center">
                  <select
                    value={selectedVersions[idx]}
                    onChange={(e) => handleVersionChange(e, idx)}
                    className="bg-transparent focus:outline-none"
                  >
                    {group.versions.map((ver) => (
                      <option key={ver} value={ver}>
                        {ver}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="ml-1" />
                </div>
              ) : (
                <div className="mt-2 flex items-center text-gray-500 dark:text-gray-400">
                  <span className="text-sm">Select version</span>
                  <FiChevronDown className="ml-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImageGroups;