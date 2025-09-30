/**
 * Alignment Detection and Correction Utility
 * 
 * Analyzes Figma nodes to detect alignment patterns and ensures
 * pixel-perfect alignment in generated React code.
 */

/**
 * Detect alignment patterns in a Figma node and its siblings
 * @param {Object} figmaNode - The Figma node to analyze
 * @returns {Object} Alignment groups and patterns
 */
export function detectAndFixAlignment(figmaNode) {
  if (!figmaNode || !figmaNode.parent) {
    return {
      alignmentGroups: {},
      alignmentPatterns: {},
      recommendations: []
    };
  }

  const siblings = figmaNode.parent.children || [];
  const tolerance = 1; // 1px tolerance for alignment detection

  const alignmentGroups = {
    topAligned: [],     // Elements with same Y coordinate
    leftAligned: [],    // Elements with same X coordinate  
    rightAligned: [],   // Elements with same right edge
    bottomAligned: [],  // Elements with same bottom edge
    centerAligned: [],  // Elements centered relative to parent
    horizontallyCentered: [], // Elements centered horizontally
    verticallyCentered: []    // Elements centered vertically
  };

  const alignmentPatterns = {
    consistentSpacing: null,
    gridPattern: null,
    flexboxCandidate: false
  };

  const recommendations = [];

  // Analyze each sibling for alignment patterns
  siblings.forEach((child, index) => {
    if (!child.absoluteBoundingBox) return;

    const { x, y, width, height } = child.absoluteBoundingBox;
    const right = x + width;
    const bottom = y + height;
    const parentWidth = figmaNode.parent.absoluteBoundingBox?.width || 0;
    const parentHeight = figmaNode.parent.absoluteBoundingBox?.height || 0;

    // Check top alignment (same Y coordinate)
    const topAligned = siblings.filter(sibling => {
      if (sibling === child || !sibling.absoluteBoundingBox) return false;
      return Math.abs(sibling.absoluteBoundingBox.y - y) <= tolerance;
    });

    if (topAligned.length > 0) {
      alignmentGroups.topAligned.push({
        node: child,
        alignedWith: topAligned.map(s => s.id),
        yPosition: y
      });
    }

    // Check left alignment (same X coordinate)
    const leftAligned = siblings.filter(sibling => {
      if (sibling === child || !sibling.absoluteBoundingBox) return false;
      return Math.abs(sibling.absoluteBoundingBox.x - x) <= tolerance;
    });

    if (leftAligned.length > 0) {
      alignmentGroups.leftAligned.push({
        node: child,
        alignedWith: leftAligned.map(s => s.id),
        xPosition: x
      });
    }

    // Check right alignment (same right edge)
    const rightAligned = siblings.filter(sibling => {
      if (sibling === child || !sibling.absoluteBoundingBox) return false;
      const siblingRight = sibling.absoluteBoundingBox.x + sibling.absoluteBoundingBox.width;
      return Math.abs(siblingRight - right) <= tolerance;
    });

    if (rightAligned.length > 0) {
      alignmentGroups.rightAligned.push({
        node: child,
        alignedWith: rightAligned.map(s => s.id),
        rightPosition: right
      });
    }

    // Check bottom alignment (same bottom edge)
    const bottomAligned = siblings.filter(sibling => {
      if (sibling === child || !sibling.absoluteBoundingBox) return false;
      const siblingBottom = sibling.absoluteBoundingBox.y + sibling.absoluteBoundingBox.height;
      return Math.abs(siblingBottom - bottom) <= tolerance;
    });

    if (bottomAligned.length > 0) {
      alignmentGroups.bottomAligned.push({
        node: child,
        alignedWith: bottomAligned.map(s => s.id),
        bottomPosition: bottom
      });
    }

    // Check horizontal centering (centered within parent)
    const centerX = parentWidth / 2;
    const childCenterX = x + width / 2;
    if (Math.abs(childCenterX - centerX) <= tolerance) {
      alignmentGroups.horizontallyCentered.push({
        node: child,
        centerOffset: childCenterX - centerX
      });
    }

    // Check vertical centering (centered within parent)
    const centerY = parentHeight / 2;
    const childCenterY = y + height / 2;
    if (Math.abs(childCenterY - centerY) <= tolerance) {
      alignmentGroups.verticallyCentered.push({
        node: child,
        centerOffset: childCenterY - centerY
      });
    }
  });

  // Analyze spacing patterns
  const spacingAnalysis = analyzeSpacingPatterns(siblings);
  alignmentPatterns.consistentSpacing = spacingAnalysis.consistentSpacing;
  alignmentPatterns.gridPattern = spacingAnalysis.gridPattern;

  // Determine if flexbox would be beneficial
  alignmentPatterns.flexboxCandidate = shouldUseFlexbox(alignmentGroups, siblings);

  // Generate recommendations
  if (alignmentGroups.topAligned.length > 0) {
    recommendations.push({
      type: 'top-alignment',
      message: `${alignmentGroups.topAligned.length} elements are top-aligned. Use consistent top values.`,
      elements: alignmentGroups.topAligned.map(a => a.node.name)
    });
  }

  if (alignmentGroups.leftAligned.length > 0) {
    recommendations.push({
      type: 'left-alignment',
      message: `${alignmentGroups.leftAligned.length} elements are left-aligned. Consider flexbox or consistent left values.`,
      elements: alignmentGroups.leftAligned.map(a => a.node.name)
    });
  }

  if (alignmentPatterns.consistentSpacing) {
    recommendations.push({
      type: 'consistent-spacing',
      message: `Consistent ${alignmentPatterns.consistentSpacing.direction} spacing detected. Use gap: ${alignmentPatterns.consistentSpacing.value}px or margin.`,
      value: alignmentPatterns.consistentSpacing.value
    });
  }

  if (alignmentPatterns.flexboxCandidate) {
    recommendations.push({
      type: 'flexbox',
      message: 'Consider using flexbox for better alignment control and responsiveness.',
      reason: alignmentPatterns.flexboxCandidate.reason
    });
  }

  return {
    alignmentGroups,
    alignmentPatterns,
    recommendations,
    summary: generateAlignmentSummary(alignmentGroups, alignmentPatterns)
  };
}

/**
 * Analyze spacing patterns between sibling elements
 * @param {Array} siblings - Array of sibling nodes
 * @returns {Object} Spacing analysis results
 */
function analyzeSpacingPatterns(siblings) {
  const horizontalSpacings = [];
  const verticalSpacings = [];

  // Calculate horizontal spacing (between left edges)
  for (let i = 0; i < siblings.length - 1; i++) {
    const current = siblings[i];
    const next = siblings[i + 1];
    
    if (current.absoluteBoundingBox && next.absoluteBoundingBox) {
      const spacing = next.absoluteBoundingBox.x - 
        (current.absoluteBoundingBox.x + current.absoluteBoundingBox.width);
      if (spacing >= 0) { // Only positive spacing
        horizontalSpacings.push(spacing);
      }
    }
  }

  // Calculate vertical spacing (between top edges)
  for (let i = 0; i < siblings.length - 1; i++) {
    const current = siblings[i];
    const next = siblings[i + 1];
    
    if (current.absoluteBoundingBox && next.absoluteBoundingBox) {
      const spacing = next.absoluteBoundingBox.y - 
        (current.absoluteBoundingBox.y + current.absoluteBoundingBox.height);
      if (spacing >= 0) { // Only positive spacing
        verticalSpacings.push(spacing);
      }
    }
  }

  // Check for consistent spacing (within 2px tolerance)
  const consistentHorizontalSpacing = findConsistentSpacing(horizontalSpacings);
  const consistentVerticalSpacing = findConsistentSpacing(verticalSpacings);

  // Check for grid pattern
  const gridPattern = detectGridPattern(siblings);

  return {
    consistentSpacing: consistentHorizontalSpacing || consistentVerticalSpacing,
    gridPattern,
    horizontalSpacings,
    verticalSpacings
  };
}

/**
 * Find consistent spacing values in an array
 * @param {Array} spacings - Array of spacing values
 * @returns {Object|null} Consistent spacing info or null
 */
function findConsistentSpacing(spacings) {
  if (spacings.length < 2) return null;

  // Group spacings by rounded values (within 2px tolerance)
  const groups = {};
  spacings.forEach(spacing => {
    const rounded = Math.round(spacing);
    if (!groups[rounded]) {
      groups[rounded] = [];
    }
    groups[rounded].push(spacing);
  });

  // Find the group with the most elements
  let maxGroup = null;
  let maxCount = 0;
  
  Object.keys(groups).forEach(rounded => {
    if (groups[rounded].length > maxCount) {
      maxCount = groups[rounded].length;
      maxGroup = {
        value: parseFloat(rounded),
        count: groups[rounded].length,
        total: spacings.length,
        direction: 'horizontal' // Will be updated by caller
      };
    }
  });

  // Only return if at least 70% of spacings are consistent
  if (maxGroup && maxGroup.count / maxGroup.total >= 0.7) {
    return maxGroup;
  }

  return null;
}

/**
 * Detect if siblings form a grid pattern
 * @param {Array} siblings - Array of sibling nodes
 * @returns {Object|null} Grid pattern info or null
 */
function detectGridPattern(siblings) {
  if (siblings.length < 4) return null; // Need at least 4 elements for a grid

  // Sort siblings by position
  const sortedByY = [...siblings].sort((a, b) => 
    a.absoluteBoundingBox.y - b.absoluteBoundingBox.y
  );
  // Note: sortedByX could be used for additional analysis if needed

  // Check for consistent row heights
  const rowHeights = [];
  let currentRow = [sortedByY[0]];
  
  for (let i = 1; i < sortedByY.length; i++) {
    const prev = currentRow[currentRow.length - 1];
    const current = sortedByY[i];
    
    // If Y position is significantly different, start new row
    if (current.absoluteBoundingBox.y - prev.absoluteBoundingBox.y > 10) {
      rowHeights.push(currentRow.length);
      currentRow = [current];
    } else {
      currentRow.push(current);
    }
  }
  rowHeights.push(currentRow.length);

  // Check if we have consistent row sizes
  const uniqueRowSizes = [...new Set(rowHeights)];
  if (uniqueRowSizes.length === 1 && uniqueRowSizes[0] > 1) {
    return {
      type: 'grid',
      rows: rowHeights.length,
      columns: uniqueRowSizes[0],
      totalElements: siblings.length
    };
  }

  return null;
}

/**
 * Determine if flexbox would be beneficial for this layout
 * @param {Object} alignmentGroups - Detected alignment groups
 * @param {Array} siblings - Array of sibling nodes
 * @returns {Object|null} Flexbox recommendation or null
 */
function shouldUseFlexbox(alignmentGroups, siblings) {
  const reasons = [];

  // Check for multiple left-aligned elements (good candidate for flex-row)
  if (alignmentGroups.leftAligned.length > 2) {
    reasons.push('Multiple left-aligned elements suggest flex-row layout');
  }

  // Check for multiple top-aligned elements (good candidate for flex-column)
  if (alignmentGroups.topAligned.length > 2) {
    reasons.push('Multiple top-aligned elements suggest flex-column layout');
  }

  // Check for consistent spacing (flexbox gap would be perfect)
  if (alignmentGroups.consistentSpacing) {
    reasons.push('Consistent spacing can be handled with flexbox gap');
  }

  // Check for centered elements
  if (alignmentGroups.horizontallyCentered.length > 0 || 
      alignmentGroups.verticallyCentered.length > 0) {
    reasons.push('Centered elements are easier with flexbox');
  }

  if (reasons.length > 0) {
    return {
      recommended: true,
      reason: reasons.join('. '),
      direction: alignmentGroups.leftAligned.length > alignmentGroups.topAligned.length ? 'row' : 'column'
    };
  }

  return null;
}

/**
 * Generate a summary of alignment analysis
 * @param {Object} alignmentGroups - Detected alignment groups
 * @param {Object} alignmentPatterns - Detected patterns
 * @returns {Object} Summary of alignment findings
 */
function generateAlignmentSummary(alignmentGroups, alignmentPatterns) {
  const summary = {
    totalAlignments: 0,
    alignmentTypes: [],
    recommendations: [],
    complexity: 'simple'
  };

  // Count total alignment relationships
  Object.keys(alignmentGroups).forEach(key => {
    if (alignmentGroups[key].length > 0) {
      summary.totalAlignments += alignmentGroups[key].length;
      summary.alignmentTypes.push(key);
    }
  });

  // Determine complexity
  if (summary.totalAlignments > 10) {
    summary.complexity = 'complex';
  } else if (summary.totalAlignments > 5) {
    summary.complexity = 'moderate';
  }

  // Add pattern-based recommendations
  if (alignmentPatterns.flexboxCandidate) {
    summary.recommendations.push('Consider flexbox layout');
  }

  if (alignmentPatterns.consistentSpacing) {
    summary.recommendations.push('Use consistent spacing values');
  }

  if (alignmentPatterns.gridPattern) {
    summary.recommendations.push('Consider CSS Grid layout');
  }

  return summary;
}

/**
 * Generate CSS alignment hints for the AI prompt
 * @param {Object} alignmentAnalysis - Result from detectAndFixAlignment
 * @returns {String} Formatted alignment hints for AI prompt
 */
export function generateAlignmentHints(alignmentAnalysis) {
  const { alignmentGroups, alignmentPatterns, recommendations } = alignmentAnalysis;
  
  let hints = '\nALIGNMENT ANALYSIS:\n';
  hints += '===================\n\n';

  // Add alignment groups
  Object.keys(alignmentGroups).forEach(key => {
    const group = alignmentGroups[key];
    if (group.length > 0) {
      hints += `${key.toUpperCase()}:\n`;
      group.forEach(item => {
        hints += `  - ${item.node.name}: ${JSON.stringify(item)}\n`;
      });
      hints += '\n';
    }
  });

  // Add patterns
  if (alignmentPatterns.consistentSpacing) {
    hints += `CONSISTENT SPACING: ${alignmentPatterns.consistentSpacing.value}px\n`;
  }

  if (alignmentPatterns.gridPattern) {
    hints += `GRID PATTERN: ${alignmentPatterns.gridPattern.rows}x${alignmentPatterns.gridPattern.columns}\n`;
  }

  if (alignmentPatterns.flexboxCandidate) {
    hints += `FLEXBOX RECOMMENDED: ${alignmentPatterns.flexboxCandidate.reason}\n`;
  }

  // Add recommendations
  if (recommendations.length > 0) {
    hints += '\nRECOMMENDATIONS:\n';
    recommendations.forEach(rec => {
      hints += `- ${rec.message}\n`;
    });
  }

  hints += '\nCRITICAL ALIGNMENT RULES:\n';
  hints += '- Use EXACT numerical values from Figma JSON\n';
  hints += '- Do NOT round or approximate positioning values\n';
  hints += '- Elements that align in Figma MUST align in code\n';
  hints += '- If elements share alignment, use identical CSS values\n';
  hints += '- Consider flexbox for complex alignment scenarios\n\n';

  return hints;
}
