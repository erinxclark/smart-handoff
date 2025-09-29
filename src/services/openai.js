import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

console.log('OpenAI API Key loaded:', OPENAI_API_KEY ? 'Yes' : 'No');

if (!OPENAI_API_KEY) {
  console.warn('⚠️ OpenAI API key is not set. Please set REACT_APP_OPENAI_API_KEY in your .env file');
}

export const generateSpecAndCode = async (figmaNode) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const prompt = `You are a React expert. Given the following Figma design specifications, create:

1. A detailed **design specification** document that includes:
   - Exact measurements (in pixels)
   - Colors (in hex or rgba)
   - Typography details
   - Layout structure
   - Any interactive states or behaviors

2. A modern **React component** that:
   - Uses TypeScript-like prop types with JSDoc comments
   - Implements all styles using inline styles
   - Uses modern React patterns (hooks, proper state management)
   - Includes proper accessibility attributes
   - Has clear component composition
   - Uses semantic HTML
   - Is responsive where needed
   - Has no framework dependencies

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

The component should follow modern React patterns with proper positioning like this:

SINGLE ELEMENT:
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
