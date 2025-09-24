/**
 * React Live Transformer Service
 * 
 * Provides intelligent transformation of Figma-generated code into
 * React Live compatible components with proper structure and error handling.
 */

export class ReactLiveTransformer {
  constructor() {
    this.componentCache = new Map();
    this.errorBoundary = null;
  }

  /**
   * Transform Figma code into React Live compatible format
   */
  transformForReactLive = (code, componentName = 'Component') => {
    try {
      // Check cache first
      const cacheKey = `${componentName}-${this.hashCode(code)}`;
      if (this.componentCache.has(cacheKey)) {
        return this.componentCache.get(cacheKey);
      }

      // Parse and transform the code
      const transformed = this.parseAndTransform(code, componentName);
      
      // Cache the result
      this.componentCache.set(cacheKey, transformed);
      
      return transformed;
    } catch (error) {
      console.error('Error transforming code for React Live:', error);
      return this.createErrorComponent(error.message);
    }
  };

  /**
   * Parse and transform the original code
   */
  parseAndTransform = (code, componentName) => {
    // Extract component structure
    const componentMatch = code.match(/(?:const|function)\s+(\w+)\s*=\s*([\s\S]*?)(?:export|$)/);
    if (!componentMatch) {
      throw new Error('Could not parse component structure');
    }

    const [, extractedName, componentBody] = componentMatch;
    const finalComponentName = extractedName || componentName;

    // Extract JSX return statement
    const jsxMatch = componentBody.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*}/);
    if (!jsxMatch) {
      throw new Error('Could not extract JSX return statement');
    }

    let jsxContent = jsxMatch[1].trim();

    // Clean up the JSX
    jsxContent = this.cleanupJSX(jsxContent);

    // Create a complete React component for React Live
    const completeComponent = this.createCompleteComponent(finalComponentName, jsxContent);

    return completeComponent;
  };

  /**
   * Clean up JSX content for React Live
   */
  cleanupJSX = (jsxContent) => {
    // Remove comments
    jsxContent = jsxContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    
    // Fix incomplete border styles
    jsxContent = jsxContent.replace(/border:\s*'([^']*),/g, "border: '1px solid #000000',");
    
    // Fix incomplete template literals
    jsxContent = jsxContent.replace(/\$\{([^}]+)\}/g, (match, variable) => {
      // Provide sensible defaults based on variable name
      const defaults = {
        'text': 'Sample Text',
        'width': '200',
        'height': '100',
        'backgroundColor': '#f0f0f0',
        'borderColor': '#000000',
        'borderWidth': '1'
      };
      return defaults[variable] || 'default';
    });

    // Fix JSX expressions
    jsxContent = jsxContent.replace(/\{([^}]+)\}/g, (match, expression) => {
      // Handle simple variable references
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(expression.trim())) {
        return `'${expression}'`;
      }
      return match;
    });

    // Add proper layout properties if missing
    jsxContent = this.addLayoutProperties(jsxContent);

    return jsxContent;
  };

  /**
   * Add layout properties for better rendering
   */
  addLayoutProperties = (jsxContent) => {
    // Add display flex to containers
    jsxContent = jsxContent.replace(
      /backgroundColor:\s*'([^']+)',\s*\n\s*\}>/g,
      (match, color) => {
        return `backgroundColor: '${color}',\n      display: 'flex',\n      alignItems: 'center',\n      justifyContent: 'center',\n      minHeight: '100px'\n    }>`;
      }
    );

    return jsxContent;
  };

  /**
   * Create a complete React component for React Live
   */
  createCompleteComponent = (componentName, jsxContent) => {
    return `
const ${componentName} = () => {
  return (
    ${jsxContent}
  );
};

// Render the component
${componentName}`;
  };

  /**
   * Create an error component for fallback
   */
  createErrorComponent = (errorMessage) => {
    return `
const ErrorComponent = () => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#fee2e2',
      border: '1px solid #ef4444',
      borderRadius: '4px',
      color: '#ef4444',
      textAlign: 'center'
    }}>
      <h3>Rendering Error</h3>
      <p>${errorMessage}</p>
    </div>
  );
};

ErrorComponent`;
  };

  /**
   * Simple hash function for caching
   */
  hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  };

  /**
   * Clear the cache
   */
  clearCache = () => {
    this.componentCache.clear();
  };

  /**
   * Get cache statistics
   */
  getCacheStats = () => {
    return {
      size: this.componentCache.size,
      keys: Array.from(this.componentCache.keys())
    };
  };
}

// Export a singleton instance
export const reactLiveTransformer = new ReactLiveTransformer();
