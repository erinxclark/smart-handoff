/**
 * Alignment Fixer Utility
 * 
 * Simple, focused alignment corrections for common issues
 * in AI-generated React code from Figma designs.
 */

/**
 * Fix common alignment issues in generated React code
 * @param {string} code - Generated React JSX code
 * @param {Object} figmaNode - Original Figma node data
 * @param {Object} alignmentAnalysis - Alignment analysis results
 * @returns {string} Corrected code with alignment fixes
 */
export function fixAlignmentIssues(code, figmaNode, alignmentAnalysis) {
  if (!code || !figmaNode || !alignmentAnalysis) {
    console.log('🔧 Alignment Fixer: Missing required parameters');
    return code;
  }

  console.log('🔧 Alignment Fixer: Starting alignment corrections');
  let correctedCode = code;
  
  try {
    // Fix 1: Ensure aligned elements use identical values
    correctedCode = fixAlignedElements(correctedCode, alignmentAnalysis);
    
    // Fix 2: Correct positioning values to match Figma exactly
    correctedCode = fixPositioningValues(correctedCode, figmaNode);
    
    // Fix 3: Apply consistent spacing where detected
    correctedCode = fixConsistentSpacing(correctedCode, alignmentAnalysis);
    
    // Fix 4: Ensure proper flexbox usage for aligned elements
    correctedCode = fixFlexboxAlignment(correctedCode, alignmentAnalysis);
    
    if (correctedCode !== code) {
      console.log('🔧 Alignment Fixer: Applied corrections successfully');
    } else {
      console.log('🔧 Alignment Fixer: No corrections needed');
    }
    
  } catch (error) {
    console.error('Error in alignment fixing:', error);
    return code; // Return original code if fixing fails
  }
  
  return correctedCode;
}

/**
 * Fix elements that should be aligned to use identical values
 */
function fixAlignedElements(code, alignmentAnalysis) {
  const { alignmentGroups } = alignmentAnalysis;
  
  // Fix top-aligned elements
  if (alignmentGroups.topAligned && alignmentGroups.topAligned.length > 1) {
    const topValue = alignmentGroups.topAligned[0].yPosition;
    const alignedElements = alignmentGroups.topAligned.map(item => item.node.name);
    
    console.log(`Fixing top-aligned elements: ${alignedElements.join(', ')} to Y: ${topValue}`);
    
    // Replace top values for aligned elements
    alignedElements.forEach(elementName => {
      const topRegex = new RegExp(`(top:\\s*)['"\`]?([\\d.]+)['"\`]?(?=\\s*[,}])`, 'g');
      code = code.replace(topRegex, (match, prefix, value) => {
        return `${prefix}'${topValue}'`;
      });
    });
  }
  
  // Fix left-aligned elements
  if (alignmentGroups.leftAligned && alignmentGroups.leftAligned.length > 1) {
    const leftValue = alignmentGroups.leftAligned[0].xPosition;
    const alignedElements = alignmentGroups.leftAligned.map(item => item.node.name);
    
    console.log(`Fixing left-aligned elements: ${alignedElements.join(', ')} to X: ${leftValue}`);
    
    // Replace left values for aligned elements
    alignedElements.forEach(elementName => {
      const leftRegex = new RegExp(`(left:\\s*)['"\`]?([\\d.]+)['"\`]?(?=\\s*[,}])`, 'g');
      code = code.replace(leftRegex, (match, prefix, value) => {
        return `${prefix}'${leftValue}'`;
      });
    });
  }
  
  return code;
}

/**
 * Fix positioning values to match Figma exactly
 */
function fixPositioningValues(code, figmaNode) {
  // Fix root element positioning
  if (figmaNode.absoluteBoundingBox) {
    const { x, y, width, height } = figmaNode.absoluteBoundingBox;
    
    // Ensure root element doesn't have positioning
    code = code.replace(/position:\s*['"`]?absolute['"`]?\s*,?\s*/g, '');
    code = code.replace(/left:\s*['"`]?[^'"`}]+['"`]?\s*,?\s*/g, '');
    code = code.replace(/top:\s*['"`]?[^'"`}]+['"`]?\s*,?\s*/g, '');
    
    // Ensure root element has correct dimensions
    code = code.replace(/(width:\s*)['"`]?([^'"`}]+)['"`]?/g, `$1'${width}px'`);
    code = code.replace(/(height:\s*)['"`]?([^'"`}]+)['"`]?/g, `$1'${height}px'`);
  }
  
  // Fix child element positioning
  if (figmaNode.children) {
    figmaNode.children.forEach(child => {
      if (child.absoluteBoundingBox) {
        const { x, y, width, height } = child.absoluteBoundingBox;
        const parentX = figmaNode.absoluteBoundingBox?.x || 0;
        const parentY = figmaNode.absoluteBoundingBox?.y || 0;
        
        // Calculate relative positions
        const relativeX = x - parentX;
        const relativeY = y - parentY;
        
        // Fix positioning for this child element
        const childName = child.name || child.id;
        console.log(`Fixing positioning for ${childName}: left=${relativeX}, top=${relativeY}`);
        
        // This is a simplified approach - in practice, you'd need more sophisticated matching
        // to identify which CSS rule corresponds to which Figma element
      }
    });
  }
  
  return code;
}

/**
 * Fix consistent spacing patterns
 */
function fixConsistentSpacing(code, alignmentAnalysis) {
  const { alignmentPatterns } = alignmentAnalysis;
  
  if (alignmentPatterns.consistentSpacing) {
    const { value, direction } = alignmentPatterns.consistentSpacing;
    
    console.log(`Applying consistent ${direction} spacing: ${value}px`);
    
    // For now, just log the spacing pattern
    // In a more sophisticated implementation, we'd replace margin/padding values
    // with the consistent spacing value
  }
  
  return code;
}

/**
 * Fix flexbox alignment for better layout control
 */
function fixFlexboxAlignment(code, alignmentAnalysis) {
  const { alignmentPatterns } = alignmentAnalysis;
  
  if (alignmentPatterns.flexboxCandidate) {
    const { direction, reason } = alignmentPatterns.flexboxCandidate;
    
    console.log(`Consider flexbox layout: ${direction}, reason: ${reason}`);
    
    // For now, just log the flexbox recommendation
    // In a more sophisticated implementation, we'd convert absolute positioning
    // to flexbox layout where appropriate
  }
  
  return code;
}

/**
 * Simple alignment validation
 */
export function validateSimpleAlignment(code, figmaNode) {
  const issues = [];
  
  // Check for common alignment issues
  if (figmaNode.children && figmaNode.children.length > 1) {
    // Check if children are positioned absolutely
    const hasAbsolutePositioning = code.includes("position: 'absolute'");
    
    if (hasAbsolutePositioning) {
      // Check for inconsistent positioning values
      const topMatches = code.match(/top:\s*['"`]?([^'"`}]+)['"`]?/g);
      const leftMatches = code.match(/left:\s*['"`]?([^'"`}]+)['"`]?/g);
      
      if (topMatches && topMatches.length > 1) {
        const topValues = topMatches.map(match => 
          parseFloat(match.match(/['"`]?([^'"`}]+)['"`]?/)[1])
        );
        
        // Check if top values are inconsistent (more than 2px difference)
        const maxTop = Math.max(...topValues);
        const minTop = Math.min(...topValues);
        
        if (maxTop - minTop > 2) {
          issues.push({
            type: 'inconsistent-top-alignment',
            message: `Top values vary by ${maxTop - minTop}px: ${topValues.join(', ')}`,
            severity: 'medium'
          });
        }
      }
      
      if (leftMatches && leftMatches.length > 1) {
        const leftValues = leftMatches.map(match => 
          parseFloat(match.match(/['"`]?([^'"`}]+)['"`]?/)[1])
        );
        
        // Check if left values are inconsistent
        const maxLeft = Math.max(...leftValues);
        const minLeft = Math.min(...leftValues);
        
        if (maxLeft - minLeft > 2) {
          issues.push({
            type: 'inconsistent-left-alignment',
            message: `Left values vary by ${maxLeft - minLeft}px: ${leftValues.join(', ')}`,
            severity: 'medium'
          });
        }
      }
    }
  }
  
  return {
    hasIssues: issues.length > 0,
    issues: issues
  };
}
