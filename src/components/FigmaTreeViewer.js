/**
 * FigmaTreeViewer Component
 * 
 * This component displays and manages the Figma document structure as a tree view.
 * It includes functionality for:
 * - Displaying the Figma document hierarchy in correct order
 * - Expand/collapse functionality for nodes
 * - Proper visual hierarchy with icons
 * - Node selection for code generation
 */

import React, { useState } from 'react';

const FigmaTreeViewer = ({ document, onSelect }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  
  const toggleExpand = (nodeId, e) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node, depth = 0) => {
    if (!node) return null;

    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    
    return (
      <div key={node.id}>
        <div 
          className="flex items-center gap-1 px-2 py-1 hover:bg-slate-100 rounded cursor-pointer text-sm"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {/* Expand/collapse button */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(node.id, e)}
              className="w-4 h-4 flex items-center justify-center text-xs hover:bg-slate-200 rounded"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <span className="w-4" />
          )}
          
          {/* Node content - clickable to select */}
          <div 
            onClick={() => onSelect(node)}
            className="flex items-center gap-1 flex-1"
          >
            {/* Icon */}
            <span className="text-xs">
              {node.type === 'CANVAS' && '📄'}
              {node.type === 'FRAME' && '🖼️'}
              {node.type === 'GROUP' && '📁'}
              {node.type === 'COMPONENT' && '🧩'}
              {node.type === 'RECTANGLE' && '▭'}
              {node.type === 'TEXT' && '📝'}
              {node.type === 'INSTANCE' && '⚡'}
            </span>
            
            {/* Name */}
            <span className="truncate">{node.name}</span>
            
            {/* Child count */}
            {hasChildren && (
              <span className="text-xs text-slate-400">({node.children.length})</span>
            )}
          </div>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!document) {
    return (
      <div className="mt-6 p-4 bg-white rounded shadow w-full max-w-2xl">
        <p className="text-gray-500">No document data available</p>
      </div>
    );
  }

  // Figma files have pages as document.children (CANVAS nodes)
  return (
    <div className="mt-6 p-4 bg-white rounded shadow w-full max-w-2xl overflow-auto max-h-[500px]">
      <h2 className="text-xl font-semibold mb-2">📁 Figma File Tree</h2>
      <div className="text-sm overflow-y-auto max-h-96">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-2 px-2">
          Layers
        </div>
        {document.children && document.children.length > 0 ? (
          document.children.map(page => renderNode(page, 0))
        ) : (
          renderNode(document, 0)
        )}
      </div>
    </div>
  );
};

export default FigmaTreeViewer;
