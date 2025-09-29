/**
 * LiveCodePreview Component
 * 
 * This component handles the live preview of React components generated from Figma designs.
 * It includes functionality for:
 * - Transforming Figma-generated code into renderable React components
 * - Preserving Figma styling properties (fonts, colors, layouts)
 * - Handling groups and frames with proper positioning
 * - Comparing the React preview with the original Figma design
 * 
 * Key Features:
 * 1. Code Transformation:
 *    - Cleans and processes Figma-generated code
 *    - Preserves all styling properties
 *    - Handles component hierarchy and positioning
 * 
 * 2. Styling Preservation:
 *    - Maintains exact Figma styling (fonts, colors, spacing)
 *    - Handles relative positioning between elements
 *    - Preserves flex layouts for groups and frames
 * 
 * 3. Preview Comparison:
 *    - Renders React components in real-time
 *    - Allows side-by-side comparison with Figma
 *    - Provides visual difference analysis
 */

import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
// import domtoimage from 'dom-to-image'; // Available for future use
import { compareVisuals } from '../services/compareVisuals';
import { deployToCodeSandbox, createShareableLink } from '../services/codesandbox';
import SimpleLivePreview from './SimpleLivePreview';

const LiveCodePreview = ({ code, figmaPreviewUrl }) => {
  const [differences, setDifferences] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState(null);
  const [transformedCode] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState(null);
  const [shareableLink, setShareableLink] = useState(null);
  const [componentName, setComponentName] = useState('Component');
  const livePreviewRef = useRef(null);

  // Extract component name and set up smart rendering
  useEffect(() => {
    if (code) {
      // Extract component name from code
      const componentMatch = code.match(/(?:const|function)\s+(\w+)\s*=/);
      const extractedName = componentMatch ? componentMatch[1] : 'Component';
      setComponentName(extractedName);
    }
  }, [code]);

  // Legacy transformation code removed - now handled by SmartComponentRenderer

  const handleDeploy = async () => {
    if (!transformedCode) {
      console.error('No transformed code available');
      return;
    }

    try {
      setIsDeploying(true);
      
      // Extract component name from the original code
      const componentMatch = code.match(/(?:const|function)\s+(\w+)\s*=/);
      const componentName = componentMatch ? componentMatch[1] : 'Component';
      
      console.log('Deploying component to CodeSandbox...');
      const result = await deployToCodeSandbox(transformedCode, componentName);
      
      if (result.success) {
        setDeploymentUrl(result.url);
        
        // Create shareable link
        const shareData = createShareableLink(transformedCode, componentName);
        setShareableLink(shareData.shareableLink);
        
        console.log('Successfully deployed:', result.url);
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (error) {
      console.error('Error deploying to CodeSandbox:', error);
    } finally {
      setIsDeploying(false);
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

  // Legacy helper functions removed - now handled by SmartComponentRenderer

  return (
    <div className="mt-6 p-4 bg-white rounded shadow w-full">
      <h2 className="text-xl font-semibold mb-4">Preview Comparison</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {/* React Preview */}
        <div className="border rounded p-4">
          <h3 className="text-lg font-semibold mb-2">React Preview</h3>
          <div ref={livePreviewRef} className="mt-2">
            <SimpleLivePreview
              code={code}
              componentName={componentName}
            />
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

      {/* Action Controls */}
      <div className="mt-4 flex justify-center gap-4 flex-wrap">
        {figmaPreviewUrl && (
          <button
            onClick={handleCompare}
            disabled={isComparing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isComparing ? 'Comparing...' : 'Compare Visuals'}
          </button>
        )}
        
        {transformedCode && (
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isDeploying ? 'Deploying...' : '🚀 Deploy to CodeSandbox'}
          </button>
        )}
        
        {deploymentUrl && (
          <div className="flex flex-col items-center gap-2">
            <a
              href={deploymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              🔗 Open Live Demo
            </a>
            {shareableLink && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareableLink}
                  readOnly
                  className="px-2 py-1 text-xs border rounded w-64"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(shareableLink)}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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