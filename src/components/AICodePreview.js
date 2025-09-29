import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import { inlineStylesToTailwind } from '../utils/styleConverter';

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
  const [useTailwind, setUseTailwind] = useState(false);
  const [tailwindCode, setTailwindCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      const codeToCopy = useTailwind ? tailwindCode : originalCode;
      await navigator.clipboard.writeText(codeToCopy);
      setCopySuccess(true);
      setShowToast(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowToast(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Download as JSX function
  const downloadAsJSX = () => {
    const codeToDownload = useTailwind ? tailwindCode : originalCode;
    const blob = new Blob([codeToDownload], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${componentName}.jsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to convert inline styles to Tailwind classes in JSX
  const convertJSXStylesToTailwind = (jsxCode) => {
    if (!jsxCode || typeof jsxCode !== 'string') return jsxCode;

    // Find all style objects in JSX and convert them
    return jsxCode.replace(/style=\{\{([^}]+)\}\}/g, (match, styleContent) => {
      try {
        // Parse the style object content
        const styleObject = {};
        const stylePairs = styleContent.split(',');
        
        stylePairs.forEach(pair => {
          const [key, ...valueParts] = pair.split(':');
          if (key && valueParts.length > 0) {
            const cleanKey = key.trim();
            const cleanValue = valueParts.join(':').trim().replace(/['"]/g, '');
            styleObject[cleanKey] = cleanValue;
          }
        });

        // Convert to Tailwind
        const { className, remainingStyles } = inlineStylesToTailwind(styleObject);
        
        // If we have Tailwind classes and no remaining styles, use className
        if (className && Object.keys(remainingStyles).length === 0) {
          return `className="${className}"`;
        }
        
        // If we have some Tailwind classes but also remaining styles, combine both
        if (className && Object.keys(remainingStyles).length > 0) {
          const remainingStyleString = Object.entries(remainingStyles)
            .map(([key, value]) => `${key}: '${value}'`)
            .join(', ');
          return `className="${className}" style={{${remainingStyleString}}}`;
        }
        
        // If no Tailwind conversion possible, keep original
        return match;
      } catch (error) {
        console.warn('Error converting styles to Tailwind:', error);
        return match;
      }
    });
  };

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
      setTailwindCode('');
      setOriginalCode('');
      setError(null);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const preparedCode = prepareCodeForReactLive(code);
      
      if (preparedCode && preparedCode.trim() !== '') {
        // Store original prepared code
        setOriginalCode(preparedCode);
        
        // Convert to Tailwind version
        const tailwindVersion = convertJSXStylesToTailwind(preparedCode);
        setTailwindCode(tailwindVersion);
        
        // Set the appropriate version based on toggle
        setProcessedCode(useTailwind ? tailwindVersion : preparedCode);
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
        setOriginalCode(fallbackJSX);
        setTailwindCode(convertJSXStylesToTailwind(fallbackJSX));
        setError('No valid React component found, showing fallback');
      }
    } catch (err) {
      console.error('Error preparing code:', err);
      setError(`Error preparing code: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [code, useTailwind]);

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
    <div className={`space-y-6 ${className}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Code copied to clipboard!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Display */}
      {showCode && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
          {/* Code Header */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Generated Code</h3>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Style Format Toggle */}
                <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUseTailwind(false)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      !useTailwind 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Inline
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUseTailwind(true)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      useTailwind 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Tailwind
                  </motion.button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyToClipboard}
                    className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    title="Copy to clipboard"
                  >
                    {copySuccess ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadAsJSX}
                    className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    title="Download as JSX"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Code Content */}
          <div className="relative">
            <pre className="p-6 bg-slate-900 text-slate-100 text-sm overflow-auto max-h-96 font-mono leading-relaxed">
              <code className="language-jsx">{useTailwind ? tailwindCode : originalCode || code}</code>
            </pre>
            
            {/* Line Numbers */}
            <div className="absolute top-6 left-2 text-slate-500 text-xs font-mono select-none">
              {((useTailwind ? tailwindCode : originalCode || code) || '').split('\n').map((_, i) => (
                <div key={i} className="h-5 flex items-center">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Preview */}
      {showPreview && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
          {/* Preview Header */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Live Preview</h3>
              </div>
              
              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-medium">Processing...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="p-6 bg-gradient-to-br from-slate-50 to-white min-h-[300px]">
            {error ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700"
              >
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="font-semibold">Preview Error</div>
                </div>
                <div className="text-sm font-mono bg-red-100 p-3 rounded-lg">{error}</div>
              </motion.div>
            ) : processedCode ? (
              <LiveProvider
                code={processedCode}
                noInline={false}
                scope={{ React }}
              >
                <div className="relative">
                  <LiveError 
                    className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 p-4 text-sm rounded-xl z-10 border border-red-300"
                    onError={(error) => {
                      console.error('React Live error:', error);
                      setError(`React Live error: ${error.message}`);
                    }}
                  />
                  <div className="min-h-[200px] flex items-center justify-center p-8 bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <LivePreview className="w-full" />
                  </div>
                </div>
              </LiveProvider>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-64 text-slate-500"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-lg font-medium mb-2">Preparing Preview...</div>
                  <div className="text-sm">Processing AI-generated code</div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AICodePreview;
