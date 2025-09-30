import axios from 'axios';
import { detectComponentPattern } from '../utils/componentDetector';
import { generateImageJSX } from '../utils/imageHandler';
import { mapToComponentLibrary } from '../utils/componentMapper';
import { checkColorContrast } from '../utils/accessibilityEnhancer';

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
- Use semantic <button> element
- DO NOT include any event handlers (onClick, onSubmit, etc.)
- Add proper ARIA attributes: aria-label if no visible text
- Use cursor: 'pointer' style
- Component name should end with 'Button' (e.g., SubmitButton, PrimaryButton)
- This is a preview component - no interactivity needed`,

    input: `
- Use semantic <input> element
- Include type attribute based on context (text, email, password, etc.)
- Add placeholder attribute if placeholder text exists
- Include proper ARIA attributes: aria-label, aria-describedby
- DO NOT include any event handlers (onChange, onFocus, onBlur, etc.)
- Component name should end with 'Input' (e.g., EmailInput, PasswordInput)
- This is a preview component - no interactivity needed`,

    card: `
- Use semantic structure with proper heading hierarchy
- Include <div> or <article> element for card container
- Add proper ARIA attributes: role="article" or role="group"
- DO NOT include any event handlers or interactive behaviors
- Include card header, body, and footer sections if applicable
- Component name should end with 'Card' (e.g., UserCard, ProductCard)
- This is a preview component - no interactivity needed`,

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

  // Validate input
  if (!figmaNode || !figmaNode.absoluteBoundingBox) {
    throw new Error('Invalid Figma node data - missing positioning information');
  }
  
  // Create safe defaults for missing data
  const safeNode = {
    ...figmaNode,
    fills: figmaNode.fills || [],
    strokes: figmaNode.strokes || [],
    effects: figmaNode.effects || [],
    children: figmaNode.children || [],
    cornerRadius: figmaNode.cornerRadius || 0
  };
  
  console.log('Generating code with safe node data');

  // Log positioning data being sent to AI
  console.log('Node positioning data:', {
    x: safeNode.absoluteBoundingBox?.x,
    y: safeNode.absoluteBoundingBox?.y,
    width: safeNode.absoluteBoundingBox?.width,
    height: safeNode.absoluteBoundingBox?.height,
    children: safeNode.children?.map(child => ({
      name: child.name,
      x: child.absoluteBoundingBox?.x,
      y: child.absoluteBoundingBox?.y,
      width: child.absoluteBoundingBox?.width,
      height: child.absoluteBoundingBox?.height,
      relativeX: (child.absoluteBoundingBox?.x || 0) - (safeNode.absoluteBoundingBox?.x || 0),
      relativeY: (child.absoluteBoundingBox?.y || 0) - (safeNode.absoluteBoundingBox?.y || 0)
    }))
  });

  // Detect component pattern and handle images
  const componentDetection = detectComponentPattern(safeNode);
  console.log('Component Detection Result:', componentDetection);

  // Note: Using simple exact value enforcement instead of complex alignment analysis

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
  const libraryMapping = mapToComponentLibrary(componentDetection, safeNode, effectiveLibrary);
  console.log('Component Library Mapping:', libraryMapping);

  // Check for images in the Figma node
  const hasImages = safeNode.fills && safeNode.fills.some(fill => fill.type === 'IMAGE');
  let imageHandling = '';
  if (hasImages) {
    const imageJSX = generateImageJSX(safeNode, 'Component');
    imageHandling = `\n\nIMAGE HANDLING REQUIRED:
- This component contains images that need special handling
- Use placeholder images with data-placeholder="true" attribute
- Include comments for manual image replacement
- Example: ${imageJSX.jsx}
- Comments to include: ${imageJSX.comments.join('\n')}`;
  }

  // Check color contrast for accessibility
  const contrastCheck = checkColorContrast(safeNode);
  let contrastWarning = '';
  if (contrastCheck && !contrastCheck.meetsAA) {
    contrastWarning = `\n\nCOLOR CONTRAST WARNING: ${contrastCheck.warning}`;
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

  // Note: Removed complex alignment hints in favor of simple exact value enforcement

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
   - Includes proper accessibility attributes (ARIA labels, semantic HTML)
   - Has clear component composition
   - Uses semantic HTML elements (<button>, <input>, <nav>, etc.)
   - Is responsive where needed
   - Has no framework dependencies
   - Follows component-specific best practices based on detected type
   - Includes keyboard accessibility (tabIndex only - no event handlers)
   - Has proper focus management and visual focus indicators${imageHandling}${libraryInfo}${contrastWarning}

CRITICAL CODE GENERATION RULE:
- DO NOT use props or parameters in the component function
- DO NOT use variables like {title}, {body}, {children} in JSX
- USE hardcoded content directly in JSX elements
- Component must be self-contained and render without any props being passed

WRONG (causes ReferenceError):
const CustomCard = ({ title, body }) => {
  return <article>{title}</article>  // ❌ title is undefined
}

CORRECT (works):
const CustomCard = () => {
  return <article>Card Header</article>  // ✅ hardcoded content
}

CONTENT EXTRACTION RULES:
- If Figma design has visible text, extract that exact text and hardcode it
- If no text exists, use descriptive placeholder content
- Examples:
  * Text says "Submit" → <button>Submit</button>
  * Text says "Welcome" → <h1>Welcome</h1>
  * No text → <button>Button Text</button>
  * No text → <div>Content</div>

SIMPLE COMPONENT GENERATION RULES:

1. BUTTON PATTERN (GROUP with RECTANGLE + TEXT):
   
   If node is a GROUP and has 2 children where:
   - One child is type RECTANGLE
   - One child is type TEXT
   
   Extract from children array:
   - Rectangle child: children.find(c => c.type === "RECTANGLE")
   - Text child: children.find(c => c.type === "TEXT")
   
   Generate:
   <button style={{
     position: 'relative',
     width: '[rectangle.absoluteBoundingBox.width]px',
     height: '[rectangle.absoluteBoundingBox.height]px',
     backgroundColor: '[convert rectangle.fills[0].color to hex]',
     borderRadius: '[rectangle.cornerRadius]px',
     border: 'none',
     color: '[convert text.fills[0].color to hex]',
     fontSize: '[text.style.fontSize]px',
     fontWeight: [text.style.fontWeight],
     cursor: 'pointer',
     boxShadow: '[convert rectangle.effects to CSS]'
   }}>
     [text.characters]
   </button>

2. SINGLE TEXT ELEMENT:
   
   If node is just a TEXT element:
   <div style={{
     fontSize: '[node.style.fontSize]px',
     fontWeight: [node.style.fontWeight],
     color: '[convert node.fills[0].color to hex]'
   }}>
     [node.characters]
   </div>

3. SIMPLE RECTANGLE:
   
   If node is just a RECTANGLE:
   <div style={{
     width: '[node.absoluteBoundingBox.width]px',
     height: '[node.absoluteBoundingBox.height]px',
     backgroundColor: '[convert node.fills[0].color to hex]',
     borderRadius: '[node.cornerRadius]px'
   }}></div>

4. COMPLEX STRUCTURES (FRAMES with many children):
   
   DO NOT attempt to analyze deeply.
   Generate a placeholder:
   <div style={{
     width: '[node.absoluteBoundingBox.width]px',
     height: '[node.absoluteBoundingBox.height]px',
     backgroundColor: '#FFFFFF',
     borderRadius: '12px',
     padding: '16px'
   }}>
     <!-- Complex component - requires manual implementation -->
   </div>

DO NOT:
- Try to recursively analyze nested structures
- Generate cards with fake content
- Attempt to extract from 3+ levels deep
- Make up content that doesn't exist

DO:
- Focus on simple, single-level patterns
- Use EXACT values from Figma data
- Generate working code for buttons, badges, basic elements
- Acknowledge complexity limits

This is intentionally simple. Complex nested components are out of scope.





ACCESSIBILITY REQUIREMENTS:
- Component type: ${componentDetection.componentType}
- Generate semantic HTML (use <button>, <input>, <nav>, <article>, etc.)
- Add proper ARIA attributes based on component type
- Include aria-label for icon-only or unclear components
- Use proper heading hierarchy if text is a heading

CRITICAL: NO EVENT HANDLERS
- DO NOT include any event handlers (onClick, onChange, onSubmit, onKeyPress, etc.)
- This is a preview component for React Live - event handlers cause syntax errors
- Keep aria-label and other accessibility attributes
- Use cursor: 'pointer' for buttons but no onClick handlers
- For buttons: use <button> element with type="button"
- For inputs: include <label> with htmlFor linking to input id
- For cards: use <article> element with proper heading structure
- For images: include descriptive alt text
- For navigation: use <nav> element with aria-label

COMPONENT-SPECIFIC GENERATION RULES:
${getComponentSpecificRules(componentDetection.componentType)}

CRITICAL - MUST FOLLOW THESE RULES:
⚠️ ROOT ELEMENT POSITIONING - CRITICAL FOR VISIBILITY:
- The outermost/root div must NEVER have position: 'absolute', left, top, right, bottom, or transform
- The root element must start at (0,0) in the preview window - ignore Figma canvas coordinates
- Only child elements should use position: 'absolute' with calculated relative positions

🎯 CRITICAL POSITIONING RULES - EXACT VALUES ONLY:
1. Copy EXACT pixel values from Figma JSON - DO NOT round numbers (use 211px, not 210px)
2. If two elements have the same Y coordinate in Figma, they MUST have the same top value in CSS
3. If two elements have the same X coordinate in Figma, they MUST have the same left value in CSS
4. Use the absoluteBoundingBox values EXACTLY as they appear in the JSON

EXAMPLE FROM FIGMA JSON:
element1.absoluteBoundingBox.y = 728
element2.absoluteBoundingBox.y = 728
↓
MUST GENERATE:
<div style={{ top: '728px' }}>
<div style={{ top: '728px' }}>

5. Use HARDCODED LITERAL VALUES for all dimensions - DO NOT use variables or template literals like \`\${width}px\`
6. Extract the exact pixel values from the Figma JSON and hardcode them directly in your styles
7. Example: width: '200px', NOT width: \`\${width}px\` or width: width + 'px'
8. If absoluteBoundingBox.width is 320, use width: '320px' directly in your styles
9. All dimensions must be explicitly defined with numeric values - no variables, no calculations
10. Use the exact colors from fills[] array in the Figma data (in hex format)
11. Include all necessary dimensions: width, height, padding, etc.
12. Make sure every element has explicit width and height values
13. ONLY CREATE TEXT ELEMENTS IF THEY EXIST IN THE FIGMA DATA - don't add placeholder text elements
14. Look for "strokeWeight" or "strokes" in the Figma JSON and include border styles if they exist
15. DO NOT INVENT OR HALLUCINATE ELEMENTS - only create elements that are explicitly in the Figma data
16. For each element in your React component, comment which Figma node it corresponds to
17. NO JSDoc comments or @typedef - these break React Live rendering
18. Use proper JSX syntax - all style objects must be properly formatted
19. Ensure all JSX attributes are complete and properly closed
20. NO incomplete template literals or malformed style objects
21. CRITICAL POSITIONING RULES - ROOT ELEMENT MUST BE VISIBLE:
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

CRITICAL POSITIONING RULES FOR NESTED ELEMENTS:

1. ROOT ELEMENT (outermost container):
   - MUST use position: 'relative' or omit position entirely
   - NEVER use position: 'absolute' on root
   - NEVER include left, top, right, bottom on root
   - Root starts at 0,0 in the preview

2. CHILD ELEMENTS (everything inside root):
   - MUST use position: 'absolute'
   - Calculate positions relative to parent:
     * left: childX - parentX
     * top: childY - parentY
   - Use EXACT pixel values from calculations
   - Preserve z-index for stacking order

3. EXAMPLE:
Parent at (100, 200), Child at (150, 250):

<div style={{ 
  position: 'relative',
  width: '300px', 
  height: '200px' 
}}>
  <div style={{ 
    position: 'absolute',
    left: '50px',  // 150 - 100
    top: '50px',   // 250 - 200
    width: '100px',
    height: '50px'
  }}>
  </div>
</div>

FIGMA DATA:
Parent: ${JSON.stringify(safeNode.absoluteBoundingBox)}
${safeNode.children ? `Children: ${safeNode.children.map(c => ({
  id: c.id,
  name: c.name,
  x: c.absoluteBoundingBox?.x,
  y: c.absoluteBoundingBox?.y,
  width: c.absoluteBoundingBox?.width,
  height: c.absoluteBoundingBox?.height,
  relativeX: (c.absoluteBoundingBox?.x || 0) - (safeNode.absoluteBoundingBox?.x || 0),
  relativeY: (c.absoluteBoundingBox?.y || 0) - (safeNode.absoluteBoundingBox?.y || 0)
})).map(child => JSON.stringify(child)).join('\n')}` : 'No children'}

USE THESE EXACT RELATIVE POSITIONS IN YOUR CODE.

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

Component Type: ${figmaNode.type}
Dimensions: ${figmaNode.absoluteBoundingBox?.width} x ${figmaNode.absoluteBoundingBox?.height}
Children Count: ${figmaNode.children?.length || 0}

${figmaNode.children?.length <= 2 ? `
Children Data:
${figmaNode.children.map(c => `
  - Type: ${c.type}
  - Characters: ${c.characters || 'N/A'}
  - Dimensions: ${c.absoluteBoundingBox?.width} x ${c.absoluteBoundingBox?.height}
  - Fills: ${JSON.stringify(c.fills?.[0]?.color)}
`).join('\n')}
` : 'Too many children - generate placeholder'}

Generate simple, working code following the rules above.

Figma Node (safe data only):
${JSON.stringify({
  id: safeNode.id,
  name: safeNode.name,
  type: safeNode.type,
  absoluteBoundingBox: safeNode.absoluteBoundingBox,
  fills: safeNode.fills,
  strokes: safeNode.strokes,
  effects: safeNode.effects,
  cornerRadius: safeNode.cornerRadius,
  children: safeNode.children?.map(child => ({
    id: child.id,
    name: child.name,
    type: child.type,
    characters: child.characters,  // TEXT content
    fills: child.fills,
    strokes: child.strokes,
    effects: child.effects,
    cornerRadius: child.cornerRadius,
    absoluteBoundingBox: child.absoluteBoundingBox,
    style: child.style  // TEXT style
  }))
}, null, 2)}
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
    
    // Return the AI output with component detection and Figma node data
    return {
      output: output,
      componentDetection: componentDetection,
      figmaNode: safeNode
    };
  } catch (error) {
    console.error('❌ Error calling OpenAI:', error.response?.data || error.message);
    throw error;
  }
};
