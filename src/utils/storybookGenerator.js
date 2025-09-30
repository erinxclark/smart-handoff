/**
 * Storybook Story Generator
 * 
 * Generates Storybook CSF 3.0 format story files for components
 * based on detected component types and generated code.
 */

/**
 * Generate a Storybook story file for a component
 * @param {string} componentCode - The generated React component code
 * @param {string} componentName - Name of the component
 * @param {Object} detectionInfo - Component detection results
 * @returns {string} Complete story file content
 */
export function generateStorybookStory(componentCode, componentName, detectionInfo) {
  const { componentType, confidence } = detectionInfo || {};
  
  // Extract component name from code if not provided
  const extractedName = extractComponentName(componentCode) || componentName || 'GeneratedComponent';
  
  // Generate the story file content
  const storyContent = generateStoryTemplate(extractedName, componentType, confidence);
  
  return storyContent;
}

/**
 * Extract component name from React code
 * @param {string} code - React component code
 * @returns {string|null} Component name
 */
function extractComponentName(code) {
  // Look for const ComponentName = () => or function ComponentName()
  const constMatch = code.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=/);
  if (constMatch) return constMatch[1];
  
  const functionMatch = code.match(/function\s+([A-Z][a-zA-Z0-9]*)\s*\(/);
  if (functionMatch) return functionMatch[1];
  
  // Look for export default ComponentName
  const exportMatch = code.match(/export\s+default\s+([A-Z][a-zA-Z0-9]*)/);
  if (exportMatch) return exportMatch[1];
  
  return null;
}

/**
 * Generate the complete story file template
 * @param {string} componentName - Name of the component
 * @param {string} componentType - Detected component type
 * @param {number} confidence - Detection confidence score
 * @returns {string} Complete story file content
 */
function generateStoryTemplate(componentName, componentType, confidence) {
  const importStatement = `import ${componentName} from './${componentName}';`;
  
  const metaTemplate = `export default {
  title: 'Generated/${componentName}',
  component: ${componentName},
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Auto-generated component from Figma design${confidence ? ` (${componentType}, ${confidence}% confidence)` : ''}',
      },
    },
  },
};`;

  // Generate stories based on component type
  const stories = generateStoriesByType(componentName, componentType);
  
  return `${importStatement}

${metaTemplate}

${stories}`;
}

/**
 * Generate story variants based on component type
 * @param {string} componentName - Name of the component
 * @param {string} componentType - Detected component type
 * @returns {string} Story variants
 */
function generateStoriesByType(componentName, componentType) {
  switch (componentType) {
    case 'button':
      return generateButtonStories(componentName);
    case 'card':
      return generateCardStories(componentName);
    case 'input':
      return generateInputStories(componentName);
    case 'badge':
      return generateBadgeStories(componentName);
    case 'avatar':
      return generateAvatarStories(componentName);
    default:
      return generateDefaultStories(componentName);
  }
}

/**
 * Generate button-specific story variants
 */
function generateButtonStories(componentName) {
  return `export const Default = {
  args: {},
};

export const Primary = {
  args: {
    variant: 'default',
  },
};

export const Secondary = {
  args: {
    variant: 'secondary',
  },
};

export const Disabled = {
  args: {
    disabled: true,
  },
};

export const Large = {
  args: {
    size: 'lg',
  },
};

export const Small = {
  args: {
    size: 'sm',
  },
};`;
}

/**
 * Generate card-specific story variants
 */
function generateCardStories(componentName) {
  return `export const Default = {
  args: {},
};

export const WithContent = {
  args: {},
  render: (args) => (
    <${componentName} {...args}>
      <h3>Card Title</h3>
      <p>This is card content with some text to demonstrate the layout.</p>
      <button>Action Button</button>
    </${componentName}>
  ),
};

export const Empty = {
  args: {},
  render: (args) => (
    <${componentName} {...args}>
      {/* Empty card */}
    </${componentName}>
  ),
};`;
}

/**
 * Generate input-specific story variants
 */
function generateInputStories(componentName) {
  return `export const Default = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithValue = {
  args: {
    value: 'Sample text',
  },
};

export const Error = {
  args: {
    placeholder: 'Enter text...',
    error: true,
  },
};

export const Disabled = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};`;
}

/**
 * Generate badge-specific story variants
 */
function generateBadgeStories(componentName) {
  return `export const Default = {
  args: {
    children: 'Badge',
  },
};

export const Primary = {
  args: {
    children: 'Primary',
    variant: 'default',
  },
};

export const Secondary = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Destructive = {
  args: {
    children: 'Error',
    variant: 'destructive',
  },
};

export const Outline = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};`;
}

/**
 * Generate avatar-specific story variants
 */
function generateAvatarStories(componentName) {
  return `export const Default = {
  args: {},
};

export const WithImage = {
  args: {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    alt: 'User avatar',
  },
};

export const WithFallback = {
  args: {
    fallback: 'JD',
  },
};

export const Large = {
  args: {
    size: 'lg',
    fallback: 'JD',
  },
};

export const Small = {
  args: {
    size: 'sm',
    fallback: 'JD',
  },
};`;
}

/**
 * Generate default story variants for unknown/container components
 */
function generateDefaultStories(componentName) {
  return `export const Default = {
  args: {},
};

export const WithContent = {
  args: {},
  render: (args) => (
    <${componentName} {...args}>
      <div>Sample content</div>
    </${componentName}>
  ),
};`;
}

/**
 * Generate a filename for the story file
 * @param {string} componentName - Name of the component
 * @returns {string} Filename with .stories.js extension
 */
export function generateStoryFilename(componentName) {
  const extractedName = componentName || 'GeneratedComponent';
  return `${extractedName}.stories.js`;
}

/**
 * Validate if the generated story content is valid
 * @param {string} storyContent - Generated story content
 * @returns {boolean} Whether the content is valid
 */
export function validateStoryContent(storyContent) {
  // Basic validation checks
  const hasImport = storyContent.includes('import ');
  const hasDefaultExport = storyContent.includes('export default');
  const hasStoryExport = storyContent.includes('export const');
  
  return hasImport && hasDefaultExport && hasStoryExport;
}
