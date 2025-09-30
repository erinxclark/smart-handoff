/**
 * Design Token Extractor
 * 
 * Automatically identifies and categorizes all design tokens (colors, spacing, typography, etc.)
 * used in a selected Figma component to help developers understand the design system.
 */

/**
 * Convert RGB color to hex format
 * @param {Object} color - RGB color object with r, g, b properties
 * @returns {string} Hex color string
 */
function rgbToHex(color) {
  const { r, g, b } = color;
  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Extract all colors from a Figma node and its children
 * @param {Object} node - Figma node
 * @param {Map} colors - Map to store color data (for recursion)
 * @returns {Array} Array of color objects with hex, count, and usage
 */
function extractColors(node, colors = new Map()) {
  if (!node) return [];

  // Background colors
  if (node.fills) {
    node.fills.forEach(fill => {
      if (fill.type === 'SOLID' && fill.color) {
        const hex = rgbToHex(fill.color);
        const existing = colors.get(hex) || { hex, count: 0, usage: [] };
        existing.count++;
        existing.usage.push('background');
        colors.set(hex, existing);
      }
    });
  }

  // Text colors
  if (node.type === 'TEXT' && node.fills) {
    node.fills.forEach(fill => {
      if (fill.type === 'SOLID' && fill.color) {
        const hex = rgbToHex(fill.color);
        const existing = colors.get(hex) || { hex, count: 0, usage: [] };
        existing.count++;
        existing.usage.push('text');
        colors.set(hex, existing);
      }
    });
  }

  // Border colors
  if (node.strokes) {
    node.strokes.forEach(stroke => {
      if (stroke.color) {
        const hex = rgbToHex(stroke.color);
        const existing = colors.get(hex) || { hex, count: 0, usage: [] };
        existing.count++;
        existing.usage.push('border');
        colors.set(hex, existing);
      }
    });
  }

  // Shadow colors from effects
  if (node.effects) {
    node.effects.forEach(effect => {
      if (effect.visible !== false && effect.color) {
        const hex = rgbToHex(effect.color);
        const existing = colors.get(hex) || { hex, count: 0, usage: [] };
        existing.count++;
        existing.usage.push('shadow');
        colors.set(hex, existing);
      }
    });
  }

  // Recurse through children
  if (node.children) {
    node.children.forEach(child => extractColors(child, colors));
  }

  // Clean up usage arrays (remove duplicates)
  colors.forEach(color => {
    color.usage = [...new Set(color.usage)];
  });

  return Array.from(colors.values()).sort((a, b) => b.count - a.count);
}

/**
 * Extract spacing values from node layout
 * @param {Object} node - Figma node
 * @returns {Array} Array of spacing values in pixels
 */
function extractSpacing(node) {
  const spacingValues = new Set();
  
  if (!node || !node.children) return [];

  // Calculate gaps between sibling elements
  if (node.children.length > 1) {
    for (let i = 0; i < node.children.length - 1; i++) {
      const current = node.children[i];
      const next = node.children[i + 1];
      
      if (current.absoluteBoundingBox && next.absoluteBoundingBox) {
        // Horizontal gap
        const hGap = next.absoluteBoundingBox.x - 
                     (current.absoluteBoundingBox.x + current.absoluteBoundingBox.width);
        if (hGap > 0) spacingValues.add(Math.round(hGap));
        
        // Vertical gap
        const vGap = next.absoluteBoundingBox.y - 
                     (current.absoluteBoundingBox.y + current.absoluteBoundingBox.height);
        if (vGap > 0) spacingValues.add(Math.round(vGap));
      }
    }
    
    // Padding (distance from parent edge to first child)
    if (node.children[0] && node.children[0].absoluteBoundingBox && node.absoluteBoundingBox) {
      const firstChild = node.children[0];
      const parent = node.absoluteBoundingBox;
      
      // Left padding
      const leftPadding = firstChild.absoluteBoundingBox.x - parent.x;
      if (leftPadding > 0) spacingValues.add(Math.round(leftPadding));
      
      // Top padding
      const topPadding = firstChild.absoluteBoundingBox.y - parent.y;
      if (topPadding > 0) spacingValues.add(Math.round(topPadding));
    }
  }

  // Extract padding from style properties if available
  if (node.paddingLeft) spacingValues.add(Math.round(node.paddingLeft));
  if (node.paddingTop) spacingValues.add(Math.round(node.paddingTop));
  if (node.paddingRight) spacingValues.add(Math.round(node.paddingRight));
  if (node.paddingBottom) spacingValues.add(Math.round(node.paddingBottom));

  return Array.from(spacingValues).sort((a, b) => a - b);
}

/**
 * Extract typography information from text nodes
 * @param {Object} node - Figma node
 * @param {Map} fonts - Map to store font data (for recursion)
 * @returns {Array} Array of typography objects
 */
function extractTypography(node, fonts = new Map()) {
  if (!node) return [];

  if (node.type === 'TEXT' && node.style) {
    const key = `${node.style.fontFamily}-${node.style.fontSize}-${node.style.fontWeight || 'normal'}`;
    const existing = fonts.get(key) || {
      family: node.style.fontFamily,
      size: node.style.fontSize,
      weight: node.style.fontWeight || 'normal',
      lineHeight: node.style.lineHeightPx,
      letterSpacing: node.style.letterSpacing,
      count: 0
    };
    existing.count++;
    fonts.set(key, existing);
  }

  // Recurse through children
  if (node.children) {
    node.children.forEach(child => extractTypography(child, fonts));
  }

  return Array.from(fonts.values()).sort((a, b) => b.count - a.count);
}

/**
 * Extract border and radius values
 * @param {Object} node - Figma node
 * @param {Object} borders - Object to store border data (for recursion)
 * @returns {Object} Object with widths and radii arrays
 */
function extractBorders(node, borders = { widths: new Set(), radii: new Set() }) {
  if (!node) return { widths: [], radii: [] };

  // Border widths
  if (node.strokeWeight && node.strokeWeight > 0) {
    borders.widths.add(Math.round(node.strokeWeight));
  }

  // Border radius
  if (node.cornerRadius && node.cornerRadius > 0) {
    borders.radii.add(Math.round(node.cornerRadius));
  }

  // Individual corner radius
  if (node.rectangleCornerRadii) {
    node.rectangleCornerRadii.forEach(radius => {
      if (radius > 0) borders.radii.add(Math.round(radius));
    });
  }

  // Recurse through children
  if (node.children) {
    node.children.forEach(child => extractBorders(child, borders));
  }

  return {
    widths: Array.from(borders.widths).sort((a, b) => a - b),
    radii: Array.from(borders.radii).sort((a, b) => a - b)
  };
}

/**
 * Extract effects (shadows, blurs, etc.)
 * @param {Object} node - Figma node
 * @param {Array} effects - Array to store effects (for recursion)
 * @returns {Array} Array of effect objects
 */
function extractEffects(node, effects = []) {
  if (!node) return [];

  if (node.effects) {
    node.effects.forEach(effect => {
      if (effect.visible !== false) {
        effects.push({
          type: effect.type,
          radius: effect.radius || 0,
          color: effect.color ? rgbToHex(effect.color) : null,
          offset: effect.offset || { x: 0, y: 0 },
          spread: effect.spread || 0,
          opacity: effect.opacity || 1
        });
      }
    });
  }

  // Recurse through children
  if (node.children) {
    node.children.forEach(child => extractEffects(child, effects));
  }

  return effects;
}

/**
 * Detect spacing consistency patterns
 * @param {Array} spacingValues - Array of spacing values
 * @returns {Object} Pattern analysis results
 */
function analyzeSpacingPattern(spacingValues) {
  if (spacingValues.length === 0) return null;

  // Check for common grid systems
  const commonGrids = [4, 8, 12, 16];
  const patterns = {};

  commonGrids.forEach(grid => {
    const matches = spacingValues.filter(value => value % grid === 0).length;
    if (matches > 0) {
      patterns[grid] = {
        grid,
        matches,
        percentage: (matches / spacingValues.length) * 100
      };
    }
  });

  // Find the best grid match
  const bestPattern = Object.values(patterns).reduce((best, current) => {
    return current.percentage > best.percentage ? current : best;
  }, { grid: null, matches: 0, percentage: 0 });

  return {
    detected: bestPattern.percentage > 60,
    grid: bestPattern.grid,
    confidence: bestPattern.percentage,
    allPatterns: patterns
  };
}

/**
 * Main function to extract all design tokens from a Figma node
 * @param {Object} figmaNode - Figma node to analyze
 * @returns {Object} Complete design token analysis
 */
export function extractDesignTokens(figmaNode) {
  if (!figmaNode) {
    return {
      colors: [],
      spacing: [],
      typography: [],
      borders: { widths: [], radii: [] },
      effects: [],
      spacingPattern: null,
      summary: {
        totalColors: 0,
        totalSpacingValues: 0,
        totalFontStyles: 0,
        totalBorderWidths: 0,
        totalBorderRadii: 0,
        totalEffects: 0
      }
    };
  }

  console.log('🎨 TOKEN EXTRACTION: Starting analysis for', figmaNode.name);

  const colors = extractColors(figmaNode);
  const spacing = extractSpacing(figmaNode);
  const typography = extractTypography(figmaNode);
  const borders = extractBorders(figmaNode);
  const effects = extractEffects(figmaNode);
  const spacingPattern = analyzeSpacingPattern(spacing);

  const summary = {
    totalColors: colors.length,
    totalSpacingValues: spacing.length,
    totalFontStyles: typography.length,
    totalBorderWidths: borders.widths.length,
    totalBorderRadii: borders.radii.length,
    totalEffects: effects.length
  };

  console.log('🎨 TOKEN EXTRACTION: Analysis complete', summary);

  return {
    colors,
    spacing,
    typography,
    borders,
    effects,
    spacingPattern,
    summary
  };
}

/**
 * Export design tokens as CSS variables
 * @param {Object} tokens - Design token object
 * @returns {string} CSS string with custom properties
 */
export function exportTokensAsCSS(tokens) {
  let css = ':root {\n  /* Design Tokens Generated by Smart Handoff */\n\n';
  
  // Colors
  if (tokens.colors.length > 0) {
    css += '  /* Colors */\n';
    tokens.colors.forEach((color, index) => {
      const name = `color-${index + 1}`;
      css += `  --${name}: ${color.hex};\n`;
    });
    css += '\n';
  }
  
  // Spacing
  if (tokens.spacing.length > 0) {
    css += '  /* Spacing */\n';
    tokens.spacing.forEach((value, index) => {
      const name = `spacing-${index + 1}`;
      css += `  --${name}: ${value}px;\n`;
    });
    css += '\n';
  }
  
  // Typography
  if (tokens.typography.length > 0) {
    css += '  /* Typography */\n';
    tokens.typography.forEach((font, index) => {
      const baseName = `font-${index + 1}`;
      css += `  --${baseName}-family: ${font.family};\n`;
      css += `  --${baseName}-size: ${font.size}px;\n`;
      css += `  --${baseName}-weight: ${font.weight};\n`;
      if (font.lineHeight) css += `  --${baseName}-line-height: ${font.lineHeight}px;\n`;
      if (font.letterSpacing) css += `  --${baseName}-letter-spacing: ${font.letterSpacing}px;\n`;
    });
    css += '\n';
  }
  
  // Border radius
  if (tokens.borders.radii.length > 0) {
    css += '  /* Border Radius */\n';
    tokens.borders.radii.forEach((value, index) => {
      const name = `radius-${index + 1}`;
      css += `  --${name}: ${value}px;\n`;
    });
    css += '\n';
  }
  
  // Border widths
  if (tokens.borders.widths.length > 0) {
    css += '  /* Border Widths */\n';
    tokens.borders.widths.forEach((value, index) => {
      const name = `border-width-${index + 1}`;
      css += `  --${name}: ${value}px;\n`;
    });
    css += '\n';
  }
  
  css += '}\n';
  
  return css;
}

/**
 * Export design tokens as JSON for design systems
 * @param {Object} tokens - Design token object
 * @returns {string} JSON string
 */
export function exportTokensAsJSON(tokens) {
  const designTokens = {
    colors: tokens.colors.reduce((acc, color, index) => {
      acc[`color-${index + 1}`] = {
        value: color.hex,
        type: 'color',
        usage: color.usage,
        count: color.count
      };
      return acc;
    }, {}),
    
    spacing: tokens.spacing.reduce((acc, value, index) => {
      acc[`spacing-${index + 1}`] = {
        value: `${value}px`,
        type: 'spacing'
      };
      return acc;
    }, {}),
    
    typography: tokens.typography.reduce((acc, font, index) => {
      acc[`font-${index + 1}`] = {
        family: font.family,
        size: `${font.size}px`,
        weight: font.weight,
        lineHeight: font.lineHeight ? `${font.lineHeight}px` : undefined,
        letterSpacing: font.letterSpacing ? `${font.letterSpacing}px` : undefined,
        type: 'typography'
      };
      return acc;
    }, {}),
    
    borders: {
      radius: tokens.borders.radii.reduce((acc, value, index) => {
        acc[`radius-${index + 1}`] = {
          value: `${value}px`,
          type: 'border-radius'
        };
        return acc;
      }, {}),
      width: tokens.borders.widths.reduce((acc, value, index) => {
        acc[`width-${index + 1}`] = {
          value: `${value}px`,
          type: 'border-width'
        };
        return acc;
      }, {})
    },
    
    effects: tokens.effects.reduce((acc, effect, index) => {
      acc[`effect-${index + 1}`] = {
        type: effect.type,
        radius: `${effect.radius}px`,
        color: effect.color,
        offset: effect.offset,
        spread: `${effect.spread}px`,
        opacity: effect.opacity
      };
      return acc;
    }, {}),
    
    meta: {
      spacingPattern: tokens.spacingPattern,
      summary: tokens.summary,
      generatedAt: new Date().toISOString(),
      generatedBy: 'Smart Handoff'
    }
  };
  
  return JSON.stringify(designTokens, null, 2);
}

/**
 * Download a file with the given content
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
