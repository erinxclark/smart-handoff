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
   - Includes keyboard accessibility (tabIndex, onKeyPress)
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

ANALYZE THE FIGMA NODE STRUCTURE CAREFULLY:

1. Look at node.type and node.children
2. If node is a GROUP with:
   - One RECTANGLE child (the visual container)
   - One TEXT child (the label)
   → This is a BUTTON component

3. Extract values from the ACTUAL children:
   
   From RECTANGLE child:
   - width: use child.absoluteBoundingBox.width + 'px'
   - height: use child.absoluteBoundingBox.height + 'px'
   - backgroundColor: convert child.fills[0].color to hex
   - borderRadius: use child.cornerRadius + 'px'
   - boxShadow: convert child.effects to CSS shadow
   
   From TEXT child:
   - Button text: use child.characters EXACTLY
   - color: convert child.fills[0].color to hex
   - fontSize: use child.style.fontSize + 'px'
   - fontWeight: use child.style.fontWeight

4. Generate ONLY a button element:

<button
  style={{
    position: 'relative',
    width: '[EXACT width from RECTANGLE]',
    height: '[EXACT height from RECTANGLE]',
    backgroundColor: '[EXACT color from RECTANGLE fills]',
    borderRadius: '[EXACT cornerRadius from RECTANGLE]',
    border: 'none',
    color: '[EXACT color from TEXT fills]',
    fontSize: '[EXACT fontSize from TEXT style]',
    fontWeight: [EXACT fontWeight from TEXT style],
    cursor: 'pointer',
    boxShadow: '[converted from RECTANGLE effects]'
  }}
>
  [EXACT characters from TEXT child]
</button>

DO NOT:
- Make up content like "Card Title" or "Card Content"
- Add h1, p, or other elements that don't exist in Figma
- Generate articles or cards for simple button structures
- Use placeholder text - use EXACT Figma data
- Ignore the children array

If you see a GROUP with RECTANGLE + TEXT children, generate a BUTTON.
If you see a FRAME with multiple complex children, then generate a card/article.

Stop overthinking this. Match the structure to what's actually in Figma.

PATTERN RECOGNITION RULES:

Analyze the Figma node structure using these patterns:

PATTERN 1: BUTTON
Identifies as: GROUP or FRAME containing RECTANGLE + TEXT
Characteristics:
- Has exactly 2 children (or RECTANGLE + TEXT among children)
- RECTANGLE child: solid fill, cornerRadius > 0, width 60-400px, height 30-80px
- TEXT child: contains actual text in "characters" field
- RECTANGLE and TEXT are roughly same size (TEXT inside RECTANGLE bounds)

Generate:
<button style={{
  width: '[RECTANGLE.width]px',
  height: '[RECTANGLE.height]px',
  backgroundColor: '[RECTANGLE.fills[0] as hex]',
  borderRadius: '[RECTANGLE.cornerRadius]px',
  border: 'none',
  color: '[TEXT.fills[0] as hex]',
  fontSize: '[TEXT.style.fontSize]px',
  fontWeight: [TEXT.style.fontWeight],
  cursor: 'pointer',
  boxShadow: '[RECTANGLE.effects to CSS]'
}}>
  [TEXT.characters]
</button>

PATTERN 2: BADGE
Identifies as: Small rounded element with text
Characteristics:
- RECTANGLE or FRAME with cornerRadius > height/3 (pill-shaped)
- Width < 150px, Height < 50px
- Has TEXT child with short text (< 15 characters)
- High cornerRadius relative to size

Generate:
<span style={{
  display: 'inline-block',
  padding: '4px 12px',
  backgroundColor: '[RECTANGLE.fills[0] as hex]',
  borderRadius: '[RECTANGLE.cornerRadius]px',
  color: '[TEXT.fills[0] as hex]',
  fontSize: '[TEXT.style.fontSize]px',
  fontWeight: [TEXT.style.fontWeight]
}}>
  [TEXT.characters]
</span>

CRITICAL EXTRACTION STEPS:

Step 1: Identify the pattern
- Count children
- Check dimensions
- Look for RECTANGLE + TEXT combination
- Calculate cornerRadius ratio

Step 2: Extract exact values from children
Rectangle child data:
  width: use child.absoluteBoundingBox.width
  height: use child.absoluteBoundingBox.height
  background: convert child.fills[0].color to hex
  cornerRadius: use child.cornerRadius
  effects: use child.effects

Text child data:
  content: use child.characters EXACTLY
  color: convert child.fills[0].color to hex
  fontSize: use child.style.fontSize
  fontWeight: use child.style.fontWeight

Step 3: Generate appropriate element
- Use <button> for PATTERN 1
- Use <span> for PATTERN 2
- Use actual extracted values, NOT placeholders

EXAMPLE INPUT (Button):
{
  type: "GROUP",
  name: "Primary Button",
  children: [
    {
      type: "RECTANGLE",
      absoluteBoundingBox: { width: 140, height: 44 },
      fills: [{ color: { r: 0.23, g: 0.51, b: 0.96 }}],
      cornerRadius: 8,
      effects: [{ type: "DROP_SHADOW", radius: 8 }]
    },
    {
      type: "TEXT",
      characters: "Submit",
      fills: [{ color: { r: 1, g: 1, b: 1 }}],
      style: { fontSize: 16, fontWeight: 600 }
    }
  ]
}

CORRECT OUTPUT:
<button style={{
  position: 'relative',
  width: '140px',
  height: '44px',
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  border: 'none',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
}}>
  Submit
</button>

WRONG OUTPUT (what you were doing):
<article>
  <h1>Card Title</h1>
  <button>Submit</button>
</article>

The key is: MATCH THE PATTERN, EXTRACT THE DATA, GENERATE THE RIGHT ELEMENT.

If it's a GROUP with RECTANGLE + TEXT, it's almost always a button or badge.
If it's a FRAME with 5+ children and complex layout, it's a card/container.

BE PRECISE. USE ACTUAL FIGMA DATA. DON'T MAKE THINGS UP.

SPECIAL HANDLING FOR FIGMA GROUPS:

When node.type === "GROUP":

1. Check if this is a "visual component GROUP":
   - Has 2 children: RECTANGLE and TEXT
   - RECTANGLE has fills (it's the visual background)
   - TEXT has characters (it's the label)
   → This is a BUTTON component wrapped in a GROUP

2. Extract visual properties from the RECTANGLE child, not the GROUP:
   - Width/Height: Use RECTANGLE child dimensions
   - Background: Use RECTANGLE child fills[0]
   - Border radius: Use RECTANGLE child cornerRadius
   - Shadow: Use RECTANGLE child effects
   
3. Extract text properties from TEXT child:
   - Content: Use TEXT child characters field
   - Color: Use TEXT child fills[0]
   - Font size: Use TEXT child style.fontSize
   - Font weight: Use TEXT child style.fontWeight

4. Generate a <button> element:
   - DO NOT create wrapper divs
   - DO NOT use the GROUP's dimensions (they might be empty/wrong)
   - USE the RECTANGLE child's dimensions and styling
   - USE the TEXT child's content and styling

EXAMPLE:

Input GROUP structure:
{
  type: "GROUP",
  name: "Primary Button",
  absoluteBoundingBox: { x: 94, y: -677, width: 140, height: 44 },
  fills: [],  // Empty - GROUP has no background!
  children: [
    {
      id: "1:21",
      type: "RECTANGLE",
      name: "Background",
      absoluteBoundingBox: { width: 140, height: 44 },
      fills: [{ color: { r: 0.23, g: 0.51, b: 0.96 }}],
      cornerRadius: 8,
      effects: [{ type: "DROP_SHADOW", radius: 8 }]
    },
    {
      id: "1:22", 
      type: "TEXT",
      name: "Submit",
      characters: "Submit",
      fills: [{ color: { r: 1, g: 1, b: 1 }}],
      style: { fontSize: 16, fontWeight: 600 }
    }
  ]
}

Correct interpretation:
"This is a button. Get styles from RECTANGLE child, text from TEXT child."

Generate:
<button style={{
  position: 'relative',
  width: '140px',  // from children[0] (RECTANGLE)
  height: '44px',  // from children[0] (RECTANGLE)
  backgroundColor: '#3b82f6',  // from children[0].fills
  borderRadius: '8px',  // from children[0].cornerRadius
  border: 'none',
  color: '#ffffff',  // from children[1].fills (TEXT)
  fontSize: '16px',  // from children[1].style.fontSize
  fontWeight: 600,  // from children[1].style.fontWeight
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'  // from children[0].effects
}}>
  Submit  // from children[1].characters
</button>

KEY INSIGHT FOR GROUPS:
The visual styling is in the CHILDREN, not the GROUP itself.
Always look at the RECTANGLE child for visual properties.
Always look at the TEXT child for content.

When node.type === "FRAME":
FRAMEs often have their own fills and properties.
Can extract styles from the FRAME itself or its children.
More straightforward.

DETECTION LOGIC:
if (node.type === "GROUP" && 
    node.children?.length === 2 &&
    node.children[0].type === "RECTANGLE" &&
    node.children[1].type === "TEXT") {
  // This is a button - extract from children
  const background = node.children[0];
  const text = node.children[1];
  // Generate button using background + text properties
}

DEEP STRUCTURE ANALYSIS:

When analyzing a component, look at ALL levels of nesting, not just immediate children.

For each child in node.children:
1. Identify what it is:
   - If child.type === "TEXT" → extract child.characters (actual text content)
   - If child.type === "RECTANGLE" alone → it's a visual element/divider
   - If child.type === "GROUP" with RECTANGLE + TEXT → it's a button (analyze recursively)
   - If child.type === "FRAME" → it's a container (analyze its children recursively)

2. Extract actual values, not placeholders:
   - TEXT elements: Use child.characters field for EXACT content
   - Nested buttons: Recursively extract RECTANGLE + TEXT pattern
   - Layouts: Preserve the hierarchy and positioning

EXAMPLE NESTED STRUCTURE:

{
  type: "FRAME",
  name: "Card",
  children: [
    {
      type: "TEXT",
      name: "Card Header",
      characters: "Welcome Back"  // ACTUAL TEXT - use this!
    },
    {
      type: "TEXT", 
      name: "Description",
      characters: "Your dashboard awaits"  // ACTUAL TEXT - use this!
    },
    {
      type: "GROUP",
      name: "CTA Button",
      children: [
        {
          type: "RECTANGLE",
          fills: [{ color: { r: 0.23, g: 0.51, b: 0.96 }}]
        },
        {
          type: "TEXT",
          characters: "Get Started"  // ACTUAL BUTTON TEXT - use this!
        }
      ]
    }
  ]
}

CORRECT OUTPUT:
<div style={{ ... card styles ... }}>
  <h2>Welcome Back</h2>
  <p>Your dashboard awaits</p>
  <button style={{ ... button styles ... }}>
    Get Started
  </button>
</div>

WRONG OUTPUT (what you're currently doing):
<div>
  <h2>Card Title</h2>
  <p>Card Content</p>
  <button>Button Text</button>
</div>

RECURSIVE EXTRACTION ALGORITHM:

function analyzeNode(node) {
  if (node.type === "TEXT") {
    return {
      element: "text",
      content: node.characters,  // EXACT text
      fontSize: node.style.fontSize,
      color: convertColor(node.fills[0].color)
    };
  }
  
  if (node.type === "GROUP" && hasButtonPattern(node.children)) {
    const rect = node.children.find(c => c.type === "RECTANGLE");
    const text = node.children.find(c => c.type === "TEXT");
    return {
      element: "button",
      text: text.characters,  // EXACT button text
      styles: extractFromRectangle(rect)
    };
  }
  
  if (node.type === "FRAME" || node.type === "GROUP") {
    return {
      element: "container",
      children: node.children.map(child => analyzeNode(child))  // RECURSIVE
    };
  }
}

Apply this recursively to the entire structure.

CRITICAL RULES:
1. NEVER use placeholder text like "Card Title", "Card Content", "Button Text"
2. ALWAYS extract from node.characters for TEXT elements
3. ALWAYS analyze children recursively for nested structures
4. PRESERVE the actual content hierarchy from Figma

ACCESSIBILITY REQUIREMENTS:
- Component type: ${componentDetection.componentType}
- Generate semantic HTML (use <button>, <input>, <nav>, <article>, etc.)
- Add proper ARIA attributes based on component type
- Include aria-label for icon-only or unclear components
- Use proper heading hierarchy if text is a heading
- Ensure keyboard accessibility (tabIndex, onKeyPress)
- Add focus styles for interactive elements
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

USE THE EXACT VALUES FROM CHILDREN, DO NOT MAKE UP CONTENT.

Children details:
${safeNode.children?.map(child => `
  Child ${child.id}:
  - Type: ${child.type}
  - Name: ${child.name}
  ${child.type === 'TEXT' ? `- Text content: "${child.characters}"` : ''}
  ${child.type === 'RECTANGLE' ? `- Background: ${JSON.stringify(child.fills?.[0]?.color)}` : ''}
  - Dimensions: ${child.absoluteBoundingBox?.width} x ${child.absoluteBoundingBox?.height}
`).join('\n') || 'No children'}

Figma Children Data:
${JSON.stringify(safeNode.children?.map(c => ({
  type: c.type,
  name: c.name,
  characters: c.characters,
  absoluteBoundingBox: c.absoluteBoundingBox,
  fills: c.fills,
  cornerRadius: c.cornerRadius,
  effects: c.effects,
  style: c.style
})), null, 2) || 'No children'}

Now follow the pattern recognition rules above to generate the correct component.

Full Component Tree (for deep recursive analysis):
${JSON.stringify(safeNode, (key, value) => {
  // Include important fields for deep analysis
  if (key === 'children' || key === 'characters' || key === 'type' || 
      key === 'name' || key === 'fills' || key === 'style' || 
      key === 'absoluteBoundingBox' || key === 'cornerRadius' || key === 'effects') {
    return value;
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return undefined; // Skip other nested objects
  }
  return value;
}, 2)}

Analyze this ENTIRE tree recursively and extract ACTUAL content at every level.

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
