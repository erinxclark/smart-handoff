import React, { useState, useRef } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import html2canvas from 'html2canvas';
import { compareVisuals } from '../services/compareVisuals';

const LiveCodePreview = ({ code, figmaPreviewUrl }) => {
  const [differences, setDifferences] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState(null);
  const livePreviewRef = useRef(null);

  const transformCode = (code) => {
    if (!code) return '';

    try {
      // Clean the code
      let cleanCode = code
        .replace(/export\s+default\s+/g, '')
        .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
        .trim();

      // Extract component name
      const componentMatch = cleanCode.match(/(?:const|function)\s+(\w+)\s*=/);
      const componentName = componentMatch ? componentMatch[1] : 'Component';

      // Remove the usage part if it exists
      cleanCode = cleanCode.split('// Usage')[0].trim();

      // Handle component order and positioning
      cleanCode = cleanCode.replace(/<div([^>]*)>/g, (match, attributes) => {
        // Check if this is a group or frame
        const isGroup = match.includes('data-group="true"');
        const isFrame = match.includes('data-frame="true"');
        
        // Add position relative and z-index to maintain proper stacking
        if (!attributes.includes('style=')) {
          return `<div${attributes} style={{ 
            position: 'relative', 
            zIndex: 1,
            ${isGroup ? "display: 'flex', flexDirection: 'column'," : ''}
            ${isFrame ? "display: 'flex', flexDirection: 'column', padding: '16px'," : ''}
          }}>`;
        }
        
        // If style exists, ensure it has position relative and proper layout
        return match.replace(/style=\{\{([^}]*)\}\}/, (styleMatch, styleContent) => {
          let newStyle = styleContent;
          if (!styleContent.includes('position:')) {
            newStyle += ", position: 'relative', zIndex: 1";
          }
          if (isGroup && !styleContent.includes('display:')) {
            newStyle += ", display: 'flex', flexDirection: 'column'";
          }
          if (isFrame && !styleContent.includes('display:')) {
            newStyle += ", display: 'flex', flexDirection: 'column', padding: '16px'";
          }
          return `style={{${newStyle}}}`;
        });
      });

      // Handle text elements to preserve font properties
      cleanCode = cleanCode.replace(/<span([^>]*)>/g, (match, attributes) => {
        if (!attributes.includes('style=')) {
          return match;
        }
        
        return match.replace(/style=\{\{([^}]*)\}\}/, (styleMatch, styleContent) => {
          let newStyle = styleContent;
          // Ensure font properties are preserved
          if (!styleContent.includes('fontFamily:')) {
            newStyle += ", fontFamily: 'inherit'";
          }
          if (!styleContent.includes('fontSize:')) {
            newStyle += ", fontSize: 'inherit'";
          }
          if (!styleContent.includes('fontWeight:')) {
            newStyle += ", fontWeight: 'inherit'";
          }
          if (!styleContent.includes('lineHeight:')) {
            newStyle += ", lineHeight: 'inherit'";
          }
          if (!styleContent.includes('letterSpacing:')) {
            newStyle += ", letterSpacing: 'inherit'";
          }
          return `style={{${newStyle}}}`;
        });
      });

      // Return the complete code with proper syntax
      return `
${cleanCode}

render(<${componentName} text="This is a test" />);
`;
    } catch (error) {
      console.error('Error transforming code:', error);
      return `
const ErrorComponent = () => {
  return (
    <div style={{ 
      width: '200px', 
      height: '100px', 
      backgroundColor: '#fee2e2', 
      border: '1px solid #ef4444',
      borderRadius: '4px',
      padding: '16px',
      color: '#ef4444',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      Error rendering component
    </div>
  );
};

render(<ErrorComponent />);
`;
    }
  };

  const handleCompare = async () => {
    if (!livePreviewRef.current) {
      console.error('Live preview ref is missing');
      setCompareError('Cannot generate preview. Please try refreshing the page.');
      return;
    }
    
    if (!figmaPreviewUrl) {
      console.error('Figma preview URL is missing');
      setCompareError('Cannot compare: Figma preview is missing. Please select a component from the Figma tree first.');
      return;
    }

    try {
      setIsComparing(true);
      setDifferences(null);
      setCompareError(null);
      
      console.log('Starting comparison with html2canvas...');
      
      const previewElement = livePreviewRef.current;
      
      // Ensure the element has content
      if (previewElement.offsetWidth === 0 || previewElement.offsetHeight === 0) {
        throw new Error('Preview element has no size. Check if component is rendering correctly.');
      }

      const canvas = await html2canvas(previewElement, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
      });

      const livePreviewUrl = canvas.toDataURL('image/png');
      console.log('Canvas generated successfully');
      
      const diff = await compareVisuals(livePreviewUrl, figmaPreviewUrl);
      setDifferences(diff);
    } catch (error) {
      console.error('Error comparing visuals:', error);
      setCompareError(`Error comparing visuals: ${error.message}`);
    } finally {
      setIsComparing(false);
    }
  };

  // Format value for display
  const formatValue = (value) => {
    if (value && value.startsWith('#')) {
      // It's a color
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span 
            style={{ 
              display: 'inline-block', 
              width: '12px', 
              height: '12px', 
              backgroundColor: value,
              border: '1px solid #e5e7eb',
              borderRadius: '2px'
            }} 
          />
          {value}
        </span>
      );
    }
    
    // Handle units
    if (typeof value === 'string' && (
      value.includes('px') || 
      value.includes('rem') || 
      value.includes('em') || 
      value.includes('%')
    )) {
      return <code style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '2px' }}>{value}</code>;
    }
    
    return value;
  };

  // Extracts specific values from description text
  const extractValues = (description) => {
    if (!description) return [];
    
    const values = [];
    
    // Extract color hex codes
    const hexColors = description.match(/#[0-9A-Fa-f]{3,8}/g) || [];
    hexColors.forEach(color => {
      values.push({ 
        label: 'Color', 
        value: color 
      });
    });
    
    // Extract pixel values
    const pixelValues = description.match(/\b\d+(\.\d+)?px\b/g) || [];
    pixelValues.forEach(px => {
      values.push({ 
        label: 'Size', 
        value: px 
      });
    });
    
    // Extract rem values
    const remValues = description.match(/\b\d+(\.\d+)?rem\b/g) || [];
    remValues.forEach(rem => {
      values.push({ 
        label: 'Size', 
        value: rem 
      });
    });
    
    // Extract font-weight
    const fontWeights = description.match(/\bfont-weight:\s*(\d+|normal|bold|lighter|bolder)\b/g) || [];
    fontWeights.forEach(weight => {
      const value = weight.split(':')[1].trim();
      values.push({ 
        label: 'Font Weight', 
        value 
      });
    });
    
    // Extract border-radius
    const borderRadius = description.match(/\bborder-radius:\s*[^;]+/g) || [];
    borderRadius.forEach(radius => {
      const value = radius.split(':')[1].trim();
      values.push({ 
        label: 'Border Radius', 
        value 
      });
    });
    
    return values;
  };

  return (
    <div className="mt-6 p-4 bg-white rounded shadow w-full">
      <h2 className="text-xl font-semibold mb-4">Preview Comparison</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {/* React Preview */}
        <div className="border rounded p-4">
          <h3 className="text-lg font-semibold mb-2">React Preview</h3>
          <div ref={livePreviewRef} className="mt-2">
            {code ? (
              <LiveProvider 
                code={transformCode(code)}
                noInline={true}
                scope={{ React }}
              >
                <div className="relative">
                  <LiveError className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 p-2 text-sm" />
                  <LivePreview className="mt-8" />
                </div>
              </LiveProvider>
            ) : (
              <div className="text-gray-500">No code to preview</div>
            )}
          </div>
        </div>

        {/* Figma Preview */}
        {figmaPreviewUrl && (
          <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Figma Preview</h3>
            <div className="mt-2">
              <img 
                src={figmaPreviewUrl} 
                alt="Figma Preview" 
                className="w-full border rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* Comparison Controls */}
      {figmaPreviewUrl && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleCompare}
            disabled={isComparing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isComparing ? 'Comparing...' : 'Compare Visuals'}
          </button>
        </div>
      )}

      {compareError && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {compareError}
        </div>
      )}

      {differences && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Visual Differences</h3>
          <div className="space-y-4">
            {differences.map((diff, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded">
                <h4 className="font-medium">{diff.title}</h4>
                <p className="text-gray-600">{diff.description}</p>
                {diff.values && (
                  <div className="mt-2 space-y-2">
                    {diff.values.map((value, valueIndex) => (
                      <div key={valueIndex} className="flex items-center gap-2">
                        <span className="font-medium">{value.label}:</span>
                        <span>{formatValue(value.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCodePreview; 