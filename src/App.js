import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import FigmaTreeViewer from './components/FigmaTreeViewer';
import LiveCodePreview from './components/LiveCodePreview';
import AIGeneratedCodePreview from './components/AIGeneratedCodePreview';
import { fetchNodeById } from './figmaApi';
import { generateSpecAndCode } from './services/openai';
import { fetchNodeThumbnail } from './services/fetchNodeThumbnail';
import CodeEditor from './components/CodeEditor';
import PerformanceMonitor from './components/PerformanceMonitor';

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

  // Fix common positioning issues in generated code
  const fixPositioningIssues = (code) => {
    if (!code) return code;
    
    let fixedCode = code;
    
    // Fix root element positioning - remove absolute positioning from root
    // Look for the first div in the return statement and fix its positioning
    fixedCode = fixedCode.replace(
      /(<div\s+style=\{[^}]*position:\s*['"]absolute['"][^}]*\})/,
      (match) => {
        // Remove position: 'absolute' and positioning properties from root div
        return match
          .replace(/position:\s*['"]absolute['"]\s*,?\s*/g, '')
          .replace(/left:\s*[^,}]+,?\s*/g, '')
          .replace(/top:\s*[^,}]+,?\s*/g, '')
          .replace(/right:\s*[^,}]+,?\s*/g, '')
          .replace(/bottom:\s*[^,}]+,?\s*/g, '')
          .replace(/transform:\s*[^,}]+,?\s*/g, '')
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/{\s*,/g, '{') // Remove leading commas
          .replace(/,\s*,/g, ',') // Remove double commas
      }
    );
    
    // Ensure root element has proper positioning
    fixedCode = fixedCode.replace(
      /(<div\s+style=\{[^}]*\})/,
      (match) => {
        if (!match.includes('position:')) {
          // Add position: 'relative' if no position is specified
          return match.replace('style={{', 'style={{ position: \'relative\', ');
        }
        return match;
      }
    );
    
    console.log('Fixed positioning issues in code');
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

  const handleNodeSelect = async (node) => {
    console.log('🧩 Selected node:', node);
    setSelectedNodeId(node.id);
    setSelectedNodeName(node.name);
    
    const fileId = extractFileId(fileUrl);
    if (fileId && token) {
      try {
        const nodeData = await fetchNodeById(fileId, node.id, token);
        setSelectedNodeData(nodeData);
        
        // Fetch thumbnail
        const thumbnail = await fetchNodeThumbnail(fileId, node.id, token);
        setThumbnailUrl(thumbnail);
      } catch (error) {
        console.error('Error fetching node data:', error);
        setError('Failed to fetch node data. Please try again.');
      }
    }
  };

  // React Query mutation for code generation
  const codeGenerationMutation = useMutation({
    mutationFn: async (nodeData) => {
      // Generate the actual code (detection happens inside generateSpecAndCode)
      return await generateSpecAndCode(nodeData, selectedLibrary);
    },
    onSuccess: (output) => {
      setAiOutput(output);
      
      // Extract detection results from AI output
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
      
      // Extract the code from the output
      const codeMatch = output.match(/```jsx\n([\s\S]*?)```/);
      if (codeMatch) {
        let extractedCode = codeMatch[1].trim();
        
        // Fix common positioning issues
        extractedCode = fixPositioningIssues(extractedCode);
        
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
                  />
                </div>
              </motion.div>
            )}

            {/* Generated Code - Secondary */}
            {aiOutput && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
              >
                <AIGeneratedCodePreview 
                  code={extractedCode} 
                  componentName={selectedNodeName || 'Component'}
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
