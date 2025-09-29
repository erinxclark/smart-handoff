import React from 'react';
import AICodePreview from './AICodePreview';

/**
 * Simple Live Preview Component
 * 
 * A wrapper around AICodePreview for rendering React code
 * from the CodeEditor with proper JSX transformation.
 */
const SimpleLivePreview = ({ code, componentName = 'Component' }) => {
  return (
    <AICodePreview 
      code={code}
      componentName={componentName}
      showCode={false} // Don't show code block in this context
      showPreview={true}
      className="min-h-[200px]"
    />
  );
};

export default SimpleLivePreview;