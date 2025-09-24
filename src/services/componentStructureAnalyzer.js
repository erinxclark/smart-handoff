/**
 * Component Structure Analyzer
 * 
 * Uses AI to analyze and fix component structure issues,
 * ensuring proper JSX hierarchy and React Live compatibility.
 */

export class ComponentStructureAnalyzer {
  constructor(openaiApiKey) {
    this.apiKey = openaiApiKey;
    this.analysisCache = new Map();
  }

  /**
   * Analyze component structure and provide fixes
   */
  analyzeAndFix = async (code, componentName) => {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(code, componentName);
      if (this.analysisCache.has(cacheKey)) {
        return this.analysisCache.get(cacheKey);
      }

      // Use AI to analyze and fix the structure
      const analysis = await this.performAIAnalysis(code, componentName);
      
      // Cache the result
      this.analysisCache.set(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing component structure:', error);
      return this.createFallbackStructure(code, componentName);
    }
  };

  /**
   * Perform AI analysis of component structure
   */
  performAIAnalysis = async (code, componentName) => {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not available');
    }

    const prompt = `Analyze this React component code and fix any structural issues for React Live rendering:

CRITICAL REQUIREMENTS:
1. Ensure proper JSX hierarchy with single root element
2. Fix any incomplete CSS properties
3. Replace all variable references with actual values
4. Remove conditional rendering and simplify to direct rendering
5. Ensure all JSX expressions are properly formatted
6. Make sure the component can be rendered directly in React Live
7. Preserve all styling and layout properties
8. Handle nested elements properly

Original code:
${code}

Component name: ${componentName}

Return ONLY the fixed React component code that can be rendered directly in React Live. Do not include any explanations or markdown formatting.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a React expert who fixes component structure issues for React Live rendering.' 
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const fixedCode = data.choices[0].message.content.trim();

    return {
      success: true,
      fixedCode,
      originalCode: code,
      componentName
    };
  };

  /**
   * Create fallback structure when AI analysis fails
   */
  createFallbackStructure = (code, componentName) => {
    try {
      // Extract JSX content
      const jsxMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*}/);
      if (!jsxMatch) {
        throw new Error('Could not extract JSX content');
      }

      let jsxContent = jsxMatch[1].trim();

      // Basic cleanup
      jsxContent = jsxContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      jsxContent = jsxContent.replace(/\{([^}]+)\}/g, (match, variable) => {
        const trimmed = variable.trim();
        if (trimmed === 'text') return 'Sample Text';
        if (trimmed.includes('Color')) return '#000000';
        if (trimmed.includes('Width')) return '200px';
        if (trimmed.includes('Height')) return '100px';
        return 'default';
      });

      // Ensure single root element
      if (!jsxContent.startsWith('<')) {
        jsxContent = `<div>${jsxContent}</div>`;
      }

      const fallbackCode = `
const ${componentName} = () => {
  return (
    ${jsxContent}
  );
};

${componentName}`;

      return {
        success: true,
        fixedCode: fallbackCode,
        originalCode: code,
        componentName,
        isFallback: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        originalCode: code,
        componentName
      };
    }
  };

  /**
   * Generate cache key
   */
  generateCacheKey = (code, componentName) => {
    return `${componentName}-${this.simpleHash(code)}`;
  };

  /**
   * Simple hash function
   */
  simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
    }
    return hash.toString();
  };

  /**
   * Clear analysis cache
   */
  clearCache = () => {
    this.analysisCache.clear();
  };
}

// Export singleton instance
export const componentStructureAnalyzer = new ComponentStructureAnalyzer(
  process.env.REACT_APP_OPENAI_API_KEY
);
