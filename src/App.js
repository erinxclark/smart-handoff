import React, { useState } from 'react';
import axios from 'axios';
import FigmaTreeViewer from './components/FigmaTreeViewer';
import LiveCodePreview from './components/LiveCodePreview';
import { fetchNodeById } from './figmaApi';
import { generateSpecAndCode } from './services/openai';
import { fetchNodeThumbnail } from './services/fetchNodeThumbnail';
import CodeEditor from './components/CodeEditor';

function App() {
  const [fileUrl, setFileUrl] = useState('');
  const [token, setToken] = useState('');
  const [fileData, setFileData] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeName, setSelectedNodeName] = useState(null);
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [aiOutput, setAiOutput] = useState(null);
  const [extractedCode, setExtractedCode] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState(null);

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

  const handleGenerateCode = async () => {
    try {
      setLoadingAI(true);
      setError(null);
      setExtractedCode('');
      setAiOutput('');

      if (!selectedNodeData) {
        throw new Error('No node selected. Please select a node first.');
      }

      const output = await generateSpecAndCode(selectedNodeData);
      setAiOutput(output);

      // Extract the code from the output
      const codeMatch = output.match(/```jsx\n([\s\S]*?)```/);
      if (codeMatch) {
        const extractedCode = codeMatch[1].trim();
        console.log('Extracted code from AI output:', extractedCode);
        setExtractedCode(extractedCode);
      } else {
        // Try alternative format
        const altCodeMatch = output.match(/```(javascript|js)\n([\s\S]*?)```/);
        if (altCodeMatch) {
          const extractedCode = altCodeMatch[2].trim();
          console.log('Extracted code from AI output (alt format):', extractedCode);
          setExtractedCode(extractedCode);
        } else {
          console.error('Could not extract code from AI output');
          console.log('AI output:', output);
          throw new Error('Could not extract code from AI output. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error generating code:', error);
      setError(error.message);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-dark to-primary py-6 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="bg-white h-10 w-10 rounded-lg flex items-center justify-center font-bold text-primary text-xl">S</div>
            <div>
              <h1 className="text-white text-2xl font-bold">SmartHandoff</h1>
              <p className="text-white/80 text-sm">AI-Powered Design Handoff Tool</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent"></div>
          <form onSubmit={fetchFigmaData} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Figma File Link</label>
              <div className="relative">
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://www.figma.com/file/..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Figma Access Token</label>
              <input
                type="text"
                className="input-field"
                placeholder="figma_pat_..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            <button type="submit" className="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
              Parse Figma File
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-danger text-white p-4 rounded-lg shadow-md mb-8 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        {/* Success Message */}
        {fileData && (
          <div className="bg-gradient-to-r from-success to-green-400 text-white p-4 rounded-lg shadow-md mb-8 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <strong>Figma File Loaded:</strong> {fileData.name}
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Design Assets Section */}
        {fileData && (
          <>
            <div className="section-title">Design Assets</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* File Tree */}
              <div className="panel">
                <div className="panel-header">
                  Figma File Structure
                  <span className="bg-primary-light text-white text-xs px-2 py-1 rounded-full">
                    {fileData.document.children.length} Components
                  </span>
                </div>
                <div className="panel-content">
                  <FigmaTreeViewer
                    document={fileData.document}
                    onSelect={handleNodeSelect}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="panel">
                <div className="panel-header">
                  Figma Preview
                  {selectedNodeName && (
                    <span className="bg-primary-light text-white text-xs px-2 py-1 rounded-full">{selectedNodeName}</span>
                  )}
                </div>
                <div className="panel-content">
                  {thumbnailUrl ? (
                    <div className="flex flex-col items-center">
                      <img src={thumbnailUrl} alt="Figma Preview" className="max-w-full rounded-lg shadow" />
                      <p className="mt-4 text-gray-600 italic bg-white px-4 py-2 rounded-lg shadow-sm">{selectedNodeName}</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      Select a component to preview
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Analysis & Code Section */}
            {selectedNodeData && (
              <>
                <div className="section-title">AI Analysis & Code</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* AI Output */}
                  <div className="panel">
                    <div className="panel-header">
                      AI Generated Specs & Code
                      <span className="bg-primary-light text-white text-xs px-2 py-1 rounded-full">Auto-Generated</span>
                    </div>
                    <div className="panel-content">
                      <div className="flex border-b border-gray-200 mb-4">
                        <button className="px-4 py-2 text-primary">Specs</button>
                      </div>
                      <div className="prose max-w-none">
                        {aiOutput ? (
                          <div className="whitespace-pre-wrap">{aiOutput}</div>
                        ) : (
                          <div className="text-center text-gray-400 py-8">
                            {loadingAI ? (
                              <div className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating specs and code...
                              </div>
                            ) : (
                              <button onClick={handleGenerateCode} className="button">
                                Generate Spec + Code
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Code Editor - Now next to AI Output */}
                  <div className="panel">
                    <div className="panel-header">
                      Editable Code
                      <span className="bg-primary-light text-white text-xs px-2 py-1 rounded-full">Live</span>
                    </div>
                    <div className="panel-content">
                      <CodeEditor
                        code={extractedCode}
                        onChange={(newCode) => setExtractedCode(newCode)}
                      />
                    </div>
                  </div>

                  {/* Live Preview - Now taking full width below */}
                  <div className="panel lg:col-span-2">
                    <div className="panel-header">
                      Live Preview
                      <span className="bg-primary-light text-white text-xs px-2 py-1 rounded-full">Interactive</span>
                    </div>
                    <div className="panel-content">
                      <LiveCodePreview 
                        code={extractedCode} 
                        figmaPreviewUrl={thumbnailUrl}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
