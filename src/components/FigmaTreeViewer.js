/**
 * FigmaTreeViewer Component
 * 
 * This component displays and manages the Figma document structure as a tree view.
 * It includes functionality for:
 * - Displaying the Figma document hierarchy
 * - Handling node selection and interaction
 * - Preserving Figma's visual hierarchy
 * - Supporting search and filtering
 * 
 * Key Features:
 * 1. Tree Structure:
 *    - Displays Figma nodes in a hierarchical tree
 *    - Maintains proper visual hierarchy
 *    - Supports nested groups and frames
 * 
 * 2. Node Normalization:
 *    - Processes Figma nodes into a consistent format
 *    - Preserves node metadata and properties
 *    - Handles special node types (groups, frames)
 * 
 * 3. Interaction:
 *    - Supports node selection
 *    - Provides search functionality
 *    - Maintains expanded/collapsed states
 */

import React from 'react';

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
  // const [searchTerm, setSearchTerm] = useState('');
  // const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Search functionality temporarily disabled
  // const debouncedSearch = useDebounce((term) => {
  //   // Filter nodes based on search term
  //   const filteredNodes = filterNodes(document, term);
  //   // Update the tree view with filtered nodes
  //   updateTreeView(filteredNodes);
  // }, 300);

  // const handleSearch = useCallback((event) => {
  //   const term = event.target.value;
  //   setSearchTerm(term);
  //   debouncedSearch(term);
  // }, [debouncedSearch]);

  if (!document) {
    return (
      <div className="mt-6 p-4 bg-white rounded shadow w-full max-w-2xl">
        <p className="text-gray-500">No document data available</p>
      </div>
    );
  }

  // Normalize the document structure
  const normalizedDocument = normalizeNode(document);

  const renderNodes = (node) => {
    if (!node || !node.children) return null;

    return (
      <ul className="ml-4 list-disc text-sm">
        {node.children.map((child) => (
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
            {renderNodes(child)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="mt-6 p-4 bg-white rounded shadow w-full max-w-2xl overflow-auto max-h-[500px]">
      <h2 className="text-xl font-semibold mb-2">📁 Figma File Tree</h2>
      
      {renderNodes(normalizedDocument)}
    </div>
  );
};

export default FigmaTreeViewer;
