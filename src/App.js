import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import FigmaTreeViewer from './components/FigmaTreeViewer';
import LiveCodePreview from './components/LiveCodePreview';
import { fetchNodeById } from './figmaApi';
import { generateSpecAndCode } from './services/openai';
import { fetchNodeThumbnail } from './services/fetchNodeThumbnail';
import PerformanceMonitor from './components/PerformanceMonitor';
import AIGeneratedCodePreview from './components/AIGeneratedCodePreview';
import { enforceExactValues, validateExactValues, debugAlignmentValues } from './utils/exactValueEnforcer';
import { enhanceWithAccessibility } from './utils/accessibilityEnhancer';
import { extractDesignTokens } from './utils/tokenExtractor';
import DesignTokensPanel from './components/DesignTokensPanel';


function App() {
  const [fileUrl, setFileUrl] = useState('');
  const [token, setToken] = useState('');
  const [fileData, setFileData] = useState(null);
  const [, setSelectedNodeId] = useState(null);
  const [selectedNodeName, setSelectedNodeName] = useState(null);
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [aiOutput, setAiOutput] = useState(null);
  const [extractedCode, setExtractedCode] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState(null);
  const [showPerformance, setShowPerformance] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState('none');
  const [componentDetection, setComponentDetection] = useState(null);
  const [libraryMapping, setLibraryMapping] = useState(null);
  const [loadingFigma, setLoadingFigma] = useState(false);
  const [accessibilityReport, setAccessibilityReport] = useState(null);
  const [designTokens, setDesignTokens] = useState(null);

  // Fix common positioning issues in generated code
  const fixPositioningIssues = (code) => {
    console.log('=== POSITIONING FIX DEBUG ===');
    console.log('Input code:', code);

    if (!code) return code;

    let fixedCode = code;

    // Find the root element (first element with style attribute)
    const rootElementMatch = fixedCode.match(/(<(article|div|section|main|header|footer|nav)[^>]*style=\{[^}]*\}[^>]*>)/);

    if (rootElementMatch) {
      const originalRootElement = rootElementMatch[1];
      console.log('Found root element:', originalRootElement);

      // Only remove positioning from this root element
      const fixedRootElement = originalRootElement
        .replace(/position:\s*['"]absolute['"]\s*,?\s*/g, '')
        .replace(/left:\s*[^,}]+,?\s*/g, '')
        .replace(/top:\s*[^,}]+,?\s*/g, '')
        .replace(/right:\s*[^,}]+,?\s*/g, '')
        .replace(/bottom:\s*[^,}]+,?\s*/g, '')
        .replace(/transform:\s*[^,}]+,?\s*/g, '')
        .replace(/,\s*}/g, '}')
        .replace(/{\s*,/g, '{')
        .replace(/,\s*,/g, ',');

      console.log('Fixed root element:', fixedRootElement);

      // Replace only the root element, leave all others untouched
      fixedCode = fixedCode.replace(originalRootElement, fixedRootElement);

      // Ensure root has position: relative if no position specified
      if (!fixedRootElement.includes('position:')) {
        // Add position: relative INSIDE the style object
        // Find the opening of the style object: style={{
        fixedCode = fixedCode.replace(
          /(<[^>]*style=\{\{)/,  // Match style={{
          '$1 position: \'relative\', '  // Add inside the braces
        );
        console.log('Added position relative to root element');
      }
    }

    // After fixing root, verify children have positioning
    const childDivs = fixedCode.match(/<div[^>]*position:\s*['"]absolute['"]/g);
    console.log(`Found ${childDivs?.length || 0} correctly positioned child elements`);

    console.log('Fixed positioning - only modified root element');
    console.log('Output code:', fixedCode);
    console.log('=== END DEBUG ===');
    return fixedCode;
  };

  const extractFileId = (url) => {
    try {
      const match = url.match(/(?:file|design)\/([a-zA-Z0-9]+)\//);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const fetchFigmaData = async (e) => {
    e.preventDefault();
    const fileId = extractFileId(fileUrl);
    if (!fileId || !token) {
      setError('Please provide both a valid Figma URL and Access Token.');
      return;
    }

    setLoadingFigma(true);
    setError(null);

    try {
      const response = await axios.get(`https://api.figma.com/v1/files/${fileId}`, {
        headers: {
          'X-Figma-Token': token,
        },
      });

      setFileData(response.data);
      setError(null);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Failed to fetch file. Check your URL and token.');
      setFileData(null);
    } finally {
      setLoadingFigma(false);
    }
  };

  // Safe JSON serialization to handle circular references
  const safeStringify = (obj, maxDepth = 3) => {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    }, 2);
  };

  const handleNodeSelect = async (node) => {
    console.log('=== NODE SELECTION DEBUG ===');
    console.log('Selected node:', safeStringify(node));
    
    try {
      setSelectedNodeId(node.id);
      setSelectedNodeName(node.name);
      
      const fileId = extractFileId(fileUrl);
      if (fileId && token) {
        console.log('Fetching node data for:', node.id);
        
        const nodeData = await fetchNodeById(fileId, node.id, token);
        console.log('Received node data:', safeStringify(nodeData));
        
        // CRITICAL: Check if nodeData is valid
        if (!nodeData || !nodeData.absoluteBoundingBox) {
          console.error('Invalid node data - missing absoluteBoundingBox');
          setError('Unable to process this node. Try selecting a frame or component instead of a group.');
          return;
        }
        
        setSelectedNodeData(nodeData);
        
        // Fetch thumbnail with error handling
        try {
          const thumbnail = await fetchNodeThumbnail(fileId, node.id, token);
          setThumbnailUrl(thumbnail);
        } catch (thumbError) {
          console.warn('Thumbnail fetch failed, continuing without it:', thumbError);
          setThumbnailUrl(null);
        }

        // Extract design tokens with error handling
        try {
          console.log('🎨 TOKENS: Extracting design tokens...');
          const tokens = extractDesignTokens(nodeData);
          setDesignTokens(tokens);
          console.log('🎨 TOKENS: Extraction complete', tokens.summary);
        } catch (tokenError) {
          console.warn('Token extraction failed:', tokenError);
          setDesignTokens(null);
        }
      }
    } catch (error) {
      console.error('=== ERROR IN NODE SELECTION ===');
      console.error('Error:', error);
      console.error('Error stack:', error.stack);
      setError(`Failed to load component: ${error.message}`);
      setSelectedNodeData(null);
    }
  };

  // React Query mutation for code generation
  const codeGenerationMutation = useMutation({
    mutationFn: async (nodeData) => {
      // Generate the actual code (detection happens inside generateSpecAndCode)
      return await generateSpecAndCode(nodeData, selectedLibrary);
    },
    onSuccess: (result) => {
      const output = result.output || result; // Handle both new and old formats
      setAiOutput(output);
      
      // Set component detection from the result
      if (result.componentDetection) {
        setComponentDetection(result.componentDetection);
      } else {
        // Fallback: Extract detection results from AI output
        try {
          const detectionMatch = output.match(/COMPONENT ANALYSIS:\s*- Detected Component Type: ([^\n]+)\s*- Confidence: (\d+)%\s*- Reasoning: ([^\n]+)/);
          if (detectionMatch) {
            setComponentDetection({
              componentType: detectionMatch[1].toLowerCase().trim(),
              confidence: parseInt(detectionMatch[2]),
              reasoning: detectionMatch[3].trim()
            });
          }
          
          const libraryMatch = output.match(/Using ([^\s]+) component library/);
          if (libraryMatch) {
            setLibraryMapping({
              usesLibrary: true,
              library: libraryMatch[1]
            });
          }
        } catch (error) {
          console.log('Could not parse detection results from AI output');
        }
      }
      
      // Note: Using simple exact value enforcement instead of complex alignment analysis
      
      // Extract the code from the output
      const codeMatch = output.match(/```jsx\n([\s\S]*?)```/);
      if (codeMatch) {
        let extractedCode = codeMatch[1].trim();
        
        // Fix common positioning issues
        extractedCode = fixPositioningIssues(extractedCode);
        
        // Enforce exact values from Figma JSON
        if (result.figmaNode) {
          try {
            console.log('🎯 ALIGNMENT: Starting exact value enforcement...');
            
            // Debug the values before correction
            debugAlignmentValues(extractedCode, result.figmaNode);
            
            // Apply exact value corrections
            const correctedCode = enforceExactValues(extractedCode, result.figmaNode);
            if (correctedCode !== extractedCode) {
              console.log('🔧 ALIGNMENT: Applied exact value corrections');
              console.log('🔧 ALIGNMENT: Before:', extractedCode.substring(0, 200) + '...');
              console.log('🔧 ALIGNMENT: After:', correctedCode.substring(0, 200) + '...');
              extractedCode = correctedCode;
            } else {
              console.log('🔧 ALIGNMENT: No corrections needed - values already exact');
            }
            
            // Validate exact values
            const validation = validateExactValues(extractedCode, result.figmaNode);
            if (!validation.isValid) {
              console.log('❌ ALIGNMENT: Value mismatches detected:', validation.issues);
            } else {
              console.log('✅ ALIGNMENT: All values match Figma exactly');
            }
          } catch (error) {
            console.error('❌ ALIGNMENT: Error enforcing exact values:', error);
          }
        } else {
          console.log('⚠️ ALIGNMENT: No Figma node data available for alignment enforcement');
        }

        // Enhance with accessibility features
        try {
          console.log('♿ ACCESSIBILITY: Starting accessibility enhancement...');
          const accessibilityResult = enhanceWithAccessibility(
            extractedCode, 
            result.componentDetection || componentDetection, 
            result.figmaNode
          );
          
          if (accessibilityResult.enhancedCode !== extractedCode) {
            console.log('♿ ACCESSIBILITY: Applied accessibility enhancements');
            extractedCode = accessibilityResult.enhancedCode;
          }
          
          setAccessibilityReport(accessibilityResult.accessibilityReport);
          console.log('♿ ACCESSIBILITY: Enhancement complete, score:', accessibilityResult.accessibilityReport.score);
        } catch (error) {
          console.error('❌ ACCESSIBILITY: Error enhancing accessibility:', error);
          setAccessibilityReport({
            score: 0,
            issues: ['Accessibility enhancement failed: ' + error.message],
            improvements: []
          });
        }
        
        console.log('Extracted code from AI output:', extractedCode);
        console.log('Full AI output for debugging:', output);
        setExtractedCode(extractedCode);
      } else {
        // Try alternative format
        const altCodeMatch = output.match(/```(javascript|js)\n([\s\S]*?)```/);
        if (altCodeMatch) {
          let extractedCode = altCodeMatch[2].trim();
          
          // Fix common positioning issues
          extractedCode = fixPositioningIssues(extractedCode);
          
          console.log('Extracted code from AI output (alt format):', extractedCode);
          setExtractedCode(extractedCode);
        } else {
          console.error('Could not extract code from AI output');
          console.log('AI output:', output);
          throw new Error('Could not extract code from AI output. Please try again.');
        }
      }
    },
    onError: (error) => {
      console.error('Error generating code:', error);
      setError(error.message);
    },
    onMutate: () => {
      setLoadingAI(true);
      setError(null);
      setComponentDetection(null);
      setLibraryMapping(null);
      setAccessibilityReport(null);
      // Keep design tokens - they're based on the selected component, not generated code
    },
    onSettled: () => {
      setLoadingAI(false);
    }
  });

  const handleGenerateCode = async () => {
    if (!selectedNodeData) {
      setError('No node selected. Please select a node first.');
      return;
    }
    
    // Validate node data has minimum required fields
    if (!selectedNodeData.absoluteBoundingBox) {
      setError('Selected component is missing positioning data. Try selecting a Frame or Component instead of a Group.');
      return;
    }
    
    console.log('Generating code with validated data:', {
      hasAbsoluteBoundingBox: !!selectedNodeData.absoluteBoundingBox,
      hasFills: !!selectedNodeData.fills,
      hasChildren: !!selectedNodeData.children,
      childCount: selectedNodeData.children?.length || 0,
      nodeType: selectedNodeData.type
    });

    setLoadingAI(true);
    setError(null);
    setExtractedCode('');
    setAiOutput('');
    
    codeGenerationMutation.mutate(selectedNodeData);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'p' || event.key === 'P') {
        setShowPerformance(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="bg-gradient-to-br from-blue-600 to-purple-600 h-12 w-12 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg"
              >
                S
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Smart Handoff
                </h1>
                <p className="text-slate-500 text-sm font-medium">AI-Powered Design to Code</p>
              </div>
            </div>
            
            {/* Dark Mode Toggle (placeholder for future) */}
          <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-500 font-medium">Ready</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Modern Split View */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 min-h-[calc(100vh-140px)]">
          
          {/* LEFT PANEL - Compact Controls (25%) */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1 space-y-4"
          >
            
            {/* Compact Figma Status */}
            {!fileData ? (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-6 w-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.852 8.98h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.47H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.98zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.47H8.148zm4.587 15.04H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117v-6.038H8.148zm7.704 0h-3.117v-1.47h3.117c1.665 0 3.019 1.355 3.019 3.019s-1.354 3.019-3.019 3.019zm0-4.49h-3.117V7.51h3.117c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49z"/>
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">Figma Setup</h3>
                </div>
                
                <form onSubmit={fetchFigmaData} className="space-y-3">
                <input
                  type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white"
                    placeholder="Figma file URL..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
                  
              <input
                    type="password"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white"
                    placeholder="Access token..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
                  
                  <motion.button 
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!fileUrl || !token}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingFigma ? 'Loading...' : 'Load File'}
                  </motion.button>
          </form>
        </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">Connected</p>
                    <p className="text-xs text-green-600 truncate">{fileData.name}</p>
                  </div>
                </div>
          </div>
        )}

            {/* Compact Configuration */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Library</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-1">
                {[
                  { value: 'none', label: 'Auto', icon: '🤖' },
                  { value: 'shadcn', label: 'shadcn', icon: '⚡' },
                  { value: 'mui', label: 'MUI', icon: '🎨' },
                  { value: 'chakra', label: 'Chakra', icon: '✨' }
                ].map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedLibrary(option.value)}
                    className={`p-2 rounded-lg border transition-all duration-200 text-center ${
                      selectedLibrary === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-sm">{option.icon}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Compact Detection Results */}
            {componentDetection && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">Detection</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {componentDetection.componentType === 'button' && '🔘'}
                    {componentDetection.componentType === 'input' && '📝'}
                    {componentDetection.componentType === 'card' && '🃏'}
                    {componentDetection.componentType === 'badge' && '🏷️'}
                    {componentDetection.componentType === 'avatar' && '👤'}
                    {componentDetection.componentType === 'container' && '📦'}
                    {componentDetection.componentType === 'unknown' && '❓'}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 capitalize">
                        {componentDetection.componentType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        componentDetection.confidence >= 90 ? 'bg-green-100 text-green-800' :
                        componentDetection.confidence >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {componentDetection.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {libraryMapping && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                    <span>{libraryMapping.usesLibrary ? '📚' : '🛠️'}</span>
                    <span>{libraryMapping.usesLibrary ? libraryMapping.library || 'Library' : 'Custom'}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Accessibility Report */}
            {accessibilityReport && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">Accessibility</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-auto ${
                    accessibilityReport.score >= 90 ? 'bg-green-100 text-green-800' :
                    accessibilityReport.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {accessibilityReport.score}/100
                  </span>
                </div>
                
                <div className="space-y-1">
                  {accessibilityReport.semanticHTML && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-500">✅</span>
                      <span className="text-slate-600">Semantic HTML</span>
                    </div>
                  )}
                  {accessibilityReport.ariaLabels && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-500">✅</span>
                      <span className="text-slate-600">ARIA labels</span>
                    </div>
                  )}
                  {accessibilityReport.keyboardAccessible && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-500">✅</span>
                      <span className="text-slate-600">Keyboard accessible</span>
                    </div>
                  )}
                  {accessibilityReport.colorContrast && (
                    <div className="flex items-center gap-2 text-xs">
                      {accessibilityReport.colorContrast.meetsAA ? (
                        <span className="text-green-500">✅</span>
                      ) : (
                        <span className="text-yellow-500">⚠️</span>
                      )}
                      <span className="text-slate-600">
                        Contrast: {accessibilityReport.colorContrast.ratio}:1
                      </span>
                    </div>
                  )}
                  {accessibilityReport.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {accessibilityReport.warnings.map((warning, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-yellow-700">
                          <span>⚠️</span>
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {accessibilityReport.issues.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {accessibilityReport.issues.map((issue, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-red-700">
                          <span>❌</span>
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Design Tokens Panel */}
            <DesignTokensPanel 
              tokens={designTokens} 
              componentName={selectedNodeName}
            />

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3"
                >
                  <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {fileData && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">File loaded: {fileData.name}</span>
                  </div>
                  <span className="text-sm text-green-600">{new Date().toLocaleTimeString()}</span>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>

          {/* RIGHT PANEL - Code & Preview (75%) */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3 space-y-4"
          >

            {/* TOP ROW: Generated Code + Generate Code side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Generated Code - Left side */}
              {extractedCode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
                >
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800">Generated Code</h3>
                      </div>
            </div>
          </div>
                  <div className="p-4 max-h-[300px] overflow-auto">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                      <code>{extractedCode}</code>
                    </pre>
                  </div>
                </motion.div>
              )}

              {/* Generate Code - Right side */}
        {fileData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
                >
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M15.852 8.98h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.47H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.98zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.47H8.148zm4.587 15.04H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117v-6.038H8.148zm7.704 0h-3.117v-1.47h3.117c1.665 0 3.019 1.355 3.019 3.019s-1.354 3.019-3.019 3.019zm0-4.49h-3.117V7.51h3.117c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49z"/>
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800">Generate Code</h3>
                    </div>
                  </div>
                  
                  <div className="p-4 max-h-[300px] overflow-auto">
                    <div className="space-y-3">
                      <div className="text-xs text-slate-600">
                        {fileData.document.children.length} components available
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                        <FigmaTreeViewer
                          document={fileData.document}
                          onSelect={handleNodeSelect}
                        />
                      </div>
                      
                      {selectedNodeData && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-medium text-slate-800">{selectedNodeName || 'Component'}</span>
                          </div>
                          
                          {selectedNodeData && (
                            <div className="text-xs text-slate-600 mb-2">
                              Node type: {selectedNodeData.type}
                              {selectedNodeData.type === 'GROUP' && (
                                <div className="text-yellow-600 mt-1">
                                  ⚠️ Groups may have limited data. For best results, use Frames or Components.
                                </div>
                              )}
                            </div>
                          )}
                          
                          {thumbnailUrl && (
                            <div className="mb-2">
                              <img 
                                src={thumbnailUrl} 
                                alt={`Preview of ${selectedNodeName}`}
                                className="w-full rounded-lg shadow-sm border border-slate-200"
                              />
                            </div>
                          )}
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGenerateCode}
                            disabled={loadingAI}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {loadingAI ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Generate Code
                              </>
                            )}
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* BOTTOM ROW: Full-width Live Preview with Figma + React side by side */}
            {extractedCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-white">Live Preview</h2>
                        <p className="text-emerald-100 text-sm">Real-time React rendering</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-white/60 rounded-full animate-pulse"></div>
                      <span className="text-white text-sm font-medium">Live</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <LiveCodePreview 
                    code={extractedCode} 
                    figmaPreviewUrl={thumbnailUrl}
                    componentDetection={componentDetection}
                    figmaNode={selectedNodeData}
                  />
                </div>
              </motion.div>
            )}

            {/* Generated Code - With Tailwind Toggle & Storybook */}
            {aiOutput && extractedCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
              >
                <AIGeneratedCodePreview 
                  code={extractedCode} 
                  componentName={selectedNodeName || 'Component'}
                  detectionInfo={componentDetection}
                  showPreview={false}
                />
              </motion.div>
            )}

          </motion.div>
        </div>
      </main>

      {/* Performance Monitor */}
      <PerformanceMonitor isVisible={showPerformance} />
    </div>
  );
}

export default App;
