/**
 * Image Handler Utility for Figma Integration
 * @fileoverview Gracefully handles missing or unavailable images from Figma designs
 */

/**
 * Safely extracts and validates image URLs from Figma image data
 * 
 * @param {Object} figmaImageData - Figma image data object
 * @param {string} [figmaImageData.imageRef] - Figma's image reference ID
 * @param {string} [figmaImageData.url] - Potential image URL
 * @param {Array} [figmaImageData.fills] - Array of fill objects with image data
 * @returns {string} Valid image URL, empty string, or placeholder identifier
 * 
 * @example
 * const imageData = {
 *   imageRef: 'figma-image-123',
 *   url: 'https://figma.com/image/123',
 *   fills: [{ type: 'IMAGE', imageRef: 'figma-image-123' }]
 * };
 * 
 * const result = getImageUrl(imageData);
 * // Returns: '' (empty string for Figma CDN URLs we can't access)
 */
export function getImageUrl(figmaImageData) {
  if (!figmaImageData || typeof figmaImageData !== 'object') {
    console.warn('ImageHandler: Invalid image data provided');
    return '';
  }

  const { url, imageRef, fills } = figmaImageData;

  // Check for direct URL
  if (url && typeof url === 'string') {
    // Check if it's a Figma CDN URL (we can't access these without authentication)
    if (url.includes('figma.com') || url.includes('figmausercontent.com')) {
      console.warn('ImageHandler: Figma CDN URL detected - cannot access without authentication:', url);
      return '';
    }

    // Check if it's a valid external URL
    if (url.startsWith('https://') || url.startsWith('http://')) {
      // Note: We can't actually test if the URL is accessible here without making a request
      // This would require a backend service to validate image accessibility
      console.info('ImageHandler: External URL found:', url);
      return url;
    }

    console.warn('ImageHandler: Invalid URL format:', url);
    return '';
  }

  // Check fills array for image data
  if (fills && Array.isArray(fills)) {
    const imageFill = fills.find(fill => fill.type === 'IMAGE');
    if (imageFill && imageFill.imageRef) {
      console.warn('ImageHandler: Figma image reference found but no accessible URL:', imageFill.imageRef);
      return '';
    }
  }

  // Check for imageRef directly
  if (imageRef) {
    console.warn('ImageHandler: Figma image reference found but no accessible URL:', imageRef);
    return '';
  }

  console.info('ImageHandler: No image data found in provided object');
  return '';
}

/**
 * Creates inline SVG placeholder for missing images
 * 
 * @param {number} width - Width of the placeholder in pixels
 * @param {number} height - Height of the placeholder in pixels
 * @param {string} type - Type of placeholder: 'avatar' | 'photo' | 'icon' | 'generic'
 * @returns {string} Data URL for inline SVG placeholder
 * 
 * @example
 * const avatarPlaceholder = createImageFallback(48, 48, 'avatar');
 * // Returns: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgi...'
 */
export function createImageFallback(width = 100, height = 100, type = 'generic') {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  
  let svgContent = '';

  switch (type.toLowerCase()) {
    case 'avatar':
      svgContent = createAvatarPlaceholder(safeWidth, safeHeight);
      break;
    case 'photo':
      svgContent = createPhotoPlaceholder(safeWidth, safeHeight);
      break;
    case 'icon':
      svgContent = createIconPlaceholder(safeWidth, safeHeight);
      break;
    default:
      svgContent = createGenericPlaceholder(safeWidth, safeHeight);
  }

  // Convert SVG to data URL
  const encodedSvg = encodeURIComponent(svgContent);
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
}

/**
 * Helper function to create avatar placeholder SVG
 */
function createAvatarPlaceholder(width, height) {
  const size = Math.min(width, height);
  const radius = size / 2;
  const fontSize = Math.max(12, size / 4);
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${radius}" cy="${radius}" r="${radius}" fill="#e5e7eb" stroke="#d1d5db" stroke-width="1"/>
      <circle cx="${radius}" cy="${radius - size * 0.1}" r="${size * 0.15}" fill="#9ca3af"/>
      <path d="M ${radius - size * 0.2} ${radius + size * 0.1} Q ${radius} ${radius + size * 0.3} ${radius + size * 0.2} ${radius + size * 0.1}" fill="#9ca3af"/>
    </svg>
  `.trim();
}

/**
 * Helper function to create photo placeholder SVG
 */
function createPhotoPlaceholder(width, height) {
  const iconSize = Math.min(width, height) * 0.4;
  const iconX = (width - iconSize) / 2;
  const iconY = (height - iconSize) / 2;
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1"/>
      <rect x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" fill="#9ca3af" rx="2"/>
      <circle cx="${iconX + iconSize * 0.3}" cy="${iconY + iconSize * 0.35}" r="${iconSize * 0.08}" fill="#f3f4f6"/>
      <path d="M ${iconX + iconSize * 0.15} ${iconY + iconSize * 0.7} L ${iconX + iconSize * 0.35} ${iconY + iconSize * 0.5} L ${iconX + iconSize * 0.85} ${iconY + iconSize * 0.8}" stroke="#f3f4f6" stroke-width="2" fill="none"/>
    </svg>
  `.trim();
}

/**
 * Helper function to create icon placeholder SVG
 */
function createIconPlaceholder(width, height) {
  const iconSize = Math.min(width, height) * 0.6;
  const iconX = (width - iconSize) / 2;
  const iconY = (height - iconSize) / 2;
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f9fafb" stroke="#d1d5db" stroke-width="1" rx="4"/>
      <rect x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" fill="#e5e7eb" rx="2"/>
      <path d="M ${iconX + iconSize * 0.25} ${iconY + iconSize * 0.25} L ${iconX + iconSize * 0.75} ${iconY + iconSize * 0.75} M ${iconX + iconSize * 0.75} ${iconY + iconSize * 0.25} L ${iconX + iconSize * 0.25} ${iconY + iconSize * 0.75}" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `.trim();
}

/**
 * Helper function to create generic placeholder SVG
 */
function createGenericPlaceholder(width, height) {
  const fontSize = Math.max(10, Math.min(width, height) / 8);
  const textX = width / 2;
  const textY = height / 2 + fontSize / 3;
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f9fafb" stroke="#d1d5db" stroke-width="1"/>
      <text x="${textX}" y="${textY}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${fontSize}" fill="#6b7280">${width}×${height}</text>
    </svg>
  `.trim();
}

/**
 * Extracts and safely handles image fills from Figma nodes
 * 
 * @param {Object} figmaNode - Figma node object
 * @param {Array} [figmaNode.fills] - Array of fill objects
 * @param {string} [figmaNode.name] - Node name for context
 * @param {number} [figmaNode.width] - Node width for placeholder
 * @param {number} [figmaNode.height] - Node height for placeholder
 * @returns {Object} Style object with background image properties
 * 
 * @example
 * const figmaNode = {
 *   name: 'User Avatar',
 *   width: 48,
 *   height: 48,
 *   fills: [{ type: 'IMAGE', imageRef: 'figma-image-123' }]
 * };
 * 
 * const styles = getImageStyle(figmaNode);
 * // Returns: { 
 * //   backgroundImage: 'url("data:image/svg+xml;charset=utf-8,...")',
 * //   backgroundSize: 'cover',
 * //   backgroundPosition: 'center'
 * // }
 */
export function getImageStyle(figmaNode) {
  if (!figmaNode || typeof figmaNode !== 'object') {
    console.warn('ImageHandler: Invalid Figma node provided');
    return {};
  }

  const { fills = [], name = '', width = 100, height = 100 } = figmaNode;

  // Find image fills
  const imageFills = fills.filter(fill => fill.type === 'IMAGE');
  
  if (imageFills.length === 0) {
    return {};
  }

  const imageFill = imageFills[0];
  const imageUrl = getImageUrl({ fills: [imageFill] });

  // Determine placeholder type based on node name and dimensions
  const placeholderType = determinePlaceholderType(name, width, height);

  const styles = {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  if (imageUrl) {
    // Valid external URL
    styles.backgroundImage = `url("${imageUrl}")`;
    console.info('ImageHandler: Using external image URL for node:', name);
  } else {
    // Use placeholder
    const placeholderUrl = createImageFallback(width, height, placeholderType);
    styles.backgroundImage = `url("${placeholderUrl}")`;
    console.warn('ImageHandler: Using placeholder for node:', name);
  }

  return styles;
}

/**
 * Determines the appropriate placeholder type based on node properties
 */
function determinePlaceholderType(name, width, height) {
  const lowerName = name.toLowerCase();
  
  // Check for specific component types
  if (lowerName.includes('avatar') || lowerName.includes('profile')) {
    return 'avatar';
  }
  
  if (lowerName.includes('photo') || lowerName.includes('image') || lowerName.includes('picture')) {
    return 'photo';
  }
  
  if (lowerName.includes('icon') || (width <= 32 && height <= 32)) {
    return 'icon';
  }
  
  // Check dimensions for avatar-like shapes
  if (Math.abs(width - height) <= 5 && width <= 80) {
    return 'avatar';
  }
  
  return 'generic';
}

/**
 * Generates React JSX with proper image handling and placeholder comments
 * 
 * @param {Object} figmaNode - Figma node with image data
 * @param {string} componentName - Name for the generated component
 * @returns {Object} Object with JSX string and metadata
 * 
 * @example
 * const result = generateImageJSX(figmaNode, 'UserAvatar');
 * // Returns:
 * // {
 * //   jsx: '<div style={{...}} data-placeholder="true" />',
 * //   hasPlaceholder: true,
 * //   figmaRef: 'figma-image-123',
 * //   comments: ['// Image unavailable - using placeholder', '// TODO: Replace with actual image URL']
 * // }
 */
export function generateImageJSX(figmaNode, componentName = 'Component') {
  if (!figmaNode || typeof figmaNode !== 'object') {
    return {
      jsx: `<div className="${componentName.toLowerCase()}-placeholder" />`,
      hasPlaceholder: true,
      figmaRef: null,
      comments: ['// Invalid Figma node provided']
    };
  }

  const { fills = [], name = '', width = 100, height = 100 } = figmaNode;
  const imageFills = fills.filter(fill => fill.type === 'IMAGE');
  
  if (imageFills.length === 0) {
    return {
      jsx: `<div className="${componentName.toLowerCase()}" />`,
      hasPlaceholder: false,
      figmaRef: null,
      comments: []
    };
  }

  const imageFill = imageFills[0];
  const imageUrl = getImageUrl({ fills: [imageFill] });
  const styles = getImageStyle(figmaNode);
  
  const hasPlaceholder = !imageUrl;
  const figmaRef = imageFill.imageRef || 'unknown';
  
  const styleString = Object.entries(styles)
    .map(([key, value]) => `${key}: '${value}'`)
    .join(', ');

  const jsx = `<div 
  style={{${styleString}, width: '${width}px', height: '${height}px'}}
  ${hasPlaceholder ? 'data-placeholder="true"' : ''}
  ${hasPlaceholder ? `data-figma-ref="${figmaRef}"` : ''}
/>`;

  const comments = [];
  if (hasPlaceholder) {
    comments.push('// Image unavailable - using placeholder');
    comments.push(`// Original Figma image: ${figmaRef}`);
    comments.push('// TODO: Replace with actual image URL');
  } else {
    comments.push(`// External image URL: ${imageUrl}`);
  }

  return {
    jsx,
    hasPlaceholder,
    figmaRef,
    comments
  };
}
