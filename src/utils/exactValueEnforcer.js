/**
 * Exact Value Enforcer
 * 
 * Simple post-processing to ensure generated code uses exact Figma values
 * instead of rounded or approximated values.
 */

/**
 * Enforce exact pixel values from Figma JSON
 * @param {string} code - Generated React JSX code
 * @param {Object} figmaNode - Original Figma node data
 * @returns {string} Code with exact values enforced
 */
export function enforceExactValues(code, figmaNode) {
  if (!code || !figmaNode || !figmaNode.absoluteBoundingBox) {
    console.log('🔧 Exact Value Enforcer: Missing required data');
    return code;
  }

  const { width, height, x, y } = figmaNode.absoluteBoundingBox;
  
  console.log('🔧 Exact Value Enforcer: Enforcing exact values');
  console.log(`🔧 Figma values - W: ${width}, H: ${height}, X: ${x}, Y: ${y}`);
  
  let correctedCode = code;
  
  try {
    // Fix root element dimensions
    correctedCode = correctedCode.replace(/width:\s*['"](\d+)px['"]/, `width: '${width}px'`);
    correctedCode = correctedCode.replace(/height:\s*['"](\d+)px['"]/, `height: '${height}px'`);
    
    // Log the changes
    if (correctedCode !== code) {
      console.log('🔧 Applied exact dimension corrections');
    }
    
    // Fix child elements if they exist
    if (figmaNode.children && figmaNode.children.length > 0) {
      correctedCode = enforceChildElementValues(correctedCode, figmaNode.children, x, y);
    }
    
  } catch (error) {
    console.error('Error enforcing exact values:', error);
    return code;
  }
  
  return correctedCode;
}

/**
 * Enforce exact values for child elements
 * @param {string} code - Generated code
 * @param {Array} children - Figma child nodes
 * @param {number} parentX - Parent X coordinate
 * @param {number} parentY - Parent Y coordinate
 * @returns {string} Corrected code
 */
function enforceChildElementValues(code, children, parentX, parentY) {
  let correctedCode = code;
  
  children.forEach((child, index) => {
    if (child.absoluteBoundingBox) {
      const { width, height, x, y } = child.absoluteBoundingBox;
      
      // Calculate relative positions
      const relativeX = x - parentX;
      const relativeY = y - parentY;
      
      console.log(`🔧 Child ${index + 1}: W: ${width}, H: ${height}, X: ${relativeX}, Y: ${relativeY}`);
      
      // Note: This is a simplified approach. In practice, we'd need more sophisticated
      // matching to identify which CSS rule corresponds to which Figma element.
      // For now, we'll just log the values for debugging.
    }
  });
  
  return correctedCode;
}

/**
 * Validate that generated values match Figma exactly
 * @param {string} code - Generated code
 * @param {Object} figmaNode - Figma node data
 * @returns {Object} Validation results
 */
export function validateExactValues(code, figmaNode) {
  if (!code || !figmaNode || !figmaNode.absoluteBoundingBox) {
    return { isValid: true, issues: [] };
  }
  
  const { width, height, x, y } = figmaNode.absoluteBoundingBox;
  const issues = [];
  
  // Check width
  const widthMatch = code.match(/width:\s*['"](\d+)px['"]/);
  if (widthMatch) {
    const generatedWidth = parseInt(widthMatch[1]);
    if (generatedWidth !== width) {
      issues.push({
        property: 'width',
        figma: width,
        generated: generatedWidth,
        difference: Math.abs(width - generatedWidth)
      });
    }
  }
  
  // Check height
  const heightMatch = code.match(/height:\s*['"](\d+)px['"]/);
  if (heightMatch) {
    const generatedHeight = parseInt(heightMatch[1]);
    if (generatedHeight !== height) {
      issues.push({
        property: 'height',
        figma: height,
        generated: generatedHeight,
        difference: Math.abs(height - generatedHeight)
      });
    }
  }
  
  // Check top positioning
  const topMatch = code.match(/top:\s*['"](\d+)px['"]/);
  if (topMatch) {
    const generatedTop = parseInt(topMatch[1]);
    if (generatedTop !== y) {
      issues.push({
        property: 'top',
        figma: y,
        generated: generatedTop,
        difference: Math.abs(y - generatedTop)
      });
    }
  }
  
  // Check left positioning
  const leftMatch = code.match(/left:\s*['"](\d+)px['"]/);
  if (leftMatch) {
    const generatedLeft = parseInt(leftMatch[1]);
    if (generatedLeft !== x) {
      issues.push({
        property: 'left',
        figma: x,
        generated: generatedLeft,
        difference: Math.abs(x - generatedLeft)
      });
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
}

/**
 * Log debugging information for alignment issues
 * @param {string} code - Generated code
 * @param {Object} figmaNode - Figma node data
 */
export function debugAlignmentValues(code, figmaNode) {
  if (!figmaNode || !figmaNode.absoluteBoundingBox) return;
  
  const { width, height, x, y } = figmaNode.absoluteBoundingBox;
  
  console.log('🔍 DEBUG - Figma Values:');
  console.log(`  Width: ${width}px`);
  console.log(`  Height: ${height}px`);
  console.log(`  X: ${x}px`);
  console.log(`  Y: ${y}px`);
  
  // Extract generated values
  const widthMatch = code.match(/width:\s*['"](\d+)px['"]/);
  const heightMatch = code.match(/height:\s*['"](\d+)px['"]/);
  const topMatch = code.match(/top:\s*['"](\d+)px['"]/);
  const leftMatch = code.match(/left:\s*['"](\d+)px['"]/);
  
  console.log('🔍 DEBUG - Generated Values:');
  console.log(`  Width: ${widthMatch ? widthMatch[1] + 'px' : 'NOT FOUND'}`);
  console.log(`  Height: ${heightMatch ? heightMatch[1] + 'px' : 'NOT FOUND'}`);
  console.log(`  Top: ${topMatch ? topMatch[1] + 'px' : 'NOT FOUND'}`);
  console.log(`  Left: ${leftMatch ? leftMatch[1] + 'px' : 'NOT FOUND'}`);
  
  // Check matches
  if (widthMatch) {
    const generatedWidth = parseInt(widthMatch[1]);
    console.log(`🔍 Width Match: ${width === generatedWidth ? '✅' : '❌'} (Figma: ${width}, Generated: ${generatedWidth})`);
  }
  
  if (heightMatch) {
    const generatedHeight = parseInt(heightMatch[1]);
    console.log(`🔍 Height Match: ${height === generatedHeight ? '✅' : '❌'} (Figma: ${height}, Generated: ${generatedHeight})`);
  }
  
  if (topMatch) {
    const generatedTop = parseInt(topMatch[1]);
    console.log(`🔍 Top Match: ${y === generatedTop ? '✅' : '❌'} (Figma: ${y}, Generated: ${generatedTop})`);
  }
  
  if (leftMatch) {
    const generatedLeft = parseInt(leftMatch[1]);
    console.log(`🔍 Left Match: ${x === generatedLeft ? '✅' : '❌'} (Figma: ${x}, Generated: ${generatedLeft})`);
  }
}
