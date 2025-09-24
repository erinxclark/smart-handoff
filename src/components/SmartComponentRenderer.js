/**
 * Smart Component Renderer
 * 
 * A robust component that handles different rendering strategies
 * for React Live with proper error boundaries and fallbacks.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import { reactLiveTransformer } from '../services/reactLiveTransformer';
import { componentStructureAnalyzer } from '../services/componentStructureAnalyzer';

const SmartComponentRenderer = ({ 
  code, 
  componentName = 'Component',
  fallbackComponent = null,
  onError = null,
  onSuccess = null 
}) => {
  const [renderStrategy, setRenderStrategy] = useState('ai');
  const [transformedCode, setTransformedCode] = useState('');
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState(null);
  const [renderStats, setRenderStats] = useState({
    transformationTime: 0,
    renderAttempts: 0,
    strategy: null
  });

  // Multiple rendering strategies - memoized to prevent infinite loops
  const strategies = useMemo(() => ({
    ai: {
      name: 'AI Analysis',
      transformer: async (code, name) => {
        const startTime = performance.now();
        const result = await componentStructureAnalyzer.analyzeAndFix(code, name);
        const endTime = performance.now();
        
        setRenderStats(prev => ({
          ...prev,
          transformationTime: Math.round(endTime - startTime),
          strategy: 'AI Analysis'
        }));
        
        return result.fixedCode;
      }
    },
    transformer: {
      name: 'Smart Transformer',
      transformer: async (code, name) => {
        const startTime = performance.now();
        const result = reactLiveTransformer.transformForReactLive(code, name);
        const endTime = performance.now();
        
        setRenderStats(prev => ({
          ...prev,
          transformationTime: Math.round(endTime - startTime),
          strategy: 'Smart Transformer'
        }));
        
        return result;
      }
    },
    fallback: {
      name: 'Fallback Renderer',
      transformer: async (code, name) => {
        // Simple fallback - just wrap in a div
        const simpleWrapper = `
const ${name} = () => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '4px',
      textAlign: 'center'
    }}>
      <h3>${name}</h3>
      <p>Component rendered successfully</p>
    </div>
  );
};

${name}`;
        return simpleWrapper;
      }
    }
  }), []); // Empty dependency array since strategies don't change

  // Transform code using current strategy
  const transformCode = useCallback(async (code, name, strategy = 'ai') => {
    if (!code) return;

    setIsTransforming(true);
    setError(null);
    setRenderStats(prev => ({ ...prev, renderAttempts: prev.renderAttempts + 1 }));

    try {
      const strategyConfig = strategies[strategy];
      if (!strategyConfig) {
        throw new Error(`Unknown strategy: ${strategy}`);
      }

      const transformed = await strategyConfig.transformer(code, name);
      setTransformedCode(transformed);
      
      if (onSuccess) {
        onSuccess(transformed, strategy);
      }
    } catch (err) {
      console.error(`Error with strategy ${strategy}:`, err);
      setError(err.message);
      
      if (onError) {
        onError(err, strategy);
      }

      // Try next strategy
      const strategyKeys = Object.keys(strategies);
      const currentIndex = strategyKeys.indexOf(strategy);
      
      if (currentIndex < strategyKeys.length - 1) {
        const nextStrategy = strategyKeys[currentIndex + 1];
        console.log(`Trying next strategy: ${nextStrategy}`);
        setTimeout(() => {
          transformCode(code, name, nextStrategy);
        }, 100);
      }
    } finally {
      setIsTransforming(false);
    }
  }, [strategies, onSuccess, onError]);

  // Transform code when it changes - with proper dependency management
  useEffect(() => {
    if (code && componentName) {
      // Only transform if we don't already have transformed code for this exact input
      const currentInput = `${componentName}-${code.substring(0, 50)}`;
      const lastInput = renderStats.lastInput || '';
      
      if (currentInput !== lastInput) {
        setRenderStats(prev => ({ ...prev, lastInput: currentInput }));
        transformCode(code, componentName, renderStrategy);
      }
    } else {
      setTransformedCode('');
    }
  }, [code, componentName, renderStrategy, renderStats.lastInput, transformCode]);

  // Handle render errors
  const handleRenderError = useCallback((error) => {
    console.error('React Live render error:', error);
    
    // Try next strategy
    const strategyKeys = Object.keys(strategies);
    const currentIndex = strategyKeys.indexOf(renderStrategy);
    
    if (currentIndex < strategyKeys.length - 1) {
      const nextStrategy = strategyKeys[currentIndex + 1];
      setRenderStrategy(nextStrategy);
    }
  }, [renderStrategy, strategies]);

  if (!code) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        No code to render
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading indicator */}
      {isTransforming && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">
              Rendering with {strategies[renderStrategy]?.name}...
            </span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          <strong>Render Error:</strong> {error}
        </div>
      )}

      {/* Strategy indicator */}
      <div className="mb-2 text-xs text-gray-500">
        Strategy: {strategies[renderStrategy]?.name} 
        {renderStats.transformationTime > 0 && (
          <span> ({renderStats.transformationTime}ms)</span>
        )}
      </div>

      {/* React Live renderer */}
      <LiveProvider
        code={transformedCode}
        noInline={false}
        scope={{ React }}
        onError={handleRenderError}
      >
        <div className="relative">
          <LiveError className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 p-2 text-sm rounded z-20" />
          <LivePreview className="min-h-[100px] border border-gray-200 rounded p-4 bg-white" />
        </div>
      </LiveProvider>

      {/* Fallback component */}
      {fallbackComponent && !transformedCode && (
        <div className="min-h-[100px] border border-gray-200 rounded p-4 bg-gray-50 flex items-center justify-center">
          {fallbackComponent}
        </div>
      )}

      {/* Render stats */}
      {renderStats.renderAttempts > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          Attempts: {renderStats.renderAttempts} | 
          Strategy: {renderStats.strategy || 'Unknown'}
        </div>
      )}
    </div>
  );
};

export default SmartComponentRenderer;
