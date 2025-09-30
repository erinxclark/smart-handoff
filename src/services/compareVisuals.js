import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

export const compareVisuals = async (livePreviewUrl, figmaPreviewUrl) => {
  try {
    if (!figmaPreviewUrl) {
      throw new Error('Figma preview URL is required for comparison');
    }

    if (!OPENAI_API_KEY) {
      console.warn('OpenAI API key is not configured. Using fallback analysis.');
      return getFallbackAnalysis();
    }

    // Simple fallback for test environments or invalid URLs
    if (process.env.NODE_ENV === 'test' || !livePreviewUrl || !livePreviewUrl.startsWith('data:')) {
      console.warn('Running in test mode or invalid preview URL - using fallback analysis');
      return getFallbackAnalysis();
    }

    console.log('Attempting to analyze component with OpenAI API...');
    
    try {
      // Get image data for both previews
      const figmaImageData = figmaPreviewUrl;
      const reactImageData = livePreviewUrl;
      
      // For single image analysis, which is more reliable
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Compare these two images - the first is the Figma design, and the second is the React implementation. Analyze the visual differences between them and provide specific, detailed feedback on:
- Exact color differences (provide specific hex codes where possible)
- Size and dimension mismatches (in pixels where possible)
- Border style differences (width, color, radius)
- Typography discrepancies (font size, weight, family, line height)
- Spacing and layout variations (padding, margin, alignment)
- Any other visual inconsistencies

Format your response as a JSON array of objects, each with:
- "priority": either "high", "medium", or "low" based on importance
- "title": a specific title that clearly identifies the element and issue
- "description": detailed explanation with specific measurements, colors, or other metrics

Be as specific and precise as possible about exact differences between the two images.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: figmaImageData
                  }
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: reactImageData
                  }
                }
              ]
            }
          ],
          max_tokens: 800
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          }
        }
      );

      console.log('OpenAI response received');
      
      // Try to extract JSON from the response
      const responseText = response.data.choices[0].message.content;
      console.log('Response text sample:', responseText.substring(0, 200) + '...');
      
      try {
        // Try to find and parse JSON in the response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            return enhanceAnalysis(parsedData);
          }
        }
        
        // If no valid JSON, use a text-based approach
        return parseTextResponse(responseText);
        
      } catch (parseError) {
        console.warn('Failed to parse JSON response:', parseError);
        return parseTextResponse(responseText);
      }
    } catch (apiError) {
      console.error('API error:', apiError);
      console.error('Error details:', apiError.response?.data || apiError.message);
      
      // Fall back to static analysis
      return getFallbackAnalysis();
    }
  } catch (error) {
    console.error('Error comparing visuals:', error);
    throw new Error('Failed to analyze the component preview');
  }
};

// Enhance analysis by adding specificity where needed
function enhanceAnalysis(analysisData) {
  return analysisData.map(item => {
    // Ensure titles are specific enough
    if (item.title.includes('general') || item.title.includes('overall')) {
      item.priority = 'low';
    }
    
    // Add specificity to vague descriptions
    if (item.description.length < 50) {
      item.description += ' Consider checking exact values in the Figma design and comparing with the React implementation.';
    }
    
    return item;
  });
}

// Helper to parse text-based responses
function parseTextResponse(text) {
  const issues = [];
  
  // Look for sections that might indicate issues
  const lines = text.split('\n');
  
  let currentIssue = null;
  
  for (const line of lines) {
    // Try to identify headers or bullet points that might be issues
    if (line.match(/^#+\s+/) || line.match(/^[-*•]\s+/) || line.match(/^\d+\.\s+/)) {
      // Save previous issue if we have one
      if (currentIssue && currentIssue.title && currentIssue.description) {
        issues.push(currentIssue);
      }
      
      // Start a new issue
      currentIssue = {
        title: line.replace(/^[-*•#+\d.]\s+/, '').trim(),
        description: '',
        priority: 'medium' // Default priority
      };
      
      // Try to determine priority from keywords
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('critical') || lowerLine.includes('major') || lowerLine.includes('significant')) {
        currentIssue.priority = 'high';
      } else if (lowerLine.includes('minor') || lowerLine.includes('subtle') || lowerLine.includes('small')) {
        currentIssue.priority = 'low';
      }
    } else if (currentIssue && line.trim()) {
      // Add to description of current issue
      currentIssue.description += (currentIssue.description ? ' ' : '') + line.trim();
    }
  }
  
  // Add the last issue if we have one
  if (currentIssue && currentIssue.title && currentIssue.description) {
    issues.push(currentIssue);
  }
  
  // If we couldn't parse any issues, return a generic analysis
  if (issues.length === 0) {
    return getFallbackAnalysis();
  }
  
  return issues;
}

// Provides a fallback analysis when API calls fail
function getFallbackAnalysis() {
  return [
    {
      priority: 'high',
      title: 'Component Dimensions',
      description: 'The React component width or height may not match the Figma design. Check the exact pixel values for width, height, and padding in the Figma design.'
    },
    {
      priority: 'medium',
      title: 'Color Hex Code Matching',
      description: 'Verify that colors in the React implementation use the exact hex codes from the Figma design. Pay special attention to subtle differences in shades or opacity values.'
    },
    {
      priority: 'medium',
      title: 'Border Style Properties',
      description: 'Border properties may not match between designs. Check border-width (px), border-style, border-color, and border-radius (px) values in the Figma specs.'
    },
    {
      priority: 'medium',
      title: 'Typography Specifications',
      description: 'Font properties like size, weight, family, and line-height should match the Figma design. Use the Inspect tab in Figma to view the exact typography values.'
    },
    {
      priority: 'low',
      title: 'Spacing Consistency',
      description: 'Ensure consistent padding and margin values between elements. Compare the exact pixel measurements with the Figma design using the Inspect tool.'
    }
  ];
} 