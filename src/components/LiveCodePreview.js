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

    console.log('Original code:', code);
    
    try {
      // Extract the component code
      const componentCode = code.trim();
      
      // Remove export default and import statements
      let cleanCode = componentCode
        .replace(/export\s+default\s+/g, '')
        .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
        .replace(/;\s*$/, '')
        .trim();
      
      console.log('Cleaned code:', cleanCode);
      
      // Debug check for React component pattern
      const hasJSXReturn = cleanCode.includes('return (') || cleanCode.includes('return(');
      if (!hasJSXReturn) {
        console.warn('WARNING: Component may not have a proper JSX return statement');
      }
      
      // Fix undefined variables in template literals (common in AI-generated code)
      // Look for patterns like ${width} and provide default values
      cleanCode = cleanCode
        .replace(/\$\{width\}/g, '200')
        .replace(/\$\{height\}/g, '200')
        .replace(/\$\{([\w]+)\}/g, (match, varName) => {
          console.log(`Found undefined variable in template literal: ${varName}, providing default value`);
          // Provide default values for common properties
          const defaults = {
            width: '200',
            height: '200',
            borderRadius: '8',
            padding: '16',
            margin: '8',
            fontSize: '16',
            color: '#333333',
            backgroundColor: '#ffffff',
            borderWidth: '1',
            borderStyle: 'solid',
            borderColor: '#000000'
          };
          return defaults[varName] || '0';
        });
      
      // Extract the component name - handle both function and const declaration patterns
      let componentName = 'Component';
      const constMatch = cleanCode.match(/const\s+([A-Za-z0-9_]+)\s*=/);
      const functionMatch = cleanCode.match(/function\s+([A-Za-z0-9_]+)\s*\(/);
      
      if (constMatch) {
        componentName = constMatch[1];
        console.log(`Found component as const: ${componentName}`);
      } else if (functionMatch) {
        componentName = functionMatch[1];
        console.log(`Found component as function: ${componentName}`);
      } else {
        // Default fallback
        console.warn('Could not extract component name, using default:', componentName);
        
        // Try to create a minimal component if we couldn't find one
        if (!cleanCode.includes('return') || !cleanCode.includes('(')) {
          console.warn('Code does not appear to be a valid React component, creating a minimal wrapper');
          cleanCode = `const Component = () => {
  return (
    <div style={{ width: '200px', height: '200px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', padding: '16px' }}>
      ${cleanCode.includes('<') ? cleanCode : `<div>${cleanCode || 'No valid JSX found'}</div>`}
    </div>
  );
};`;
          componentName = 'Component';
        }
      }
      
      console.log('Extracted component name:', componentName);
      
      // Return the component code with a render call
      return `${cleanCode}\n\nrender(<${componentName} />)`;
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

render(<ErrorComponent />)`;
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
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: '#4f46e5',
            color: 'white',
            borderRadius: '4px',
            border: 'none',
            cursor: isComparing ? 'not-allowed' : 'pointer',
            opacity: isComparing ? 0.7 : 1,
          }}
          onClick={handleCompare}
          disabled={isComparing}
        >
          {isComparing ? 'Analyzing...' : 'Compare Visuals with AI'}
        </button>
      </div>

      {compareError && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          borderRadius: '4px',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          {compareError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Figma Preview */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            padding: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Figma Design
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            {figmaPreviewUrl ? (
              <img 
                src={figmaPreviewUrl} 
                alt="Figma Design" 
                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
              />
            ) : (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af'
              }}>
                No Figma preview available
              </div>
            )}
          </div>
        </div>

        {/* React Preview */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            padding: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              React Rendering
            </div>
          </div>
          <div style={{ padding: '16px', position: 'relative' }}>
            <div ref={livePreviewRef} style={{ 
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'visible',
              border: '1px solid #e5e7eb',
              minHeight: '200px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {code ? (
                <LiveProvider 
                  code={transformCode(code)} 
                  noInline={true}
                  scope={{ 
                    React, 
                    Fragment: React.Fragment,
                    useState: React.useState,
                    useEffect: React.useEffect,
                    useRef: React.useRef,
                    useCallback: React.useCallback,
                    useMemo: React.useMemo,
                    useContext: React.useContext,
                    createContext: React.createContext
                  }}
                >
                  <div style={{ 
                    color: '#ef4444', 
                    marginBottom: '8px', 
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#fee2e2',
                    width: '100%'
                  }}>
                    <LiveError />
                  </div>
                  <LivePreview />
                </LiveProvider>
              ) : (
                <div style={{ color: '#9ca3af' }}>No code to preview</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isComparing && (
        <div style={{ 
          marginTop: '24px',
          textAlign: 'center', 
          padding: '32px',
          backgroundColor: 'white',
          borderRadius: '8px', 
          color: '#6b7280'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          Analyzing visual differences...
        </div>
      )}

      {differences && (
        <div style={{ 
          marginTop: '24px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            padding: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              AI-Detected Visual Differences
            </div>
            <div style={{ 
              marginTop: '8px', 
              display: 'flex', 
              gap: '8px',
              fontSize: '12px'
            }}>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                color: '#ef4444' 
              }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#ef4444' 
                }}></span>
                High Priority
              </span>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                color: '#f59e0b' 
              }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#f59e0b' 
                }}></span>
                Medium Priority
              </span>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                color: '#3b82f6' 
              }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#3b82f6' 
                }}></span>
                Low Priority
              </span>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            {/* Group differences by category */}
            {differences.length > 0 ? (
              <>
                {/* High priority differences */}
                {differences.filter(diff => diff.priority === 'high').length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444', marginBottom: '12px' }}>
                      Critical Differences
                    </h3>
                    {differences.filter(diff => diff.priority === 'high').map((diff, index) => {
                      const extractedValues = extractValues(diff.description);
                      
                      return (
                        <div key={`high-${index}`} style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '16px',
                          marginBottom: '12px',
                          borderLeft: '3px solid #ef4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.05)',
                          borderRadius: '0 4px 4px 0'
                        }}>
                          <div style={{ 
                            fontWeight: '600',
                            color: '#1f2937',
                            fontSize: '15px'
                          }}>{diff.title}</div>
                          
                          <div style={{ 
                            color: '#6b7280',
                            fontSize: '14px',
                            marginTop: '8px',
                            lineHeight: '1.5'
                          }}>{diff.description}</div>
                          
                          {extractedValues.length > 0 && (
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px',
                              marginTop: '12px'
                            }}>
                              {extractedValues.map((item, valueIndex) => (
                                <div key={valueIndex} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 8px',
                                  backgroundColor: '#f9fafb',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}>
                                  <span style={{ color: '#4b5563', fontWeight: '500' }}>{item.label}:</span>
                                  <span>{formatValue(item.value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Medium priority differences */}
                {differences.filter(diff => diff.priority === 'medium').length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b', marginBottom: '12px' }}>
                      Important Differences
                    </h3>
                    {differences.filter(diff => diff.priority === 'medium').map((diff, index) => {
                      const extractedValues = extractValues(diff.description);
                      
                      return (
                        <div key={`medium-${index}`} style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '16px',
                          marginBottom: '12px',
                          borderLeft: '3px solid #f59e0b',
                          backgroundColor: 'rgba(245, 158, 11, 0.05)',
                          borderRadius: '0 4px 4px 0'
                        }}>
                          <div style={{ 
                            fontWeight: '600',
                            color: '#1f2937',
                            fontSize: '15px'
                          }}>{diff.title}</div>
                          
                          <div style={{ 
                            color: '#6b7280',
                            fontSize: '14px',
                            marginTop: '8px',
                            lineHeight: '1.5'
                          }}>{diff.description}</div>
                          
                          {extractedValues.length > 0 && (
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px',
                              marginTop: '12px'
                            }}>
                              {extractedValues.map((item, valueIndex) => (
                                <div key={valueIndex} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 8px',
                                  backgroundColor: '#f9fafb',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}>
                                  <span style={{ color: '#4b5563', fontWeight: '500' }}>{item.label}:</span>
                                  <span>{formatValue(item.value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Low priority differences */}
                {differences.filter(diff => diff.priority === 'low').length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6', marginBottom: '12px' }}>
                      Minor Differences
                    </h3>
                    {differences.filter(diff => diff.priority === 'low').map((diff, index) => {
                      const extractedValues = extractValues(diff.description);
                      
                      return (
                        <div key={`low-${index}`} style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '16px',
                          marginBottom: '12px',
                          borderLeft: '3px solid #3b82f6',
                          backgroundColor: 'rgba(59, 130, 246, 0.05)',
                          borderRadius: '0 4px 4px 0'
                        }}>
                          <div style={{ 
                            fontWeight: '600',
                            color: '#1f2937',
                            fontSize: '15px'
                          }}>{diff.title}</div>
                          
                          <div style={{ 
                            color: '#6b7280',
                            fontSize: '14px',
                            marginTop: '8px',
                            lineHeight: '1.5'
                          }}>{diff.description}</div>
                          
                          {extractedValues.length > 0 && (
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px',
                              marginTop: '12px'
                            }}>
                              {extractedValues.map((item, valueIndex) => (
                                <div key={valueIndex} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 8px',
                                  backgroundColor: '#f9fafb',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}>
                                  <span style={{ color: '#4b5563', fontWeight: '500' }}>{item.label}:</span>
                                  <span>{formatValue(item.value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div style={{ 
                padding: '24px', 
                textAlign: 'center', 
                color: '#6b7280' 
              }}>
                No significant differences detected
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCodePreview; 