/**
 * Component Pattern Detection System
 * @fileoverview Analyzes Figma nodes to identify common UI component patterns
 */

/**
 * Detects the type of UI component represented by a Figma node
 * 
 * @param {Object} figmaNode - Figma node object with properties like type, width, height, etc.
 * @param {string} figmaNode.type - Node type: 'RECTANGLE' | 'TEXT' | 'FRAME' | 'GROUP'
 * @param {number} figmaNode.width - Width in pixels
 * @param {number} figmaNode.height - Height in pixels
 * @param {Array} figmaNode.fills - Array of fill objects with color information
 * @param {Array} figmaNode.strokes - Array of stroke objects with border information
 * @param {number} figmaNode.cornerRadius - Border radius in pixels
 * @param {Array} figmaNode.children - Array of child nodes
 * @param {string} figmaNode.name - Layer name from Figma
 * @param {string} figmaNode.characters - Text content (for TEXT nodes)
 * 
 * @returns {Object} Detection result object
 * @returns {string} returns.componentType - Detected component type: 'button' | 'card' | 'input' | 'badge' | 'avatar' | 'container' | 'unknown'
 * @returns {number} returns.confidence - Confidence score (0-100 percentage)
 * @returns {string} returns.reasoning - Human-readable explanation of detection
 * @returns {string} returns.suggestedLibrary - Recommended UI library: 'shadcn' | 'mui' | 'chakra' | 'custom'
 * 
 * @example
 * const figmaButton = {
 *   type: 'RECTANGLE',
 *   name: 'Submit Button',
 *   width: 120,
 *   height: 40,
 *   cornerRadius: 8,
 *   fills: [{ color: { r: 0.23, g: 0.51, b: 0.96 } }],
 *   children: [{ type: 'TEXT', characters: 'Submit' }]
 * };
 * 
 * const result = detectComponentPattern(figmaButton);
 * // Returns:
 * // {
 * //   componentType: 'button',
 * //   confidence: 95,
 * //   reasoning: 'Has text child, appropriate size, rounded corners, solid color. Name contains "Button".',
 * //   suggestedLibrary: 'shadcn'
 * // }
 */
export function detectComponentPattern(figmaNode) {
  if (!figmaNode || typeof figmaNode !== 'object') {
    return {
      componentType: 'unknown',
      confidence: 0,
      reasoning: 'Invalid or missing Figma node',
      suggestedLibrary: 'custom'
    };
  }

  const {
    type,
    width = 0,
    height = 0,
    fills = [],
    strokes = [],
    cornerRadius = 0,
    children = [],
    name = ''
  } = figmaNode;

  // Helper function to extract color from fill
  const getFillColor = (fills) => {
    if (!fills || fills.length === 0) return null;
    const fill = fills[0];
    if (fill.color) {
      const { r, g, b } = fill.color;
      return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    }
    return null;
  };

  // Helper function to check if node has text content
  const hasTextContent = (node) => {
    if (node.type === 'TEXT' && node.characters && node.characters.trim()) {
      return true;
    }
    if (node.children && Array.isArray(node.children)) {
      return node.children.some(child => hasTextContent(child));
    }
    return false;
  };

  // Helper function to get text content
  const getTextContent = (node) => {
    if (node.type === 'TEXT' && node.characters) {
      return node.characters.trim();
    }
    if (node.children && Array.isArray(node.children)) {
      const textChild = node.children.find(child => child.type === 'TEXT');
      return textChild ? textChild.characters?.trim() : '';
    }
    return '';
  };

  // Helper function to check if name contains component type
  const nameContainsType = (name, type) => {
    const lowerName = name.toLowerCase();
    const typeKeywords = {
      button: ['button', 'btn'],
      card: ['card', 'panel', 'box'],
      input: ['input', 'field', 'textbox', 'textfield'],
      badge: ['badge', 'tag', 'label', 'chip'],
      avatar: ['avatar', 'profile', 'user', 'icon'],
      container: ['container', 'wrapper', 'layout', 'section']
    };
    return typeKeywords[type]?.some(keyword => lowerName.includes(keyword)) || false;
  };

  // Helper function to suggest UI library
  const suggestLibrary = (componentType, confidence) => {
    if (confidence < 70) return 'custom';
    
    const libraryMap = {
      button: 'shadcn',
      card: 'shadcn',
      input: 'shadcn',
      badge: 'shadcn',
      avatar: 'shadcn',
      container: 'custom'
    };
    
    return libraryMap[componentType] || 'custom';
  };

  // BUTTON Detection
  const detectButton = () => {
    let confidence = 0;
    const reasons = [];

    // Size criteria
    if (height >= 32 && height <= 64 && width >= 60 && width <= 300) {
      confidence += 20;
      reasons.push('appropriate button size');
    }

    // Has text content
    if (hasTextContent(figmaNode)) {
      confidence += 25;
      reasons.push('has text content');
    }

    // Has rounded corners
    if (cornerRadius > 0) {
      confidence += 15;
      reasons.push('rounded corners');
    }

    // Has solid background
    if (fills.length > 0 && fills[0].type === 'SOLID') {
      confidence += 15;
      reasons.push('solid background color');
    }

    // Has border or shadow
    if (strokes.length > 0 || fills.some(fill => fill.type === 'DROP_SHADOW')) {
      confidence += 10;
      reasons.push('has border or shadow');
    }

    // Name hint
    if (nameContainsType(name, 'button')) {
      confidence += 15;
      reasons.push('name contains "button"');
    }

    return { confidence, reasons };
  };

  // CARD Detection
  const detectCard = () => {
    let confidence = 0;
    const reasons = [];

    // Is container type
    if (type === 'FRAME' || type === 'GROUP') {
      confidence += 15;
      reasons.push('is container (FRAME/GROUP)');
    }

    // Has multiple children
    if (children.length >= 2) {
      confidence += 20;
      reasons.push('has multiple children');
    }

    // Has appropriate size
    if (width > 200 && height > 100) {
      confidence += 15;
      reasons.push('card-like dimensions');
    }

    // Has rounded corners
    if (cornerRadius >= 8 && cornerRadius <= 16) {
      confidence += 15;
      reasons.push('rounded corners');
    }

    // Has shadow
    if (fills.some(fill => fill.type === 'DROP_SHADOW')) {
      confidence += 10;
      reasons.push('has shadow');
    }

    // Has padding (detected by child positioning)
    const hasPadding = children.some(child => 
      child.absoluteBoundingBox && 
      (child.absoluteBoundingBox.x > figmaNode.absoluteBoundingBox?.x + 10 ||
       child.absoluteBoundingBox.y > figmaNode.absoluteBoundingBox?.y + 10)
    );
    if (hasPadding) {
      confidence += 15;
      reasons.push('has internal padding');
    }

    // Name hint
    if (nameContainsType(name, 'card')) {
      confidence += 10;
      reasons.push('name contains "card"');
    }

    return { confidence, reasons };
  };

  // INPUT Detection
  const detectInput = () => {
    let confidence = 0;
    const reasons = [];

    // Size criteria - inputs are typically wider and have specific height range
    if (height >= 32 && height <= 56 && width >= 150) {
      confidence += 25;
      reasons.push('appropriate input size');
    }

    // Has border (inputs almost always have borders)
    if (strokes.length > 0) {
      confidence += 25;
      reasons.push('has border');
    }

    // Light background (inputs typically have light/white backgrounds)
    const fillColor = getFillColor(fills);
    if (fillColor && (fillColor.includes('255, 255, 255') || fillColor.includes('248, 250, 252') || fillColor.includes('249, 250, 251'))) {
      confidence += 20;
      reasons.push('light background');
    }

    // May have placeholder text
    const textContent = getTextContent(figmaNode);
    if (textContent && (textContent.includes('Enter') || textContent.includes('Type') || textContent.includes('Placeholder') || textContent.includes('Search'))) {
      confidence += 15;
      reasons.push('has placeholder-like text');
    }

    // Name hint (very important for inputs)
    if (nameContainsType(name, 'input')) {
      confidence += 30;
      reasons.push('name contains "input"');
    }

    // Inputs typically have minimal corner radius
    if (cornerRadius <= 8) {
      confidence += 10;
      reasons.push('minimal corner radius (typical for inputs)');
    }

    return { confidence, reasons };
  };

  // BADGE Detection
  const detectBadge = () => {
    let confidence = 0;
    const reasons = [];

    // Small size
    if (width < 100 && height < 40 && width > 20 && height > 16) {
      confidence += 25;
      reasons.push('small badge-like size');
    }

    // Has text content
    if (hasTextContent(figmaNode)) {
      confidence += 20;
      reasons.push('has text content');
    }

    // High corner radius (pill shape)
    if (cornerRadius >= height / 2 || cornerRadius >= 16) {
      confidence += 20;
      reasons.push('pill-shaped or highly rounded');
    }

    // Bright or muted background
    const fillColor = getFillColor(fills);
    if (fillColor) {
      confidence += 10;
      reasons.push('has background color');
    }

    // Name hint
    if (nameContainsType(name, 'badge')) {
      confidence += 15;
      reasons.push('name contains "badge"');
    }

    return { confidence, reasons };
  };

  // AVATAR Detection
  const detectAvatar = () => {
    let confidence = 0;
    const reasons = [];

    // Name hint is REQUIRED for avatar detection (most important)
    if (nameContainsType(name, 'avatar')) {
      confidence += 40;
      reasons.push('name contains "avatar"');
    } else {
      // Without name hint, avatar detection should be very low confidence
      confidence -= 20;
      return { confidence: Math.max(confidence, 0), reasons };
    }

    // Square or circle
    const isSquare = Math.abs(width - height) <= 5;
    const isCircle = cornerRadius >= width / 2;
    
    if (isSquare || isCircle) {
      confidence += 20;
      reasons.push(isCircle ? 'circular shape' : 'square shape');
    }

    // Very restrictive size for avatars
    if (width >= 32 && width <= 64 && height >= 32 && height <= 64) {
      confidence += 25;
      reasons.push('avatar-like size');
    } else {
      // Penalize if size is not typical for avatars
      confidence -= 15;
    }

    // Has image fill or solid color
    if (fills.length > 0) {
      confidence += 15;
      reasons.push('has fill (image or color)');
    }

    // No text or single letter/icon
    const textContent = getTextContent(figmaNode);
    if (!textContent || textContent.length <= 2) {
      confidence += 15;
      reasons.push('minimal or no text content');
    }

    return { confidence, reasons };
  };

  // CONTAINER Detection
  const detectContainer = () => {
    let confidence = 0;
    const reasons = [];

    // Is container type
    if (type === 'FRAME' || type === 'GROUP') {
      confidence += 15;
      reasons.push('is container (FRAME/GROUP)');
    }

    // Has multiple children
    if (children.length >= 2) {
      confidence += 20;
      reasons.push('has multiple children');
    }

    // Large size
    if (width > 200 || height > 200) {
      confidence += 15;
      reasons.push('large container size');
    }

    // Minimal styling
    const hasMinimalStyling = fills.length <= 1 && strokes.length === 0 && cornerRadius <= 4;
    if (hasMinimalStyling) {
      confidence += 20;
      reasons.push('minimal styling (layout container)');
    }

    // Name hint
    if (nameContainsType(name, 'container')) {
      confidence += 10;
      reasons.push('name contains "container"');
    }

    return { confidence, reasons };
  };

  // Run all detection algorithms
  const buttonResult = detectButton();
  const cardResult = detectCard();
  const inputResult = detectInput();
  const badgeResult = detectBadge();
  const avatarResult = detectAvatar();
  const containerResult = detectContainer();

  // Find the best match
  const results = [
    { type: 'button', confidence: buttonResult.confidence, reasons: buttonResult.reasons },
    { type: 'card', confidence: cardResult.confidence, reasons: cardResult.reasons },
    { type: 'input', confidence: inputResult.confidence, reasons: inputResult.reasons },
    { type: 'badge', confidence: badgeResult.confidence, reasons: badgeResult.reasons },
    { type: 'avatar', confidence: avatarResult.confidence, reasons: avatarResult.reasons },
    { type: 'container', confidence: containerResult.confidence, reasons: containerResult.reasons }
  ];

  // Sort by confidence and take the best match
  results.sort((a, b) => b.confidence - a.confidence);
  const bestMatch = results[0];

  // If confidence is too low, return unknown
  if (bestMatch.confidence < 50) {
    return {
      componentType: 'unknown',
      confidence: 0,
      reasoning: 'Does not match any known component patterns',
      suggestedLibrary: 'custom'
    };
  }

  return {
    componentType: bestMatch.type,
    confidence: Math.min(bestMatch.confidence, 100),
    reasoning: bestMatch.reasons.join(', '),
    suggestedLibrary: suggestLibrary(bestMatch.type, bestMatch.confidence)
  };
}
