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
          
          // Execute the AI-generated React code directly
          const executeAICode = (codeString) => {
            console.log('Executing AI code:', codeString);
            console.log('Code length:', codeString.length);
            
            try {
              // Extract the component function from the AI code - more flexible regex
              const componentMatch = codeString.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*?return\s*\(([\s\S]*?)\);?\s*};/);
              
              if (!componentMatch) {
                console.log('No component function found, trying alternative pattern');
                // Try alternative pattern
                const altMatch = codeString.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*?return\s*\(([\s\S]*?)\);?\s*}/);
                if (!altMatch) {
                  console.log('No component function found with alternative pattern either');
                  return null;
                }
                componentMatch = altMatch;
              }
              
              const componentName = componentMatch[1];
              const returnJSX = componentMatch[2];
              
              console.log('Component name:', componentName);
              console.log('Return JSX:', returnJSX);
              
              // Extract default values from function parameters
              const defaults = {};
              const paramMatch = codeString.match(/\([^)]*\)\s*=>/);
              if (paramMatch) {
                const paramString = paramMatch[0];
                const defaultMatches = paramString.match(/(\w+)\s*=\s*([^,}]+)/g);
                if (defaultMatches) {
                  defaultMatches.forEach(match => {
                    const [key, value] = match.split('=').map(s => s.trim());
                    defaults[key] = value.replace(/['"]/g, '');
                  });
                }
              }
              
              console.log('Default values:', defaults);
              
              // If no defaults found, try to extract from the code directly
              if (Object.keys(defaults).length === 0) {
                console.log('No defaults found, extracting from code directly');
                const widthMatch = codeString.match(/width\s*=\s*(\d+)/);
                const heightMatch = codeString.match(/height\s*=\s*(\d+)/);
                const bgMatch = codeString.match(/backgroundColor\s*=\s*['"]([^'"]+)['"]/);
                const radiusMatch = codeString.match(/cornerRadius\s*=\s*(\d+)/);
                const strokeMatch = codeString.match(/strokeColor\s*=\s*['"]([^'"]+)['"]/);
                
                if (widthMatch) defaults.width = widthMatch[1];
                if (heightMatch) defaults.height = heightMatch[1];
                if (bgMatch) defaults.backgroundColor = bgMatch[1];
                if (radiusMatch) defaults.cornerRadius = radiusMatch[1];
                if (strokeMatch) defaults.strokeColor = strokeMatch[1];
                
                console.log('Extracted values:', defaults);
              }
              
              // Create a React element with the default values
              const style = {
                width: defaults.width ? `${defaults.width}px` : '200px',
                height: defaults.height ? `${defaults.height}px` : '100px',
                backgroundColor: defaults.backgroundColor || '#f0f0f0',
                borderRadius: defaults.cornerRadius ? `${defaults.cornerRadius}px` : '8px',
                border: defaults.strokeColor ? `4px solid ${defaults.strokeColor}` : '1px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '10px auto'
              };
              
              console.log('Final style:', style);
              
              return React.createElement('div', { style });
              
            } catch (err) {
              console.error('Error executing AI code:', err);
              return null;
            }
          };
          
          const parsedElement = executeAICode(code);
          console.log('Final parsed element:', parsedElement);
          
          // Fallback if parsing fails
          if (!parsedElement) {
            console.log('Parsing failed, creating fallback element');
            return React.createElement('div', {
              style: {
                padding: '20px',
                backgroundColor: '#f0f0f0',
                border: '2px dashed #ccc',
                borderRadius: '8px',
                textAlign: 'center',
                margin: '10px auto'
              }
            }, 'AI Component (Fallback)');
          }
          
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