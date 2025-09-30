import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// Cache comparison results to avoid re-analyzing same images
const comparisonCache = new Map();

// Clear cache function for testing
export const clearComparisonCache = () => {
  comparisonCache.clear();
};

function getCacheKey(reactImage, figmaImage) {
  // Create hash from image data URLs
  return `${reactImage.substring(0, 50)}_${figmaImage.substring(0, 50)}`;
}

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
    
    // Check cache first
    const cacheKey = getCacheKey(livePreviewUrl, figmaPreviewUrl);
    if (comparisonCache.has(cacheKey)) {
      console.log('Returning cached comparison results');
      return comparisonCache.get(cacheKey);
    }
    
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
                  text: `You are a visual QA expert analyzing UI implementation accuracy.

Compare these two screenshots:
1. React Implementation (generated code)
2. Original Figma Design

Provide a detailed, structured analysis in the following format:

## DIMENSIONS
- React: [width] x [height]
- Figma: [width] x [height]
- Difference: [exact pixel difference]
- Status: ✓ Match / ⚠ Off by Xpx

## COLORS
Analyze each visible color:
- Background: React [hex] vs Figma [hex] - [Match/Different]
- Text: React [hex] vs Figma [hex] - [Match/Different]
- Borders: React [hex] vs Figma [hex] - [Match/Different]
If different, calculate color distance and suggest correction.

## SPACING & ALIGNMENT
- Padding: React [measurements] vs Figma [measurements]
- Element gaps: [measure distances between elements]
- Alignment issues: [specific elements that are misaligned]
- Status for each: ✓ Match / ⚠ Off by Xpx

## TYPOGRAPHY
- Font family: [comparison]
- Font size: React [size] vs Figma [size]
- Font weight: [comparison]
- Line height: [comparison]

## BORDER & EFFECTS
- Border width: [comparison]
- Border radius: React [value] vs Figma [value]
- Box shadow: [detailed comparison]

## CRITICAL ISSUES (prioritized)
List any issues that would fail QA:
1. [Issue] - Impact: High/Medium/Low
2. [Issue] - Impact: High/Medium/Low

## ACCURACY SCORE
Overall: [0-100]%
- Dimensions: [0-100]%
- Colors: [0-100]%
- Spacing: [0-100]%
- Typography: [0-100]%

## ACTIONABLE FIXES
Provide specific code changes needed:
1. Change backgroundColor from '#44b24f' to '#43b261'
2. Adjust padding from 16px to 20px
3. Fix border-radius from 12px to 15px

Be precise with measurements. Use actual pixel values, not approximations.
If something matches perfectly, clearly state "✓ Perfect match".
If there are no differences, say "✓ Pixel-perfect implementation".`
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
        // Parse the structured response
        const parsedResults = parseComparisonResults(responseText);
        
        // Cache the results
        comparisonCache.set(cacheKey, parsedResults);
        
        return parsedResults;
        
      } catch (parseError) {
        console.warn('Failed to parse structured response:', parseError);
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

// Parse the structured AI response into organized data
function parseComparisonResults(aiResponse) {
  return {
    dimensions: extractSection(aiResponse, 'DIMENSIONS'),
    colors: extractSection(aiResponse, 'COLORS'),
    spacing: extractSection(aiResponse, 'SPACING & ALIGNMENT'),
    typography: extractSection(aiResponse, 'TYPOGRAPHY'),
    borders: extractSection(aiResponse, 'BORDER & EFFECTS'),
    criticalIssues: extractCriticalIssues(aiResponse),
    accuracyScore: extractAccuracyScore(aiResponse),
    actionableFixes: extractActionableFixes(aiResponse),
    rawResponse: aiResponse
  };
}

function extractSection(response, sectionName) {
  const regex = new RegExp(`## ${sectionName}\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
  const match = response.match(regex);
  return match ? match[1].trim() : 'Not analyzed';
}

function extractCriticalIssues(response) {
  const section = extractSection(response, 'CRITICAL ISSUES');
  const issues = [];
  const lines = section.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/\d+\.\s*(.+?)\s*-\s*Impact:\s*(High|Medium|Low)/i);
    if (match) {
      issues.push({
        description: match[1].trim(),
        impact: match[2].toLowerCase()
      });
    }
  });
  
  return issues;
}

function extractAccuracyScore(response) {
  const section = extractSection(response, 'ACCURACY SCORE');
  const scores = {};
  
  const overallMatch = section.match(/Overall:\s*(\d+)%/);
  if (overallMatch) scores.overall = parseInt(overallMatch[1]);
  
  const dimensionsMatch = section.match(/Dimensions:\s*(\d+)%/);
  if (dimensionsMatch) scores.dimensions = parseInt(dimensionsMatch[1]);
  
  const colorsMatch = section.match(/Colors:\s*(\d+)%/);
  if (colorsMatch) scores.colors = parseInt(colorsMatch[1]);
  
  const spacingMatch = section.match(/Spacing:\s*(\d+)%/);
  if (spacingMatch) scores.spacing = parseInt(spacingMatch[1]);
  
  const typographyMatch = section.match(/Typography:\s*(\d+)%/);
  if (typographyMatch) scores.typography = parseInt(typographyMatch[1]);
  
  return scores;
}

function extractActionableFixes(response) {
  const section = extractSection(response, 'ACTIONABLE FIXES');
  const fixes = [];
  const lines = section.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/\d+\.\s*(.+)/);
    if (match) {
      fixes.push(match[1].trim());
    }
  });
  
  return fixes;
}

// Provides a fallback analysis when API calls fail
function getFallbackAnalysis() {
  return {
    dimensions: 'Unable to analyze dimensions - API unavailable',
    colors: 'Unable to analyze colors - API unavailable',
    spacing: 'Unable to analyze spacing - API unavailable',
    typography: 'Unable to analyze typography - API unavailable',
    borders: 'Unable to analyze borders - API unavailable',
    criticalIssues: [
      {
        description: 'Visual analysis unavailable - check component manually',
        impact: 'high'
      }
    ],
    accuracyScore: {
      overall: 0,
      dimensions: 0,
      colors: 0,
      spacing: 0,
      typography: 0
    },
    actionableFixes: [
      'Verify component matches Figma design manually',
      'Check exact pixel values in Figma inspect panel',
      'Compare colors, spacing, and typography side by side'
    ],
    rawResponse: 'Fallback analysis - API unavailable'
  };
} 