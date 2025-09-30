import React from 'react';
import AICodePreview from './AICodePreview';

/**
 * AIGeneratedCodePreview Component
 * 
 * A specialized component for displaying AI-generated code with both
 * code display and live preview. Used in the AI output section.
 */
const AIGeneratedCodePreview = ({ code, componentName = 'Component', detectionInfo = null, showPreview = true }) => {
  return (
    <AICodePreview 
      code={code}
      componentName={componentName}
      showCode={true} // Show the generated code
      showPreview={showPreview} // Show/hide the live preview based on prop
      className="w-full"
      detectionInfo={detectionInfo}
    />
  );
};

export default AIGeneratedCodePreview;
