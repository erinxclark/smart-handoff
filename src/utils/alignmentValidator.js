/**
 * Alignment Validation and Correction Utility
 * 
 * Post-processes generated React code to validate and correct
 * alignment issues, ensuring pixel-perfect accuracy.
 */

/**
 * Validate alignment in generated React code against Figma specifications
 * @param {string} generatedCode - The generated React JSX code
 * @param {Object} figmaNode - Original Figma node data
 * @param {Object} alignmentAnalysis - Result from detectAndFixAlignment
 * @returns {Object} Validation results with corrections and warnings
 */
export function validateAlignment(generatedCode, figmaNode, alignmentAnalysis) {
  const result = {
    isAligned: true,
    corrections: [],
    warnings: [],
    alignmentIssues: [],
    suggestedFixes: []
  };

  try {
    // Parse CSS values from generated code
    const cssValues = extractCSSValues(generatedCode);
    
    // Validate against Figma specifications
    const figmaValues = extractFigmaValues(figmaNode);
    
    // Check for alignment issues
    const alignmentIssues = checkAlignmentIssues(cssValues, figmaValues, alignmentAnalysis);
    result.alignmentIssues = alignmentIssues;
    
    // Generate corrections
    const corrections = generateAlignmentCorrections(alignmentIssues, alignmentAnalysis);
    result.corrections = corrections;
    
    // Apply corrections if any
    if (corrections.length > 0) {
      result.isAligned = false;
      result.correctedCode = applyAlignmentCorrections(generatedCode, corrections);
    }
    
    // Generate warnings for potential issues
    result.warnings = generateAlignmentWarnings(cssValues, figmaValues, alignmentAnalysis);
    
    // Generate suggested fixes
    result.suggestedFixes = generateSuggestedFixes(alignmentAnalysis);
    
  } catch (error) {
    result.warnings.push({
      type: 'validation-error',
      message: `Error validating alignment: ${error.message}`,
      severity: 'medium'
    });
  }

  return result;
}

/**
 * Extract CSS positioning values from generated React code
 * @param {string} code - Generated React JSX code
 * @returns {Object} Extracted CSS values
 */
function extractCSSValues(code) {
  const cssValues = {
    positions: [],
    dimensions: [],
    margins: [],
    paddings: []
  };

  // Extract style objects from JSX
  const styleRegex = /style=\{\{([^}]+)\}\}/g;
  let match;
  
  while ((match = styleRegex.exec(code)) !== null) {
    const styleContent = match[1];
    
    // Parse individual style properties
    const properties = parseStyleProperties(styleContent);
    
    // Categorize properties
    properties.forEach(prop => {
      if (prop.name === 'position') {
        cssValues.positions.push(prop);
      } else if (['width', 'height'].includes(prop.name)) {
        cssValues.dimensions.push(prop);
      } else if (prop.name.startsWith('margin')) {
        cssValues.margins.push(prop);
      } else if (prop.name.startsWith('padding')) {
        cssValues.paddings.push(prop);
      }
    });
  }

  return cssValues;
}

/**
 * Parse individual style properties from style object string
 * @param {string} styleContent - Style object content
 * @returns {Array} Array of parsed properties
 */
function parseStyleProperties(styleContent) {
  const properties = [];
  
  // Match property: value pairs
  const propRegex = /(\w+):\s*['"`]?([^,'"`}]+)['"`]?/g;
  let match;
  
  while ((match = propRegex.exec(styleContent)) !== null) {
    const [, name, value] = match;
    
    // Clean up the value
    const cleanValue = value.trim().replace(/['"`]/g, '');
    
    properties.push({
      name: name.trim(),
      value: cleanValue,
      originalValue: value.trim()
    });
  }
  
  return properties;
}

/**
 * Extract positioning values from Figma node data
 * @param {Object} figmaNode - Figma node data
 * @returns {Object} Extracted Figma values
 */
function extractFigmaValues(figmaNode) {
  const values = {
    positions: [],
    dimensions: [],
    boundingBox: figmaNode.absoluteBoundingBox || null
  };

  if (figmaNode.absoluteBoundingBox) {
    const { x, y, width, height } = figmaNode.absoluteBoundingBox;
    
    values.positions.push(
      { name: 'left', value: x },
      { name: 'top', value: y }
    );
    
    values.dimensions.push(
      { name: 'width', value: width },
      { name: 'height', value: height }
    );
  }

  // Extract child positions if available
  if (figmaNode.children) {
    figmaNode.children.forEach(child => {
      if (child.absoluteBoundingBox) {
        const { x, y, width, height } = child.absoluteBoundingBox;
        
        values.positions.push(
          { name: 'left', value: x, element: child.name },
          { name: 'top', value: y, element: child.name }
        );
        
        values.dimensions.push(
          { name: 'width', value: width, element: child.name },
          { name: 'height', value: height, element: child.name }
        );
      }
    });
  }

  return values;
}

/**
 * Check for alignment issues between generated code and Figma specs
 * @param {Object} cssValues - Extracted CSS values
 * @param {Object} figmaValues - Extracted Figma values
 * @param {Object} alignmentAnalysis - Alignment analysis results
 * @returns {Array} Array of alignment issues
 */
function checkAlignmentIssues(cssValues, figmaValues, alignmentAnalysis) {
  const issues = [];
  const tolerance = 2; // 2px tolerance for alignment issues

  // Check positioning accuracy
  cssValues.positions.forEach(cssPos => {
    const figmaPos = figmaValues.positions.find(fp => 
      fp.name === cssPos.name && (!cssPos.element || fp.element === cssPos.element)
    );
    
    if (figmaPos) {
      const cssValue = parseFloat(cssPos.value);
      const figmaValue = figmaPos.value;
      const difference = Math.abs(cssValue - figmaValue);
      
      if (difference > tolerance) {
        issues.push({
          type: 'positioning-error',
          property: cssPos.name,
          cssValue: cssValue,
          figmaValue: figmaValue,
          difference: difference,
          element: cssPos.element || 'root',
          severity: difference > 5 ? 'high' : 'medium'
        });
      }
    }
  });

  // Check dimension accuracy
  cssValues.dimensions.forEach(cssDim => {
    const figmaDim = figmaValues.dimensions.find(fd => 
      fd.name === cssDim.name && (!cssDim.element || fd.element === cssDim.element)
    );
    
    if (figmaDim) {
      const cssValue = parseFloat(cssDim.value);
      const figmaValue = figmaDim.value;
      const difference = Math.abs(cssValue - figmaValue);
      
      if (difference > tolerance) {
        issues.push({
          type: 'dimension-error',
          property: cssDim.name,
          cssValue: cssValue,
          figmaValue: figmaValue,
          difference: difference,
          element: cssDim.element || 'root',
          severity: difference > 5 ? 'high' : 'medium'
        });
      }
    }
  });

  // Check alignment group violations
  if (alignmentAnalysis.alignmentGroups) {
    Object.keys(alignmentAnalysis.alignmentGroups).forEach(alignmentType => {
      const group = alignmentAnalysis.alignmentGroups[alignmentType];
      
      if (group.length > 1) {
        // Check if aligned elements in Figma are also aligned in CSS
        const cssAlignmentCheck = checkCSSAlignment(group, cssValues, alignmentType);
        if (!cssAlignmentCheck.isAligned) {
          issues.push({
            type: 'alignment-group-violation',
            alignmentType: alignmentType,
            elements: group.map(g => g.node.name),
            violations: cssAlignmentCheck.violations,
            severity: 'high'
          });
        }
      }
    });
  }

  return issues;
}

/**
 * Check if CSS values maintain alignment groups from Figma
 * @param {Array} alignmentGroup - Group of aligned elements
 * @param {Object} cssValues - Extracted CSS values
 * @param {string} alignmentType - Type of alignment (top, left, etc.)
 * @returns {Object} Alignment check results
 */
function checkCSSAlignment(alignmentGroup, cssValues, alignmentType) {
  const result = {
    isAligned: true,
    violations: []
  };

  // Get the expected alignment value from the first element
  const expectedValue = alignmentGroup[0][`${alignmentType}Position`] || 
                       alignmentGroup[0][`${alignmentType.replace('Aligned', '')}Position`];

  if (!expectedValue) return result;

  // Check each element in the group
  alignmentGroup.forEach(groupItem => {
    const elementName = groupItem.node.name;
    
    // Find corresponding CSS value
    const cssValue = findCSSValueForElement(cssValues, elementName, alignmentType);
    
    if (cssValue) {
      const difference = Math.abs(cssValue - expectedValue);
      
      if (difference > 2) { // 2px tolerance
        result.isAligned = false;
        result.violations.push({
          element: elementName,
          expected: expectedValue,
          actual: cssValue,
          difference: difference
        });
      }
    }
  });

  return result;
}

/**
 * Find CSS value for a specific element and property
 * @param {Object} cssValues - Extracted CSS values
 * @param {string} elementName - Name of the element
 * @param {string} alignmentType - Type of alignment
 * @returns {number|null} CSS value or null if not found
 */
function findCSSValueForElement(cssValues, elementName, alignmentType) {
  // Map alignment types to CSS properties
  const propertyMap = {
    'topAligned': 'top',
    'leftAligned': 'left',
    'rightAligned': 'right',
    'bottomAligned': 'bottom'
  };

  const property = propertyMap[alignmentType];
  if (!property) return null;

  // Find the CSS value
  const allPositions = [...cssValues.positions];
  
  const matchingProperty = allPositions.find(pos => 
    pos.name === property && pos.element === elementName
  );

  if (matchingProperty) {
    return parseFloat(matchingProperty.value);
  }

  return null;
}

/**
 * Generate alignment corrections based on detected issues
 * @param {Array} alignmentIssues - Array of alignment issues
 * @param {Object} alignmentAnalysis - Alignment analysis results
 * @returns {Array} Array of corrections to apply
 */
function generateAlignmentCorrections(alignmentIssues, alignmentAnalysis) {
  const corrections = [];

  alignmentIssues.forEach(issue => {
    switch (issue.type) {
      case 'positioning-error':
      case 'dimension-error':
        corrections.push({
          type: 'value-correction',
          property: issue.property,
          element: issue.element,
          currentValue: issue.cssValue,
          correctValue: issue.figmaValue,
          reason: `Should be ${issue.figmaValue}px (currently ${issue.cssValue}px, off by ${issue.difference}px)`
        });
        break;

      case 'alignment-group-violation':
        corrections.push({
          type: 'alignment-correction',
          alignmentType: issue.alignmentType,
          elements: issue.elements,
          violations: issue.violations,
          reason: `Elements should be ${issue.alignmentType.replace('Aligned', '')}-aligned`
        });
        break;
    }
  });

  return corrections;
}

/**
 * Apply alignment corrections to generated code
 * @param {string} generatedCode - Original generated code
 * @param {Array} corrections - Array of corrections to apply
 * @returns {string} Corrected code
 */
function applyAlignmentCorrections(generatedCode, corrections) {
  let correctedCode = generatedCode;

  corrections.forEach(correction => {
    switch (correction.type) {
      case 'value-correction':
        // Replace incorrect values with correct ones
        const valueRegex = new RegExp(
          `(${correction.property}:\\s*)['"\`]?${correction.currentValue}['"\`]?`,
          'g'
        );
        correctedCode = correctedCode.replace(
          valueRegex,
          `$1'${correction.correctValue}'`
        );
        break;

      case 'alignment-correction':
        // For alignment corrections, we might need more complex replacements
        // This would depend on the specific alignment issue
        console.log('Alignment correction needed:', correction);
        break;
    }
  });

  return correctedCode;
}

/**
 * Generate warnings for potential alignment issues
 * @param {Object} cssValues - Extracted CSS values
 * @param {Object} figmaValues - Extracted Figma values
 * @param {Object} alignmentAnalysis - Alignment analysis results
 * @returns {Array} Array of warnings
 */
function generateAlignmentWarnings(cssValues, figmaValues, alignmentAnalysis) {
  const warnings = [];

  // Check for missing alignment properties
  if (alignmentAnalysis.alignmentGroups.leftAligned.length > 1) {
    warnings.push({
      type: 'missing-alignment',
      message: 'Multiple left-aligned elements detected. Consider using flexbox for better control.',
      severity: 'low'
    });
  }

  // Check for hardcoded values that could be responsive
  cssValues.positions.forEach(pos => {
    if (pos.name === 'left' || pos.name === 'top') {
      const value = parseFloat(pos.value);
      if (value > 1000) {
        warnings.push({
          type: 'large-positioning',
          message: `Large ${pos.name} value (${value}px) detected. Consider responsive alternatives.`,
          severity: 'medium'
        });
      }
    }
  });

  // Check for inconsistent spacing
  if (alignmentAnalysis.alignmentPatterns.consistentSpacing) {
    warnings.push({
      type: 'spacing-opportunity',
      message: `Consistent spacing detected. Consider using CSS gap or margin for better maintainability.`,
      severity: 'low'
    });
  }

  return warnings;
}

/**
 * Generate suggested fixes based on alignment analysis
 * @param {Object} alignmentAnalysis - Alignment analysis results
 * @returns {Array} Array of suggested fixes
 */
function generateSuggestedFixes(alignmentAnalysis) {
  const suggestions = [];

  if (alignmentAnalysis.alignmentPatterns.flexboxCandidate) {
    suggestions.push({
      type: 'flexbox-layout',
      description: 'Consider using flexbox for better alignment control',
      reason: alignmentAnalysis.alignmentPatterns.flexboxCandidate.reason,
      priority: 'high'
    });
  }

  if (alignmentAnalysis.alignmentPatterns.consistentSpacing) {
    suggestions.push({
      type: 'consistent-spacing',
      description: 'Use consistent spacing values',
      value: alignmentAnalysis.alignmentPatterns.consistentSpacing.value,
      priority: 'medium'
    });
  }

  if (alignmentAnalysis.alignmentPatterns.gridPattern) {
    suggestions.push({
      type: 'grid-layout',
      description: 'Consider CSS Grid for this layout',
      pattern: alignmentAnalysis.alignmentPatterns.gridPattern,
      priority: 'high'
    });
  }

  return suggestions;
}
