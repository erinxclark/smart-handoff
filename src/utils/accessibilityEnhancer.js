/**
 * Accessibility Enhancer
 * 
 * Automatically generates proper ARIA attributes, semantic HTML, and keyboard navigation
 * for all components based on their detected type and context.
 */

/**
 * Main function to enhance component code with accessibility features
 * @param {string} componentCode - Generated React JSX code
 * @param {Object} componentDetection - Component detection results
 * @param {Object} figmaNode - Original Figma node data
 * @returns {Object} Enhanced code and accessibility report
 */
export function enhanceWithAccessibility(componentCode, componentDetection, figmaNode) {
  if (!componentCode || !componentDetection) {
    return {
      enhancedCode: componentCode,
      accessibilityReport: {
        score: 0,
        issues: ['Missing component data'],
        improvements: []
      }
    };
  }

  console.log('🔧 ACCESSIBILITY: Starting enhancement for', componentDetection.componentType);

  let enhancedCode = componentCode;
  const accessibilityReport = {
    score: 100,
    issues: [],
    improvements: [],
    warnings: [],
    semanticHTML: false,
    ariaLabels: false,
    keyboardAccessible: false,
    colorContrast: null
  };

  try {
    // Step 1: Convert to semantic HTML
    enhancedCode = convertToSemanticHTML(enhancedCode, componentDetection.componentType, figmaNode);
    accessibilityReport.semanticHTML = true;
    accessibilityReport.improvements.push('Converted to semantic HTML');

    // Step 2: Add component-specific accessibility features
    enhancedCode = addComponentSpecificAccessibility(enhancedCode, componentDetection, figmaNode);
    accessibilityReport.ariaLabels = true;
    accessibilityReport.improvements.push('Added ARIA attributes');

    // Step 3: Add keyboard accessibility
    enhancedCode = addKeyboardAccessibility(enhancedCode, componentDetection);
    accessibilityReport.keyboardAccessible = true;
    accessibilityReport.improvements.push('Added keyboard navigation');

    // Step 4: Check color contrast
    const contrastCheck = checkColorContrast(figmaNode);
    if (contrastCheck) {
      accessibilityReport.colorContrast = contrastCheck;
      if (!contrastCheck.meetsAA) {
        accessibilityReport.warnings.push(contrastCheck.warning);
        accessibilityReport.score -= 15;
      }
    }

    // Step 5: Validate accessibility
    const validation = validateAccessibility(enhancedCode, componentDetection);
    accessibilityReport.issues = validation.issues;
    accessibilityReport.score = Math.max(0, accessibilityReport.score - validation.issues.length * 5);

    console.log('✅ ACCESSIBILITY: Enhancement complete, score:', accessibilityReport.score);

  } catch (error) {
    console.error('❌ ACCESSIBILITY: Error during enhancement:', error);
    accessibilityReport.issues.push('Enhancement failed: ' + error.message);
    accessibilityReport.score = 0;
  }

  return {
    enhancedCode,
    accessibilityReport
  };
}

/**
 * Convert generic divs to semantic HTML elements
 */
function convertToSemanticHTML(jsxCode, componentType, figmaNode) {
  let semanticCode = jsxCode;

  switch (componentType) {
    case 'button':
      // Convert div to button element
      semanticCode = semanticCode.replace(
        /<div(\s+style=\{[^}]*\})[^>]*>([^<]*)<\/div>/,
        (match, styleAttr, content) => {
          // Check if it's actually a button (has interactive styling or text)
          const hasButtonStyling = styleAttr.includes('cursor') || 
                                   styleAttr.includes('backgroundColor') ||
                                   styleAttr.includes('border');
          
          if (hasButtonStyling || content.trim()) {
            return `<button type="button"${styleAttr}>${content}</button>`;
          }
          return match;
        }
      );
      break;

    case 'input':
      // Convert div to input element with proper structure
      semanticCode = semanticCode.replace(
        /<div(\s+style=\{[^}]*\})[^>]*>([^<]*)<\/div>/,
        (match, styleAttr, placeholder) => {
          const inputType = determineInputType(figmaNode, placeholder);
          const componentName = figmaNode.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'input';
          const inputId = `input-${componentName}`;
          
          return `
            <div>
              <label htmlFor="${inputId}" style={{ display: 'none' }}>${placeholder || 'Input field'}</label>
              <input 
                id="${inputId}"
                type="${inputType}"
                placeholder="${placeholder || ''}"
                ${styleAttr}
                aria-describedby="${inputId}-helper"
              />
              <span id="${inputId}-helper" style={{ display: 'none' }}>Enter your ${placeholder || 'value'}</span>
            </div>
          `;
        }
      );
      break;

    case 'card':
      // Convert div to article element
      semanticCode = semanticCode.replace(
        /^<div(\s+style=\{[^}]*\})/,
        '<article$1 role="article"'
      ).replace(
        /<\/div>$/, 
        '</article>'
      );
      break;

    case 'navigation':
      // Convert div to nav element
      semanticCode = semanticCode.replace(
        /^<div(\s+style=\{[^}]*\})/,
        '<nav$1 role="navigation" aria-label="Main navigation"'
      ).replace(
        /<\/div>$/, 
        '</nav>'
      );
      break;

    case 'avatar':
    case 'image':
      // Ensure images have proper alt attributes
      semanticCode = semanticCode.replace(
        /<img([^>]*)\/>/g,
        (match, attributes) => {
          if (!attributes.includes('alt=')) {
            return `<img${attributes} alt="User profile picture" />`;
          }
          return match;
        }
      );
      break;

    default:
      // For containers, add role if it seems like a section
      if (figmaNode.name && (figmaNode.name.toLowerCase().includes('section') || 
                             figmaNode.name.toLowerCase().includes('container'))) {
        semanticCode = semanticCode.replace(
          /^<div(\s+style=\{[^}]*\})/,
          '<section$1 role="region"'
        ).replace(
          /<\/div>$/, 
          '</section>'
        );
      }
      break;
  }

  return semanticCode;
}

/**
 * Add component-specific accessibility attributes
 */
function addComponentSpecificAccessibility(jsxCode, componentDetection, figmaNode) {
  let enhancedCode = jsxCode;

  switch (componentDetection.componentType) {
    case 'button':
      enhancedCode = addButtonAccessibility(enhancedCode, figmaNode);
      break;
    
    case 'input':
      enhancedCode = addInputAccessibility(enhancedCode, figmaNode);
      break;
    
    case 'card':
      enhancedCode = addCardAccessibility(enhancedCode, figmaNode);
      break;
    
    case 'avatar':
    case 'image':
      enhancedCode = addImageAccessibility(enhancedCode, figmaNode);
      break;
    
    case 'navigation':
      enhancedCode = addNavigationAccessibility(enhancedCode, figmaNode);
      break;
  }

  return enhancedCode;
}

/**
 * Add button-specific accessibility features
 */
function addButtonAccessibility(jsxCode, figmaNode) {
  let enhancedCode = jsxCode;

  // Extract button text from Figma node
  const buttonText = extractButtonText(figmaNode);
  const componentName = figmaNode.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'button';

  // Add aria-label for icon-only buttons or unclear text
  if (!buttonText || buttonText.length < 2) {
    const inferredLabel = inferButtonLabel(figmaNode.name);
    enhancedCode = enhancedCode.replace(
      /<button([^>]*)>/,
      `<button$1 aria-label="${inferredLabel}">`
    );
  }

  // Ensure type="button" is present
  if (!enhancedCode.includes('type=')) {
    enhancedCode = enhancedCode.replace(
      /<button([^>]*)>/,
      '<button type="button"$1>'
    );
  }

  return enhancedCode;
}

/**
 * Add input-specific accessibility features
 */
function addInputAccessibility(jsxCode, figmaNode) {
  let enhancedCode = jsxCode;
  const componentName = figmaNode.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'input';

  // Add aria-required if name suggests it's required
  const isRequired = figmaNode.name?.toLowerCase().includes('required') || 
                     figmaNode.name?.toLowerCase().includes('mandatory');
  
  if (isRequired) {
    enhancedCode = enhancedCode.replace(
      /<input([^>]*)/,
      '<input aria-required="true"$1'
    );
  }

  // Add aria-invalid placeholder for error states
  if (figmaNode.name?.toLowerCase().includes('error') || 
      figmaNode.name?.toLowerCase().includes('invalid')) {
    enhancedCode = enhancedCode.replace(
      /<input([^>]*)/,
      '<input aria-invalid="true"$1'
    );
  }

  return enhancedCode;
}

/**
 * Add card-specific accessibility features
 */
function addCardAccessibility(jsxCode, figmaNode) {
  let enhancedCode = jsxCode;

  // Look for text that should be a heading
  const headingText = extractHeadingText(figmaNode);
  if (headingText) {
    // Convert text to proper heading
    enhancedCode = enhancedCode.replace(
      new RegExp(`>${headingText}<`, 'g'),
      `><h2>${headingText}</h2><`
    );
  }

  return enhancedCode;
}

/**
 * Add image/avatar-specific accessibility features
 */
function addImageAccessibility(jsxCode, figmaNode) {
  let enhancedCode = jsxCode;

  // Generate descriptive alt text based on context
  const altText = generateAltText(figmaNode);
  
  enhancedCode = enhancedCode.replace(
    /alt="[^"]*"/g,
    `alt="${altText}"`
  );

  // If no alt attribute exists, add one
  if (!enhancedCode.includes('alt=')) {
    enhancedCode = enhancedCode.replace(
      /<img([^>]*)\/>/g,
      `<img$1 alt="${altText}" />`
    );
  }

  return enhancedCode;
}

/**
 * Add navigation-specific accessibility features
 */
function addNavigationAccessibility(jsxCode, figmaNode) {
  let enhancedCode = jsxCode;

  // Add aria-label if not present
  if (!enhancedCode.includes('aria-label=')) {
    enhancedCode = enhancedCode.replace(
      /<nav([^>]*)>/,
      '<nav$1 aria-label="Main navigation">'
    );
  }

  return enhancedCode;
}

/**
 * Add keyboard accessibility support
 */
function addKeyboardAccessibility(jsxCode, componentDetection) {
  let enhancedCode = jsxCode;

  // Add keyboard support for custom interactive elements
  if (componentDetection.componentType === 'button' || 
      componentDetection.componentType === 'navigation') {
    
    // Add tabIndex and keyboard handlers for divs that should be interactive
    enhancedCode = enhancedCode.replace(
      /<div(\s+style=\{[^}]*cursor:\s*['"]pointer['"][^}]*\})/g,
      '<div$1 tabIndex="0" onKeyPress={(e) => e.key === \'Enter\' || e.key === \' \' ? handleClick() : null}'
    );

    // Add focus styles
    enhancedCode = enhancedCode.replace(
      /style=\{\{([^}]*)\}\}/g,
      (match, styles) => {
        if (styles.includes('cursor:') && !styles.includes('outline:')) {
          return `style={{${styles}, outline: '2px solid #3b82f6', outlineOffset: '2px'}}`;
        }
        return match;
      }
    );
  }

  return enhancedCode;
}

/**
 * Check color contrast between text and background
 */
export function checkColorContrast(figmaNode) {
  if (!figmaNode || !figmaNode.fills) {
    return null;
  }

  // Extract text color
  const textFill = figmaNode.fills.find(fill => fill.type === 'SOLID');
  const textColor = textFill?.color;

  // Try to find background color from parent or sibling
  let bgColor = null;
  if (figmaNode.parent && figmaNode.parent.fills) {
    const bgFill = figmaNode.parent.fills.find(fill => fill.type === 'SOLID');
    bgColor = bgFill?.color;
  }

  if (!textColor || !bgColor) {
    return null;
  }

  const contrastRatio = calculateContrastRatio(textColor, bgColor);
  
  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  const meetsAA = contrastRatio >= 4.5;
  const meetsAAA = contrastRatio >= 7;
  
  return {
    ratio: contrastRatio.toFixed(2),
    meetsAA,
    meetsAAA,
    textColor: rgbToHex(textColor),
    backgroundColor: rgbToHex(bgColor),
    warning: !meetsAA ? `Contrast ratio ${contrastRatio.toFixed(2)}:1 fails WCAG AA (needs 4.5:1)` : null
  };
}

/**
 * Calculate contrast ratio between two colors
 */
function calculateContrastRatio(color1, color2) {
  const L1 = getRelativeLuminance(color1);
  const L2 = getRelativeLuminance(color2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 */
function getRelativeLuminance(color) {
  const { r, g, b } = color;
  
  // Convert to linear RGB
  const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Convert RGB color to hex
 */
function rgbToHex(color) {
  const { r, g, b } = color;
  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Validate accessibility of enhanced code
 */
function validateAccessibility(jsxCode, componentDetection) {
  const issues = [];

  // Check for semantic HTML
  if (componentDetection.componentType === 'button' && !jsxCode.includes('<button')) {
    issues.push('Button should use <button> element');
  }

  if (componentDetection.componentType === 'input' && !jsxCode.includes('<input')) {
    issues.push('Input should use <input> element');
  }

  // Check for ARIA attributes
  if (componentDetection.componentType === 'button' && !jsxCode.includes('aria-')) {
    issues.push('Interactive elements should have ARIA attributes');
  }

  // Check for keyboard accessibility
  if (jsxCode.includes('cursor:') && !jsxCode.includes('tabIndex') && !jsxCode.includes('<button')) {
    issues.push('Interactive elements should have keyboard support');
  }

  return { issues };
}

// Helper functions

function extractButtonText(figmaNode) {
  // Look for text content in the node
  if (figmaNode.characters) {
    return figmaNode.characters;
  }
  
  // Look in children
  if (figmaNode.children) {
    const textChild = figmaNode.children.find(child => child.type === 'TEXT');
    if (textChild && textChild.characters) {
      return textChild.characters;
    }
  }
  
  return null;
}

function inferButtonLabel(nodeName) {
  if (!nodeName) return 'Button';
  
  const name = nodeName.toLowerCase();
  
  if (name.includes('close')) return 'Close';
  if (name.includes('submit')) return 'Submit form';
  if (name.includes('cancel')) return 'Cancel';
  if (name.includes('save')) return 'Save';
  if (name.includes('delete')) return 'Delete';
  if (name.includes('edit')) return 'Edit';
  if (name.includes('add')) return 'Add';
  if (name.includes('remove')) return 'Remove';
  
  return 'Button';
}

function extractHeadingText(figmaNode) {
  // Look for text that appears to be a heading
  if (figmaNode.characters && figmaNode.characters.length < 50) {
    return figmaNode.characters;
  }
  
  if (figmaNode.children) {
    const textChild = figmaNode.children.find(child => 
      child.type === 'TEXT' && child.characters && child.characters.length < 50
    );
    if (textChild) {
      return textChild.characters;
    }
  }
  
  return null;
}

function generateAltText(figmaNode) {
  const name = figmaNode.name?.toLowerCase() || '';
  
  if (name.includes('avatar')) return 'User profile picture';
  if (name.includes('logo')) return 'Company logo';
  if (name.includes('icon')) return 'Icon';
  if (name.includes('photo')) return 'Photo';
  if (name.includes('image')) return 'Image';
  
  return 'Image';
}

function determineInputType(figmaNode, placeholder) {
  const name = figmaNode.name?.toLowerCase() || '';
  const placeholderLower = placeholder?.toLowerCase() || '';
  
  if (name.includes('email') || placeholderLower.includes('email')) return 'email';
  if (name.includes('password') || placeholderLower.includes('password')) return 'password';
  if (name.includes('phone') || placeholderLower.includes('phone')) return 'tel';
  if (name.includes('number') || placeholderLower.includes('number')) return 'number';
  if (name.includes('search') || placeholderLower.includes('search')) return 'search';
  if (name.includes('url') || placeholderLower.includes('url')) return 'url';
  
  return 'text';
}
