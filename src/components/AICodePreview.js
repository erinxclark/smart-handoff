import React, { useState, useEffect } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';

/**
 * AICodePreview Component
 * 
 * A production-ready component for rendering AI-generated React/JSX code.
 * Handles JSX transformation, error boundaries, and live preview updates.
 */
const AICodePreview = ({ 
  code, 
  componentName = 'Component',
  showCode = true,
  showPreview = true,
  className = ''
}) => {
  const [processedCode, setProcessedCode] = useState('');
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Function to clean and prepare AI-generated code for React Live
  const prepareCodeForReactLive = (rawCode) => {
    if (!rawCode || rawCode.trim() === '') return '';

    let cleaned = rawCode.trim();

    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/```(?:jsx|javascript|js)?\s*\n?/g, '');
    cleaned = cleaned.replace(/```\s*$/g, '');
    
    // Remove import statements (React Live doesn't need them)
    cleaned = cleaned.replace(/import\s+.*?from\s+['"][^'"]+['"];?\s*/g, '');
    cleaned = cleaned.replace(/import\s+{.*?}\s+from\s+['"][^'"]+['"];?\s*/g, '');
    
    // Remove export statements (React Live handles this internally)
    cleaned = cleaned.replace(/export\s+default\s+.*?;?\s*/g, '');
    cleaned = cleaned.replace(/export\s+{.*?};?\s*/g, '');
    
    // Remove comments that break JSX parsing
    cleaned = cleaned.replace(/\/\/.*$/gm, ''); // Remove single-line comments
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    cleaned = cleaned.replace(/\{\/\*[\s\S]*?\*\/\}/g, ''); // Remove JSX comments {/* */}
    
    // Clean up extra whitespace left after removing comments
    cleaned = cleaned.replace(/\n\s*\n/g, '\n'); // Remove empty lines
    cleaned = cleaned.replace(/^\s+|\s+$/g, ''); // Trim start and end
    
    // Remove any remaining empty JSX expressions
    cleaned = cleaned.replace(/\{\s*\}/g, ''); // Remove empty {}
    
    // Remove trailing commas in objects and arrays
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
    
    // Remove any explanatory text before the component
    const componentMatch = cleaned.match(/(const|function)\s+\w+\s*[=(]/);
    if (componentMatch) {
      cleaned = cleaned.substring(componentMatch.index);
    }
    
    // Extract only the JSX from the return statement for React Live
    const jsxMatch = cleaned.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*}/);
    if (jsxMatch) {
      const jsxContent = jsxMatch[1].trim();
      console.log('Extracted JSX for React Live:', jsxContent);
      return jsxContent;
    }
    
    // Fallback: if no return statement found, return the cleaned code
    console.log('No return statement found, using cleaned code:', cleaned);
    return cleaned.trim();
  };

  // Process code when it changes
  useEffect(() => {
    if (!code || code.trim() === '') {
      setProcessedCode('');
      setError(null);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
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
    } finally {
      setIsProcessing(false);
    }
  }, [code]);

  // Show placeholder when no code is available
  if (!code || code.trim() === '') {
    return (
      <div className={`min-h-[200px] border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-sm mb-2">🎨 AI Code Preview</div>
          <div className="text-xs">Generate code from Figma to see the live preview</div>
        </div>
      </div>
    );
  }

  // Don't render LiveProvider if we don't have processed code yet
  if (!processedCode || processedCode.trim() === '') {
    return (
      <div className={`min-h-[200px] border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-sm mb-2">⏳ Processing Code...</div>
          <div className="text-xs">Preparing code for live preview</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Code Display */}
      {showCode && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 border-b">
            Generated Code
          </div>
          <pre className="p-4 bg-gray-900 text-gray-100 text-sm overflow-auto max-h-64">
            <code>{code}</code>
          </pre>
        </div>
      )}

      {/* Live Preview */}
      {showPreview && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 border-b flex items-center justify-between">
            <span>Live Preview</span>
            {isProcessing && (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Processing...
              </div>
            )}
          </div>
          
          <div className="p-4 bg-white min-h-[200px]">
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                <div className="font-medium mb-2">Preview Error</div>
                <div className="text-sm">{error}</div>
              </div>
            ) : processedCode ? (
              <LiveProvider
                code={processedCode}
                noInline={false}
                scope={{ React }}
              >
                <div className="relative">
                  <LiveError 
                    className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 p-2 text-sm rounded z-10 border border-red-300"
                    onError={(error) => {
                      console.error('React Live error:', error);
                      setError(`React Live error: ${error.message}`);
                    }}
                  />
                  <LivePreview className="min-h-[150px] flex items-center justify-center" />
                </div>
              </LiveProvider>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <div className="text-sm mb-2">⏳ Preparing Preview...</div>
                  <div className="text-xs">Processing AI-generated code</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && processedCode && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">Debug: Processed Code</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
            {processedCode}
          </pre>
        </details>
      )}
    </div>
  );
};

export default AICodePreview;
