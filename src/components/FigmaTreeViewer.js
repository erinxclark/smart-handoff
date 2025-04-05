import React, { useState } from 'react';

const FigmaTreeViewer = ({ document, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!document) {
    return (
      <div className="mt-6 p-4 bg-white rounded shadow w-full max-w-2xl">
        <p className="text-gray-500">No document data available</p>
      </div>
    );
  }

  const renderNodes = (node, searchTerm = '') => {
    if (!node || !node.children) return null;

    const filteredChildren = node.children.filter(child => 
      child.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredChildren.length === 0) return null;

    return (
      <ul className="ml-4 list-disc text-sm">
        {filteredChildren.map((child) => (
          <li key={child.id} className="py-1">
            <button
              className="text-blue-700 hover:underline focus:outline-none"
              onClick={() => onSelect(child)}
            >
              {child.name} ({child.type})
            </button>
            {renderNodes(child, searchTerm)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="mt-6 p-4 bg-white rounded shadow w-full max-w-2xl overflow-auto max-h-[500px]">
      <h2 className="text-xl font-semibold mb-2">📁 Figma File Tree</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {renderNodes(document, searchTerm)}
    </div>
  );
};

export default FigmaTreeViewer;
