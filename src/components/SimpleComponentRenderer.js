/**
 * Simple Component Renderer
 * 
 * A lightweight, reliable component renderer that handles basic JSX
 * without complex AI transformations or infinite loops.
 */

import React, { useState, useEffect } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';

const SimpleComponentRenderer = ({ code, componentName = 'Component' }) => {
  const [processedCode, setProcessedCode] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) {
      setProcessedCode('');
      setError(null);
      return;
    }

    try {
      // Simple, reliable transformation
      const transformed = transformCodeSimple(code, componentName);
      setProcessedCode(transformed);
      setError(null);
    } catch (err) {
      console.error('Error processing code:', err);
      setError(err.message);
      setProcessedCode(createErrorComponent(componentName, err.message));
    }
  }, [code, componentName]);

  return (
    <div className="relative">
      {error && (
        <div className="mb-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-700 text-sm">
          <strong>Warning:</strong> {error}
        </div>
      )}
      
      <LiveProvider
        code={processedCode}
        noInline={false}
        scope={{ React }}
      >
        <div className="relative">
          <LiveError className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 p-2 text-sm rounded z-10" />
          <LivePreview className="min-h-[100px] border border-gray-200 rounded p-4 bg-white" />
        </div>
      </LiveProvider>
    </div>
  );
};

/**
 * Simple, reliable code transformation
 */
const transformCodeSimple = (code, componentName) => {
  // Extract JSX content from the component
  const jsxMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*}/);
  
  if (!jsxMatch) {
    throw new Error('Could not extract JSX return statement');
  }

  let jsxContent = jsxMatch[1].trim();
  
  // Basic cleanup
  jsxContent = jsxContent
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .trim();

  // Fix common issues
  jsxContent = fixCommonJSXIssues(jsxContent);

  // Create a complete component
  const completeComponent = `
const ${componentName} = () => {
  return (
    ${jsxContent}
  );
};

${componentName}`;

  return completeComponent;
};

/**
 * Fix common JSX issues without AI
 */
const fixCommonJSXIssues = (jsxContent) => {
  // Fix incomplete border styles
  jsxContent = jsxContent.replace(/border:\s*'([^']*),/g, "border: '1px solid #000000',");
  
  // Fix incomplete template literals
  jsxContent = jsxContent.replace(/\$\{([^}]+)\}/g, (match, variable) => {
    const trimmed = variable.trim();
    const defaults = {
      'text': 'Sample Text',
      'width': '200',
      'height': '100',
      'backgroundColor': '#f0f0f0',
      'borderColor': '#000000',
      'borderWidth': '1'
    };
    return defaults[trimmed] || 'default';
  });

  // Fix JSX expressions
  jsxContent = jsxContent.replace(/\{([^}]+)\}/g, (match, expression) => {
    const trimmed = expression.trim();
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed)) {
      // Simple variable reference - provide default
      const defaults = {
        'text': 'Sample Text',
        'width': '200px',
        'height': '100px',
        'backgroundColor': '#f0f0f0',
        'borderColor': '#000000'
      };
      return defaults[trimmed] || 'default';
    }
    return match;
  });

  // Ensure proper layout for containers
  jsxContent = jsxContent.replace(
    /backgroundColor:\s*'([^']+)',\s*\n\s*\}>/g,
    (match, color) => {
      return `backgroundColor: '${color}',\n      display: 'flex',\n      alignItems: 'center',\n      justifyContent: 'center',\n      minHeight: '100px'\n    }>`;
    }
  );

  return jsxContent;
};

/**
 * Create error component
 */
const createErrorComponent = (componentName, errorMessage) => {
  return `
const ${componentName} = () => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#fee2e2',
      border: '1px solid #ef4444',
      borderRadius: '4px',
      color: '#ef4444',
      textAlign: 'center',
      minHeight: '100px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Render Error</h3>
      <p style={{ margin: 0, fontSize: '14px' }}>{errorMessage}</p>
    </div>
  );
};

${componentName}`;
};

export default SimpleComponentRenderer;
