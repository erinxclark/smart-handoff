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
import { enhanceWithAccessibility } from '../utils/accessibilityEnhancer';

const LiveCodePreview = ({ code, figmaPreviewUrl, componentDetection, figmaNode }) => {
  const [differences, setDifferences] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState(null);
  const [transformedCode] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState(null);
  const [shareableLink, setShareableLink] = useState(null);
  const [componentName, setComponentName] = useState('Component');
  const [accessibilityAnalysis, setAccessibilityAnalysis] = useState(null);
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
      console.log('Live preview ref:', livePreviewRef.current);
      console.log('Figma preview URL:', figmaPreviewUrl);
      
      const previewElement = livePreviewRef.current;
      
      // Log element details for debugging
      console.log('Preview element:', previewElement);
      console.log('Element dimensions:', {
        width: previewElement.offsetWidth,
        height: previewElement.offsetHeight,
        scrollWidth: previewElement.scrollWidth,
        scrollHeight: previewElement.scrollHeight
      });
      
      // Ensure the element has content
      if (previewElement.offsetWidth === 0 || previewElement.offsetHeight === 0) {
        throw new Error('Preview element has no size. Check if component is rendering correctly.');
      }

      const canvas = await html2canvas(previewElement, {
        useCORS: true,
        allowTaint: true,
        logging: true, // Enable logging for debugging
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
      });

      const livePreviewUrl = canvas.toDataURL('image/png');
      console.log('Canvas generated successfully, size:', canvas.width, 'x', canvas.height);
      console.log('Live preview data URL length:', livePreviewUrl.length);
      
      const diff = await compareVisuals(livePreviewUrl, figmaPreviewUrl);
      console.log('Comparison result:', diff);
      setDifferences(diff);

      // Generate accessibility analysis for the comparison
      if (componentDetection && figmaNode) {
        try {
          const accessibilityResult = enhanceWithAccessibility(code, componentDetection, figmaNode);
          setAccessibilityAnalysis(accessibilityResult.accessibilityReport);
          console.log('Accessibility analysis:', accessibilityResult.accessibilityReport);
        } catch (error) {
          console.error('Error generating accessibility analysis:', error);
        }
      }
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
    <div className="w-full">
      <div className="grid grid-cols-2 gap-4">
        {/* React Preview */}
        <div>
          <h3 className="text-lg font-semibold mb-2">React Preview</h3>
          <SimpleLivePreview
            ref={livePreviewRef}
            code={code}
            componentName={componentName}
          />
        </div>

        {/* Figma Preview */}
        {figmaPreviewUrl && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Figma Preview</h3>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-slate-50 to-white min-h-[300px] flex items-center justify-center">
                <img 
                  src={figmaPreviewUrl} 
                  alt="Figma Preview" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compare Visuals Button */}
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
          <h3 className="text-lg font-semibold mb-4">Visual Comparison Analysis</h3>
          
          {/* Accuracy Score Header */}
          {differences.accuracyScore && differences.accuracyScore.overall !== undefined && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Accuracy Score</h3>
                <div className="text-3xl font-bold text-indigo-600">
                  {differences.accuracyScore.overall}%
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Dimensions</div>
                  <div className="text-lg font-semibold">{differences.accuracyScore.dimensions || 0}%</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Colors</div>
                  <div className="text-lg font-semibold">{differences.accuracyScore.colors || 0}%</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Spacing</div>
                  <div className="text-lg font-semibold">{differences.accuracyScore.spacing || 0}%</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Typography</div>
                  <div className="text-lg font-semibold">{differences.accuracyScore.typography || 0}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Critical Issues */}
          {differences.criticalIssues && differences.criticalIssues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-red-900 mb-2">Critical Issues</h4>
              <ul className="space-y-2">
                {differences.criticalIssues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      issue.impact === 'high' ? 'bg-red-200 text-red-900' :
                      issue.impact === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                      'bg-gray-200 text-gray-900'
                    }`}>
                      {issue.impact.toUpperCase()}
                    </span>
                    <span className="text-sm text-red-800">{issue.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Fixes */}
          {differences.actionableFixes && differences.actionableFixes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">Suggested Fixes</h4>
              <ol className="space-y-2 list-decimal list-inside">
                {differences.actionableFixes.map((fix, index) => (
                  <li key={index} className="text-sm text-blue-800">{fix}</li>
                ))}
              </ol>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">
                Apply fixes automatically →
              </button>
            </div>
          )}

          {/* Detailed breakdown (collapsible sections) */}
          <div className="space-y-3">
            {differences.dimensions && differences.dimensions !== 'Not analyzed' && (
              <details className="bg-white border rounded-xl">
                <summary className="p-4 cursor-pointer font-medium">Dimensions Analysis</summary>
                <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {differences.dimensions}
                </div>
              </details>
            )}

            {differences.colors && differences.colors !== 'Not analyzed' && (
              <details className="bg-white border rounded-xl">
                <summary className="p-4 cursor-pointer font-medium">Color Analysis</summary>
                <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {differences.colors}
                </div>
              </details>
            )}

            {differences.spacing && differences.spacing !== 'Not analyzed' && (
              <details className="bg-white border rounded-xl">
                <summary className="p-4 cursor-pointer font-medium">Spacing & Alignment</summary>
                <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {differences.spacing}
                </div>
              </details>
            )}

            {differences.typography && differences.typography !== 'Not analyzed' && (
              <details className="bg-white border rounded-xl">
                <summary className="p-4 cursor-pointer font-medium">Typography Analysis</summary>
                <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {differences.typography}
                </div>
              </details>
            )}

            {differences.borders && differences.borders !== 'Not analyzed' && (
              <details className="bg-white border rounded-xl">
                <summary className="p-4 cursor-pointer font-medium">Border & Effects</summary>
                <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {differences.borders}
                </div>
              </details>
            )}
          </div>

          {/* Legacy format support for backward compatibility */}
          {Array.isArray(differences) && differences.map && (
            <div className="mt-4">
              <h4 className="text-md font-semibold mb-2">Legacy Analysis</h4>
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
      )}

      {/* Accessibility Analysis */}
      {accessibilityAnalysis && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Accessibility Analysis</h3>
          <div className="p-4 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600">♿</span>
              <span className="font-medium text-blue-800">Accessibility Score: {accessibilityAnalysis.score}/100</span>
            </div>
            
            <div className="space-y-2 text-sm">
              {accessibilityAnalysis.improvements.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-1">✅ Improvements Applied:</h4>
                  <ul className="list-disc list-inside space-y-1 text-green-600">
                    {accessibilityAnalysis.improvements.map((improvement, index) => (
                      <li key={index}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {accessibilityAnalysis.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-700 mb-1">⚠️ Warnings:</h4>
                  <ul className="list-disc list-inside space-y-1 text-yellow-600">
                    {accessibilityAnalysis.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {accessibilityAnalysis.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-1">❌ Issues Found:</h4>
                  <ul className="list-disc list-inside space-y-1 text-red-600">
                    {accessibilityAnalysis.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCodePreview; 