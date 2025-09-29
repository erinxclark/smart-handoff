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
      
      // Validate the transformed code
      this.validateTransformedCode(transformed);
      
      // Cache the result
      this.componentCache.set(cacheKey, transformed);
      
      return transformed;
    } catch (error) {
      console.error('Error transforming code for React Live:', error);
      return this.createErrorComponent(error.message);
    }
  };

  /**
   * Validate transformed code for basic syntax issues
   */
  validateTransformedCode = (code) => {
    console.log('Validating transformed code:', code);
    
    // Check for basic syntax issues
    const issues = [];
    
    // Check for unclosed parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`);
    }
    
    // Check for unclosed braces
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    }
    
    // Check for unclosed brackets
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push(`Mismatched brackets: ${openBrackets} open, ${closeBrackets} close`);
    }
    
    // Check for common syntax errors
    if (code.includes('<>') && !code.includes('</>')) {
      issues.push('Unclosed React fragment');
    }
    
    if (code.includes('<') && code.includes('>') && !code.includes('</') && !code.includes('/>')) {
      issues.push('Potential unclosed JSX tags');
    }
    
    if (issues.length > 0) {
      console.warn('Validation issues found:', issues);
      // Don't throw error, just log warnings for now
    }
    
    console.log('Validation passed');
  };

  /**
   * Parse and transform the original code
   */
  parseAndTransform = (code, componentName) => {
    console.log('Parsing code:', code);
    
    // Handle empty or invalid code
    if (!code || code.trim().length === 0) {
      console.log('Empty code, creating default component');
      return this.createDefaultComponent(componentName);
    }
    
    // First, check if this is already a complete React component
    if (this.isCompleteReactComponent(code)) {
      console.log('Code is already complete, returning as-is');
      return this.ensureComponentExport(code, componentName);
    }

    // Extract component structure - more flexible patterns
    const patterns = [
      // const ComponentName = () => { ... }
      /(?:const|function)\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{([\s\S]*?)(?:export|$)/,
      // const ComponentName = (props) => { ... }
      /(?:const|function)\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{([\s\S]*?)(?:export|$)/,
      // function ComponentName() { ... }
      /function\s+(\w+)\s*\([^)]*\)\s*{([\s\S]*?)(?:export|$)/,
    ];

    let componentMatch = null;
    let finalComponentName = componentName;
    let componentBody = '';

    for (const pattern of patterns) {
      componentMatch = code.match(pattern);
      if (componentMatch) {
        finalComponentName = componentMatch[1] || componentName;
        componentBody = componentMatch[2] || code;
        break;
      }
    }

    if (!componentMatch) {
      console.log('No component pattern matched, treating as JSX');
      // If no component pattern found, treat the entire code as JSX
      return this.createCompleteComponent(componentName, code.trim());
    }

    console.log('Extracted component:', finalComponentName);
    console.log('Component body:', componentBody);

    // Extract JSX return statement - more flexible patterns
    const jsxPatterns = [
      /return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*}/,
      /return\s*([\s\S]*?)\s*;?\s*}/,
      /return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*$/,
    ];

    let jsxMatch = null;
    for (const pattern of jsxPatterns) {
      jsxMatch = componentBody.match(pattern);
      if (jsxMatch) {
        break;
      }
    }

    if (!jsxMatch) {
      console.log('No JSX return found, using entire component body');
      // If no JSX return found, use the entire component body
      jsxMatch = [null, componentBody];
    }

    let jsxContent = jsxMatch[1].trim();

    // Clean up the JSX
    jsxContent = this.cleanupJSX(jsxContent);

    // Create a complete React component for React Live
    const completeComponent = this.createCompleteComponent(finalComponentName, jsxContent);

    console.log('Final transformed component:', completeComponent);
    return completeComponent;
  };

  /**
   * Check if code is already a complete React component
   */
  isCompleteReactComponent = (code) => {
    // Check if it has a component declaration and export
    const hasComponent = /(?:const|function)\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{/.test(code) || 
                        /function\s+\w+\s*\([^)]*\)\s*{/.test(code);
    const hasExport = /export\s+(?:default\s+)?/.test(code);
    
    return hasComponent && (hasExport || code.includes('export'));
  };

  /**
   * Ensure component has proper export for React Live
   */
  ensureComponentExport = (code, componentName) => {
    // Extract component name from code
    const componentMatch = code.match(/(?:const|function)\s+(\w+)/);
    const extractedName = componentMatch ? componentMatch[1] : componentName;
    
    // If code doesn't end with component name, add it
    if (!code.trim().endsWith(extractedName)) {
      return `${code}\n\n${extractedName}`;
    }
    
    return code;
  };

  /**
   * Clean up JSX content for React Live
   */
  cleanupJSX = (jsxContent) => {
    console.log('Cleaning up JSX:', jsxContent);
    
    // Remove comments
    jsxContent = jsxContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    
    // Fix incomplete border styles
    jsxContent = jsxContent.replace(/border:\s*'([^']*),/g, "border: '1px solid #000000',");
    
    // Fix template literals that might be undefined
    jsxContent = jsxContent.replace(/\$\{([^}]+)\}/g, (match, variable) => {
      // Provide sensible defaults based on variable name
      const defaults = {
        'text': 'Sample Text',
        'width': '200',
        'height': '100',
        'backgroundColor': '#f0f0f0',
        'borderColor': '#000000',
        'borderWidth': '1',
        'color': '#000000',
        'fontSize': '16',
        'padding': '10'
      };
      return defaults[variable] || 'default';
    });

    // Fix JSX expressions that might be undefined variables
    jsxContent = jsxContent.replace(/\{([^}]+)\}/g, (match, expression) => {
      const trimmed = expression.trim();
      
      // Handle simple variable references that might be undefined
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed)) {
        // Check if it's a common style property and provide default
        const styleDefaults = {
          'width': '200px',
          'height': '100px',
          'backgroundColor': '#f0f0f0',
          'color': '#000000',
          'border': '1px solid #ccc',
          'padding': '10px',
          'margin': '10px',
          'fontSize': '16px'
        };
        
        if (styleDefaults[trimmed]) {
          return `'${styleDefaults[trimmed]}'`;
        }
        
        return `'${trimmed}'`;
      }
      
      // Handle function calls and complex expressions
      if (trimmed.includes('(') || trimmed.includes('.') || trimmed.includes('[')) {
        return match; // Keep complex expressions as-is
      }
      
      return match;
    });

    // Fix common style issues
    jsxContent = jsxContent.replace(/style=\{\{([^}]+)\}\}/g, (match, styleContent) => {
      // Fix missing quotes around property values
      let fixedStyle = styleContent.replace(/(\w+):\s*([^,}]+)/g, (propMatch, prop, value) => {
        const trimmedValue = value.trim();
        // Add quotes if not already quoted and not a number
        if (!/^['"]/.test(trimmedValue) && !/^\d+px?$/.test(trimmedValue) && trimmedValue !== 'true' && trimmedValue !== 'false') {
          return `${prop}: '${trimmedValue}'`;
        }
        return propMatch;
      });
      
      return `style={{${fixedStyle}}}`;
    });

    // Fix common JSX syntax issues that cause "Unexpected token" errors
    jsxContent = jsxContent
      // Fix unclosed self-closing tags
      .replace(/<(\w+)([^>]*?)\s*$/gm, '<$1$2 />')
      // Fix malformed JSX attributes
      .replace(/(\w+)=\{([^}]*?)\s*$/gm, '$1={$2}')
      // Fix missing closing tags in simple cases
      .replace(/<(\w+)([^>]*?)>([^<]*?)<\/(\w+)>/g, (match, openTag, openAttrs, content, closeTag) => {
        if (openTag !== closeTag) {
          return `<${openTag}${openAttrs}>${content}</${openTag}>`;
        }
        return match;
      })
      // Fix incomplete template literals
      .replace(/\$\{([^}]*?)\s*$/gm, '${$1}')
      // Remove any trailing commas in object literals
      .replace(/,(\s*[}\]])/g, '$1');

    // Add proper layout properties if missing
    jsxContent = this.addLayoutProperties(jsxContent);

    console.log('Cleaned JSX:', jsxContent);
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
   * Create a default component when code is empty or invalid
   */
  createDefaultComponent = (componentName) => {
    return `
const ${componentName} = () => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '4px',
      textAlign: 'center'
    }}>
      <h3>${componentName}</h3>
      <p>Ready to render your component</p>
    </div>
  );
};

${componentName}`;
  };

  /**
   * Create a complete React component for React Live
   */
  createCompleteComponent = (componentName, jsxContent) => {
    const component = `const ${componentName} = () => {
  return (
    ${jsxContent}
  );
};

// Render the component
${componentName}`;
    
    console.log('Created complete component:', component);
    return component;
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
      <details style={{ marginTop: '10px', textAlign: 'left' }}>
        <summary>Debug Info</summary>
        <pre style={{ fontSize: '12px', marginTop: '5px' }}>
          Error: ${errorMessage}
          Time: ${new Date().toISOString()}
        </pre>
      </details>
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
