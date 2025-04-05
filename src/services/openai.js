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

The component should follow modern React patterns like this:
\`\`\`jsx
/**
 * @typedef {Object} ButtonProps
 * @property {string} [variant] - The visual style of the button
 */

const Button = ({ variant = 'primary' }) => {
  return (
    // Corresponds to Figma node with id: "10:5"
    <div style={{
      width: '120px',  // From absoluteBoundingBox.width
      height: '40px',  // From absoluteBoundingBox.height
      backgroundColor: '#4a90e2',  // From fills[0].color
      borderRadius: '4px',  // From cornerRadius
      border: '1px solid #3a80d2',  // From strokes[0]
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Only include this if there's a text node in the Figma data */}
      {/* Corresponds to Figma node with id: "10:6" */}
      <span style={{
        color: '#ffffff',  // From fills[0].color
        fontSize: '14px',  // From style.fontSize
        fontWeight: '500'  // From style.fontWeight
      }}>
        Button
      </span>
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
