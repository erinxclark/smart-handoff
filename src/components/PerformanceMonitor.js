/**
 * Performance Monitor Component
 * 
 * Monitors and displays performance metrics for:
 * - Code generation time
 * - AI transformation time
 * - Component rendering performance
 * - Network request times
 */

import React, { useState, useEffect } from 'react';

const PerformanceMonitor = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState({
    codeGenerationTime: 0,
    transformationTime: 0,
    renderTime: 0,
    networkRequests: [],
    memoryUsage: 0
  });

  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      // Get memory usage if available
      if (performance.memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
        }));
      }

      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          pageLoadTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart)
        }));
      }
    };

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const recordMetric = (name, value) => {
    setMetrics(prev => ({
      ...prev,
      [name]: value,
      networkRequests: [
        ...prev.networkRequests.slice(-4), // Keep last 5
        { name, value, timestamp: Date.now() }
      ]
    }));
  };

  // Expose metric recording function globally
  useEffect(() => {
    window.recordPerformanceMetric = recordMetric;
    return () => {
      delete window.recordPerformanceMetric;
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono max-w-xs">
      <div className="font-bold mb-2">Performance Metrics</div>
      
      <div className="space-y-1">
        <div>Code Gen: {metrics.codeGenerationTime}ms</div>
        <div>Transform: {metrics.transformationTime}ms</div>
        <div>Render: {metrics.renderTime}ms</div>
        <div>Memory: {metrics.memoryUsage}MB</div>
        {metrics.pageLoadTime && (
          <div>Load: {metrics.pageLoadTime}ms</div>
        )}
      </div>

      {metrics.networkRequests.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="font-semibold">Recent Requests:</div>
          {metrics.networkRequests.slice(-3).map((req, index) => (
            <div key={index} className="text-xs opacity-75">
              {req.name}: {req.value}ms
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-xs opacity-50">
        Press P to toggle
      </div>
    </div>
  );
};

export default PerformanceMonitor;
