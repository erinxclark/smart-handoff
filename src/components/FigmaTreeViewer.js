import React, { useState } from 'react';

const normalizeNode = (node) => {
  if (!node) return null;

  // Create a new node with enhanced metadata
  const normalizedNode = {
    ...node,
    children: [],
    isGroup: node.type === 'GROUP' || node.type === 'FRAME',
    isFrame: node.type === 'FRAME',
    parentType: node.parent ? node.parent.type : null,
    absoluteBoundingBox: node.absoluteBoundingBox || null,
    relativeTransform: node.relativeTransform || null,
    layoutMode: node.layoutMode || null,
    primaryAxisSizingMode: node.primaryAxisSizingMode || null,
    counterAxisSizingMode: node.counterAxisSizingMode || null,
    primaryAxisAlignItems: node.primaryAxisAlignItems || null,
    counterAxisAlignItems: node.counterAxisAlignItems || null,
    paddingLeft: node.paddingLeft || 0,
    paddingRight: node.paddingRight || 0,
    paddingTop: node.paddingTop || 0,
    paddingBottom: node.paddingBottom || 0,
    itemSpacing: node.itemSpacing || 0
  };

  // If the node has children, process them in reverse order
  // to match Figma's visual hierarchy
  if (node.children && Array.isArray(node.children)) {
    normalizedNode.children = [...node.children]
      .reverse() // Reverse the order to match Figma's visual hierarchy
      .map(child => {
        const normalizedChild = normalizeNode(child);
        if (normalizedChild) {
          // Add parent reference for easier traversal
          normalizedChild.parent = normalizedNode;
        }
        return normalizedChild;
      })
      .filter(Boolean); // Remove any null nodes
  }

  return normalizedNode;
};

const FigmaTreeViewer = ({ document, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!document) {
    return (
      <div className="mt-6 p-4 bg-white rounded shadow w-full max-w-2xl">
        <p className="text-gray-500">No document data available</p>
      </div>
    );
  }

  // Normalize the document structure
  const normalizedDocument = normalizeNode(document);

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
              className={`text-blue-700 hover:underline focus:outline-none ${
                child.isGroup ? 'font-bold' : ''
              } ${child.isFrame ? 'text-purple-700' : ''}`}
              onClick={() => onSelect(child)}
            >
              {child.name} ({child.type})
              {child.isGroup && ' [Group]'}
              {child.isFrame && ' [Frame]'}
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

      {renderNodes(normalizedDocument, searchTerm)}
    </div>
  );
};

export default FigmaTreeViewer;
