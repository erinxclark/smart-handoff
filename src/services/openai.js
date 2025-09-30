import axios from 'axios';
import { detectComponentPattern } from '../utils/componentDetector';
import { generateImageJSX } from '../utils/imageHandler';
import { mapToComponentLibrary } from '../utils/componentMapper';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

console.log('OpenAI API Key loaded:', OPENAI_API_KEY ? 'Yes' : 'No');

if (!OPENAI_API_KEY) {
  console.warn('⚠️ OpenAI API key is not set. Please set REACT_APP_OPENAI_API_KEY in your .env file');
}

/**
 * Generates component-specific generation rules based on detected component type
 */
function getComponentSpecificRules(componentType) {
  const rules = {
    button: `
- Use semantic <button> element or <div> with role="button"
- Include onClick handler placeholder: onClick={() => {}}
- Add proper ARIA attributes: aria-label if no visible text
- Include hover and focus states in comments
- Use cursor: 'pointer' style
- Component name should end with 'Button' (e.g., SubmitButton, PrimaryButton)
- Include disabled state consideration in comments`,

    input: `
- Use semantic <input> element
- Include type attribute based on context (text, email, password, etc.)
- Add placeholder attribute if placeholder text exists
- Include proper ARIA attributes: aria-label, aria-describedby
- Add onChange handler placeholder: onChange={(e) => {}}
- Include validation states in comments (error, success)
- Component name should end with 'Input' (e.g., EmailInput, PasswordInput)
- Add focus and blur handlers in comments`,

    card: `
- Use semantic structure with proper heading hierarchy
- Include <div> or <article> element for card container
- Add proper ARIA attributes: role="article" or role="group"
- Consider clickable card with role="button" if interactive
- Include card header, body, and footer sections if applicable
- Component name should end with 'Card' (e.g., UserCard, ProductCard)
- Add hover and focus states for interactive cards`,

    badge: `
- Use semantic <span> or <div> element
- Add role="status" or aria-label for screen readers
- Include appropriate color coding for different states
- Component name should end with 'Badge' (e.g., StatusBadge, CategoryBadge)
- Consider size variants (small, medium, large)
- Add proper contrast ratios for accessibility`,

    avatar: `
- Use semantic <img> element with proper alt text
- Include fallback for missing images with initials
- Add proper ARIA attributes: aria-label
- Consider different sizes (small, medium, large)
- Component name should end with 'Avatar' (e.g., UserAvatar, ProfileAvatar)
- Include loading state consideration
- Use object-fit: cover for proper image scaling`,

    container: `
- Use semantic container elements (<section>, <div>, <main>)
- Add proper ARIA landmarks: role="main", role="complementary", etc.
- Consider responsive breakpoints in comments
- Include proper spacing and layout considerations
- Component name should reflect purpose (e.g., MainContainer, SidebarContainer)
- Add proper semantic structure for content hierarchy`,

    unknown: `
- Use most appropriate semantic HTML element
- Follow general accessibility best practices
- Add proper ARIA attributes as needed
- Consider the element's purpose and context
- Include proper semantic structure`
  };

  return rules[componentType] || rules.unknown;
}

export const generateSpecAndCode = async (figmaNode, selectedLibrary = 'none') => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  // Detect component pattern and handle images
  const componentDetection = detectComponentPattern(figmaNode);
  console.log('Component Detection Result:', componentDetection);

  // Auto-detect if we should use library components
  const shouldAutoUseLibrary = componentDetection.confidence >= 70 && 
                               componentDetection.componentType !== 'unknown' && 
                               componentDetection.componentType !== 'container';
  
  // Use auto-detected library or user selection
  const effectiveLibrary = shouldAutoUseLibrary && selectedLibrary === 'none' 
    ? componentDetection.suggestedLibrary 
    : selectedLibrary;
  
  console.log('Component Detection:', componentDetection);
  console.log('Should Auto-Use Library:', shouldAutoUseLibrary);
  console.log('Effective Library:', effectiveLibrary);

  // Map to component library
  const libraryMapping = mapToComponentLibrary(componentDetection, figmaNode, effectiveLibrary);
  console.log('Component Library Mapping:', libraryMapping);

  // Check for images in the Figma node
  const hasImages = figmaNode.fills && figmaNode.fills.some(fill => fill.type === 'IMAGE');
  let imageHandling = '';
  if (hasImages) {
    const imageJSX = generateImageJSX(figmaNode, 'Component');
    imageHandling = `\n\nIMAGE HANDLING REQUIRED:
- This component contains images that need special handling
- Use placeholder images with data-placeholder="true" attribute
- Include comments for manual image replacement
- Example: ${imageJSX.jsx}
- Comments to include: ${imageJSX.comments.join('\n')}`;
  }

  // Component library information
  let libraryInfo = '';
  if (libraryMapping.usesLibrary) {
    const autoDetected = shouldAutoUseLibrary && selectedLibrary === 'none';
    libraryInfo = `\n\nCOMPONENT LIBRARY INTEGRATION:
- ${autoDetected ? 'AUTO-DETECTED' : 'USER-SELECTED'} ${effectiveLibrary.toUpperCase()} component library
- Required imports: ${libraryMapping.imports.join(', ')}
- Generated component code: ${libraryMapping.code}
- This replaces the generic div approach with proper component library patterns
- ${autoDetected ? 'Automatically chose library based on high confidence detection' : 'Using user-selected library'}`;
  }

  const prompt = `You are a React expert. Given the following Figma design specifications, create:

COMPONENT ANALYSIS:
- Detected Component Type: ${componentDetection.componentType}
- Confidence: ${componentDetection.confidence}%
- Reasoning: ${componentDetection.reasoning}
- Suggested Library: ${componentDetection.suggestedLibrary}

1. A detailed **design specification** document that includes:
   - Exact measurements (in pixels)
   - Colors (in hex or rgba)
   - Typography details
   - Layout structure
   - Any interactive states or behaviors
   - Component type and recommended usage patterns

2. A modern **React component** that:
   - Uses TypeScript-like prop types with JSDoc comments
   - Implements all styles using inline styles
   - Uses modern React patterns (hooks, proper state management)
   - Includes proper accessibility attributes
   - Has clear component composition
   - Uses semantic HTML
   - Is responsive where needed
   - Has no framework dependencies
   - Follows component-specific best practices based on detected type${imageHandling}${libraryInfo}

COMPONENT-SPECIFIC GENERATION RULES:
${getComponentSpecificRules(componentDetection.componentType)}

CRITICAL - MUST FOLLOW THESE RULES:
⚠️ ROOT ELEMENT POSITIONING - CRITICAL FOR VISIBILITY:
- The outermost/root div must NEVER have position: 'absolute', left, top, right, bottom, or transform
- The root element must start at (0,0) in the preview window - ignore Figma canvas coordinates
- Only child elements should use position: 'absolute' with calculated relative positions

1. Use HARDCODED LITERAL VALUES for all dimensions - DO NOT use variables or template literals like \`\${width}px\`
2. Extract the exact pixel values from the Figma JSON and hardcode them directly in your styles
3. Example: width: '200px', NOT width: \`\${width}px\` or width: width + 'px'
4. If absoluteBoundingBox.width is 320, use width: '320px' directly in your styles
5. All dimensions must be explicitly defined with numeric values - no variables, no calculations
6. Use the exact colors from fills[] array in the Figma data (in hex format)
7. Include all necessary dimensions: width, height, padding, etc.
8. Make sure every element has explicit width and height values
9. ONLY CREATE TEXT ELEMENTS IF THEY EXIST IN THE FIGMA DATA - don't add placeholder text elements
10. Look for "strokeWeight" or "strokes" in the Figma JSON and include border styles if they exist
11. DO NOT INVENT OR HALLUCINATE ELEMENTS - only create elements that are explicitly in the Figma data
12. For each element in your React component, comment which Figma node it corresponds to
13. NO JSDoc comments or @typedef - these break React Live rendering
14. Use proper JSX syntax - all style objects must be properly formatted
15. Ensure all JSX attributes are complete and properly closed
16. NO incomplete template literals or malformed style objects
17. CRITICAL POSITIONING RULES - ROOT ELEMENT MUST BE VISIBLE:
    - ROOT ELEMENT: MUST use position: 'relative' or omit position entirely (defaults to static)
    - ROOT ELEMENT: NEVER use position: 'absolute' on the outermost/parent element
    - ROOT ELEMENT: NEVER include left, top, right, bottom, or transform properties
    - ROOT ELEMENT: Must start at (0, 0) in the preview window - NO positional offsets
    - CHILD ELEMENTS: Use position: 'absolute' with coordinates relative to parent
    - CHILD POSITIONING: childLeft = figmaChild.x - figmaParent.x, childTop = figmaChild.y - figmaParent.y
    - IGNORE FIGMA CANVAS COORDINATES: Strip artboard x,y coordinates for the root element
    - Use zIndex to maintain stacking order (higher elements = higher zIndex)
    - Maintain parent-child relationships from Figma structure
    - Don't flatten the component hierarchy
    - For nested elements, calculate relative positioning from parent's absoluteBoundingBox
    - If an element has children, it should be the parent container with position: 'relative'
    - If an element is a child, it should have position: 'absolute' with calculated left/top
    - DEBUG CHECK: Root div must have NO left, top, position: 'absolute', or transform properties

The component should follow modern React patterns with proper positioning and component-specific best practices like this:

COMPONENT-SPECIFIC EXAMPLES:

BUTTON EXAMPLE:
\`\`\`jsx
const SubmitButton = () => {
  return (
    // Corresponds to Figma node with id: "1:2"
    // ROOT ELEMENT: NO position, NO left, NO top - starts at (0,0)
    <button 
      style={{
        width: '120px',  // From absoluteBoundingBox.width
        height: '40px',  // From absoluteBoundingBox.height
        backgroundColor: '#3b82f6',  // From fills[0].color
        borderRadius: '8px',  // From cornerRadius
        border: 'none',
        cursor: 'pointer'
        // NO position, NO left, NO top, NO transform
      }}
      onClick={() => {}}
      aria-label="Submit form"
    >
      Submit
    </button>
  );
};
\`\`\`

INPUT EXAMPLE:
\`\`\`jsx
const EmailInput = () => {
  return (
    // Corresponds to Figma node with id: "1:2"
    // ROOT ELEMENT: NO position, NO left, NO top - starts at (0,0)
    <input
      type="email"
      placeholder="Enter your email"
      style={{
        width: '250px',  // From absoluteBoundingBox.width
        height: '40px',  // From absoluteBoundingBox.height
        backgroundColor: '#ffffff',  // From fills[0].color
        border: '1px solid #d1d5db',  // From strokes[0]
        borderRadius: '4px',  // From cornerRadius
        padding: '0 12px'
        // NO position, NO left, NO top, NO transform
      }}
      onChange={(e) => {}}
      aria-label="Email address"
    />
  );
};
\`\`\`

GENERIC ELEMENT:
\`\`\`jsx
const Rectangle = () => {
  return (
    // Corresponds to Figma node with id: "1:2"
    // ROOT ELEMENT: NO position, NO left, NO top - starts at (0,0)
    <div style={{
      width: '477px',  // From absoluteBoundingBox.width
      height: '297px',  // From absoluteBoundingBox.height
      backgroundColor: '#44b24f',  // From fills[0].color
      borderRadius: '15px',  // From cornerRadius
      border: '13px solid #000000'  // From strokes[0]
      // NO position, NO left, NO top, NO transform
    }}>
    </div>
  );
};
\`\`\`

MULTI-ELEMENT WITH POSITIONING:
\`\`\`jsx
const ComplexComponent = () => {
  return (
    // ROOT ELEMENT - Corresponds to Figma node with id: "1:2"
    // CRITICAL: NO position, NO left, NO top - starts at (0,0) in preview
    <div style={{
      width: '477px',  // From absoluteBoundingBox.width
      height: '297px',  // From absoluteBoundingBox.height
      backgroundColor: '#44b24f'  // From fills[0].color
      // NO position, NO left, NO top, NO transform - MUST be visible at (0,0)
    }}>
      {/* Child element - Corresponds to Figma node with id: "1:3" */}
      {/* Calculate relative position: child.x - parent.x, child.y - parent.y */}
      <div style={{
        position: 'absolute',
        left: '50px',   // Calculated: child.x(150) - parent.x(100) = 50px
        top: '25px',    // Calculated: child.y(125) - parent.y(100) = 25px
        width: '200px',  // From absoluteBoundingBox.width
        height: '100px',  // From absoluteBoundingBox.height
        backgroundColor: '#808080',  // From fills[0].color
        zIndex: 1  // Higher than parent
      }}>
      </div>
    </div>
  );
};
\`\`\`

Respond in this format:

---
📝 Design Specification:
<your detailed spec here>

---
⚛️ React Code:
\`\`\`jsx
<your component code here>
\`\`\`

Figma Node:
${JSON.stringify(figmaNode, null, 2)}
`;

  try {
    console.log('Making OpenAI API request...');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful design-to-code assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('OpenAI API response:', response.status);
    const output = response.data.choices[0].message.content;
    return output;
  } catch (error) {
    console.error('❌ Error calling OpenAI:', error.response?.data || error.message);
    throw error;
  }
};
