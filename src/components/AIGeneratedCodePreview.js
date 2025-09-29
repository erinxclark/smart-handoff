import React from 'react';
import AICodePreview from './AICodePreview';

/**
 * AIGeneratedCodePreview Component
 * 
 * A specialized component for displaying AI-generated code with both
 * code display and live preview. Used in the AI output section.
 */
const AIGeneratedCodePreview = ({ code, componentName = 'Component' }) => {
  return (
    <AICodePreview 
      code={code}
      componentName={componentName}
      showCode={true} // Show the generated code
      showPreview={true} // Show the live preview
      className="w-full"
    />
  );
};

export default AIGeneratedCodePreview;
