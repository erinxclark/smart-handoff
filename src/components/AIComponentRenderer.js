import React, { useState, useMemo } from 'react';

const AIComponentRenderer = ({ code, componentName = 'Component' }) => {
  const [error, setError] = useState(null);

  // Simple, reliable AI component renderer
  const renderAIComponent = useMemo(() => {
    if (!code) {
      return null;
    }

    try {
      setError(null);
      
      // Extract the JSX return statement from the AI code
      const jsxMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*$/m);
      
      if (jsxMatch) {
        let extractedJSX = jsxMatch[1].trim();
        console.log('Extracted JSX:', extractedJSX);
        
        // Clean up the JSX - remove comments
        extractedJSX = extractedJSX
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, '')
          .trim();
        
        // Convert the AI-generated JSX to HTML and render it
        console.log('Raw extracted JSX:', extractedJSX);
        
        try {
          // Complex JSX parsing to properly render AI-generated components
          console.log('Raw extracted JSX:', extractedJSX);
          
          // Parse the actual JSX structure from AI-generated code
          const parseJSXElement = (jsxString) => {
            console.log('Parsing JSX element:', jsxString);
            
            // Find the first complete div element with its closing tag
            const divMatch = jsxString.match(/<div[^>]*style=\{\{([^}]+)\}\}[^>]*>([^<]*)<\/div>/);
            if (!divMatch) {
              console.log('No complete div found, trying to find any div');
              // Fallback: find any div element
              const anyDivMatch = jsxString.match(/<div[^>]*style=\{\{([^}]+)\}\}[^>]*>/);
              if (!anyDivMatch) {
                console.log('No div found at all');
                return null;
              }
              
              const styleContent = anyDivMatch[1];
              console.log('Style content (fallback):', styleContent);
              
              // Parse style properties
              const styleObj = {};
              const properties = styleContent.split(',').map(prop => prop.trim());
              
              properties.forEach(prop => {
                const colonIndex = prop.indexOf(':');
                if (colonIndex > 0) {
                  const key = prop.substring(0, colonIndex).trim();
                  const value = prop.substring(colonIndex + 1).trim();
                  
                  const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                  const cleanValue = value.replace(/['"`]/g, '').trim();
                  
                  if (camelKey && cleanValue) {
                    styleObj[camelKey] = cleanValue;
                  }
                }
              });
              
              console.log('Parsed style object (fallback):', styleObj);
              
              return React.createElement('div', {
                style: {
                  ...styleObj,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '10px auto'
                }
              });
            }
            
            const styleContent = divMatch[1];
            const textContent = divMatch[2].trim();
            
            console.log('Style content:', styleContent);
            console.log('Text content:', textContent);
            
            // Parse style properties into a React style object
            const styleObj = {};
            const properties = styleContent.split(',').map(prop => prop.trim());
            
            properties.forEach(prop => {
              const colonIndex = prop.indexOf(':');
              if (colonIndex > 0) {
                const key = prop.substring(0, colonIndex).trim();
                const value = prop.substring(colonIndex + 1).trim();
                
                // Convert CSS property names to camelCase
                const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                // Remove quotes and clean up the value
                const cleanValue = value.replace(/['"`]/g, '').trim();
                
                if (camelKey && cleanValue) {
                  styleObj[camelKey] = cleanValue;
                }
              }
            });
            
            console.log('Parsed style object:', styleObj);
            
            // Create the actual React element with real AI-generated properties
            const element = React.createElement('div', {
              style: {
                ...styleObj,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '10px auto'
              }
            }, textContent);
            
            console.log('Created React element with AI properties:', element);
            return element;
          };
          
          const parsedElement = parseJSXElement(extractedJSX);
          console.log('Final parsed element:', parsedElement);
          
          return parsedElement;
          
        } catch (err) {
          console.error('Error rendering AI component:', err);
          return (
            <div style={{
              padding: '20px',
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '4px',
              color: '#ef4444',
              textAlign: 'center'
            }}>
              <h3>AI Code Rendering Error</h3>
              <p>{err.message}</p>
            </div>
          );
        }
      } else {
        throw new Error('Could not extract JSX from AI-generated code');
      }
      
    } catch (err) {
      console.error('Error processing AI code:', err);
      setError(err.message);
      
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '4px',
          color: '#ef4444',
          textAlign: 'center'
        }}>
          <h3>AI Code Processing Error</h3>
          <p>{err.message}</p>
        </div>
      );
    }
  }, [code]);

  return (
    <div className="relative">
      {error && (
        <div className="mb-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-700 text-sm">
          <strong>AI Processing:</strong> {error}
        </div>
      )}

      <div className="mb-2 text-xs text-gray-500">
        🤖 AI-Generated Component from Figma Design
      </div>

      {/* Render the AI component directly */}
      {code ? (
        <div className="min-h-[100px] border border-gray-200 rounded p-4 bg-white">
          {renderAIComponent || (
            <div className="flex items-center justify-center h-24 text-gray-500">
              <div className="text-center">
                <div className="text-sm mb-2">🤖 AI Component Preview</div>
                <div className="text-xs">Processing AI-generated component...</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-[100px] border border-gray-200 rounded p-4 bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-sm mb-2">🤖 AI Component Preview</div>
            <div className="text-xs">Click "Generate Spec + Code" to see AI-generated React component</div>
          </div>
        </div>
      )}

      {/* Show the AI-generated code for reference */}
      {code && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-semibold mb-2 text-blue-800">🤖 AI-Generated Code from Figma:</div>
          <pre className="whitespace-pre-wrap text-blue-700 overflow-auto max-h-32">
            {code.length > 800 ? code.substring(0, 800) + '...' : code}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AIComponentRenderer;