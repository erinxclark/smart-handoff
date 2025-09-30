import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LiveProvider, LiveError, LivePreview } from 'react-live';

/**
 * LivePreviewOnly Component
 * 
 * Shows only the live preview without any headers or UI elements.
 * Used in the React Preview section of the Live Preview area.
 */
const LivePreviewOnly = ({ code, componentName = 'Component' }) => {
  const [processedCode, setProcessedCode] = useState('');
  const [error, setError] = useState(null);

  // Function to clean and prepare AI-generated code for React Live
  const prepareCodeForReactLive = (rawCode) => {
    if (!rawCode || rawCode.trim() === '') return '';
    
    let cleaned = rawCode;
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```jsx\n?/g, '').replace(/```\n?/g, '');
    
    // Remove import/export statements
    cleaned = cleaned.replace(/import\s+.*?from\s+['"][^'"]*['"];?\n?/g, '');
    cleaned = cleaned.replace(/export\s+.*?;?\n?/g, '');
    
    // Remove single-line comments
    cleaned = cleaned.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove JSX comments
    cleaned = cleaned.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    
    // Remove empty lines and clean up whitespace
    cleaned = cleaned.replace(/^\s*\n/gm, '').trim();
    
    // Remove empty JSX expressions
    cleaned = cleaned.replace(/\{\s*\}/g, '');
    
    // Remove trailing commas in objects
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // Extract only the JSX from the return statement for React Live
    const jsxMatch = cleaned.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*}/);
    if (jsxMatch) {
      const jsxContent = jsxMatch[1].trim();
      return jsxContent;
    }
    
    // Fallback: if no return statement found, return the cleaned code
    return cleaned.trim();
  };

  // Process code when it changes
  useEffect(() => {
    if (!code || code.trim() === '') {
      setProcessedCode('');
      setError(null);
      return;
    }

    setError(null);

    try {
      const preparedCode = prepareCodeForReactLive(code);
      
      if (preparedCode && preparedCode.trim() !== '') {
        setProcessedCode(preparedCode);
        setError(null);
      } else {
        // Create a simple fallback JSX
        const fallbackJSX = `<div style={{
          width: '200px',
          height: '100px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          ${componentName}
        </div>`;
        setProcessedCode(fallbackJSX);
        setError('No valid React component found, showing fallback');
      }
    } catch (err) {
      console.error('Error preparing code:', err);
      setError(`Error preparing code: ${err.message}`);
    }
  }, [code, componentName]);

  // Show placeholder when no code is available
  if (!code || code.trim() === '') {
    return (
      <div className="min-h-[200px] border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center w-full">
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-sm font-medium">No code to preview</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700"
        >
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm font-medium">Preview Error</div>
          </div>
          <div className="text-xs font-mono bg-red-100 p-2 rounded">{error}</div>
        </motion.div>
      ) : processedCode ? (
        <LiveProvider
          code={processedCode}
          noInline={false}
          scope={{ React }}
        >
          <div className="relative">
            <LiveError 
              className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 p-2 text-xs rounded z-10 border border-red-300"
              onError={(error) => {
                console.error('React Live error:', error);
                setError(`React Live error: ${error.message}`);
              }}
            />
            <div className="min-h-[200px] flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200">
              <LivePreview className="w-full" />
            </div>
          </div>
        </LiveProvider>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-48 text-gray-500"
        >
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-sm font-medium">Preparing Preview...</div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LivePreviewOnly;
