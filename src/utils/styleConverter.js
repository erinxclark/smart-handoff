/**
 * Utility function to convert React inline style objects to Tailwind CSS classes
 * @fileoverview Converts CSS properties to their Tailwind equivalents with fallback handling
 */

/**
 * Converts a React inline style object to Tailwind CSS classes
 * 
 * @param {Object} styleObject - React inline style object with CSS properties
 * @returns {Object} Object containing className string and remaining unconverted styles
 * @returns {string} returns.className - Tailwind CSS classes as a space-separated string
 * @returns {Object} returns.remainingStyles - Styles that couldn't be converted to Tailwind
 * 
 * @example
 * const styles = {
 *   width: '477px',
 *   height: '297px',
 *   backgroundColor: '#44b24f',
 *   border: '13px solid #000000',
 *   borderRadius: '15px'
 * };
 * 
 * const result = inlineStylesToTailwind(styles);
 * // result.className = 'w-[477px] h-[297px] bg-[#44b24f] border-[13px] border-solid border-black rounded-[15px]'
 * // result.remainingStyles = {}
 */
export function inlineStylesToTailwind(styleObject) {
  if (!styleObject || typeof styleObject !== 'object') {
    return { className: '', remainingStyles: {} };
  }

  const tailwindClasses = [];
  const remainingStyles = { ...styleObject };

  // Helper function to remove processed style from remaining
  const markAsProcessed = (property) => {
    delete remainingStyles[property];
  };

  // Helper function to add class to array
  const addClass = (className) => {
    if (className) {
      tailwindClasses.push(className);
    }
  };

  // Helper function to parse pixel values for standard spacing
  const getStandardSpacing = (value) => {
    if (typeof value !== 'string' || !value.endsWith('px')) return null;
    const num = parseInt(value);
    const spacingMap = {
      0: '0',
      1: '0.5',
      2: '1',
      3: '1.5',
      4: '2',
      5: '2.5',
      6: '3',
      8: '4',
      10: '5',
      12: '6',
      14: '7',
      16: '8',
      20: '10',
      24: '12',
      32: '16',
      40: '20',
      48: '24',
      56: '28',
      64: '32',
      72: '36',
      80: '40',
      96: '48'
    };
    return spacingMap[num] || null;
  };

  // Helper function to convert color values
  const convertColor = (color, prefix = '') => {
    if (!color) return null;
    
    // Handle special cases
    if (color === '#000000' || color === '#000') return `${prefix}black`;
    if (color === '#ffffff' || color === '#fff') return `${prefix}white`;
    if (color === 'transparent') return `${prefix}transparent`;
    
    // Handle hex colors
    if (color.startsWith('#')) {
      return `${prefix}[${color}]`;
    }
    
    // Handle rgba/rgb colors
    if (color.startsWith('rgb')) {
      return `${prefix}[${color}]`;
    }
    
    return null;
  };

  // DIMENSIONS
  if (styleObject.width) {
    const width = styleObject.width;
    if (typeof width === 'string') {
      addClass(`w-[${width}]`);
    }
    markAsProcessed('width');
  }

  if (styleObject.height) {
    const height = styleObject.height;
    if (typeof height === 'string') {
      addClass(`h-[${height}]`);
    }
    markAsProcessed('height');
  }

  // COLORS
  if (styleObject.backgroundColor) {
    const bgColor = convertColor(styleObject.backgroundColor, 'bg-');
    if (bgColor) {
      addClass(bgColor);
    }
    markAsProcessed('backgroundColor');
  }

  if (styleObject.color) {
    const textColor = convertColor(styleObject.color, 'text-');
    if (textColor) {
      addClass(textColor);
    }
    markAsProcessed('color');
  }

  // BORDERS
  if (styleObject.border) {
    const border = styleObject.border;
    if (typeof border === 'string') {
      // Parse border: "width style color"
      const parts = border.split(' ');
      if (parts.length >= 3) {
        const [width, style, ...colorParts] = parts;
        const color = colorParts.join(' ');
        
        // Add border width
        addClass(`border-[${width}]`);
        
        // Add border style
        if (style === 'solid') addClass('border-solid');
        else if (style === 'dashed') addClass('border-dashed');
        else if (style === 'dotted') addClass('border-dotted');
        else if (style === 'none') addClass('border-none');
        else addClass(`border-[${style}]`);
        
        // Add border color
        const borderColor = convertColor(color, 'border-');
        if (borderColor) {
          addClass(borderColor);
        }
      }
    }
    markAsProcessed('border');
  }

  if (styleObject.borderRadius) {
    const borderRadius = styleObject.borderRadius;
    if (typeof borderRadius === 'string') {
      // Check for standard values first
      const radiusMap = {
        '0': 'rounded-none',
        '2px': 'rounded-sm',
        '4px': 'rounded',
        '6px': 'rounded-md',
        '8px': 'rounded-lg',
        '12px': 'rounded-xl',
        '16px': 'rounded-2xl',
        '24px': 'rounded-3xl',
        '9999px': 'rounded-full'
      };
      
      const standardClass = radiusMap[borderRadius];
      if (standardClass) {
        addClass(standardClass);
      } else {
        addClass(`rounded-[${borderRadius}]`);
      }
    }
    markAsProcessed('borderRadius');
  }

  // SPACING
  // Handle padding
  if (styleObject.padding) {
    const padding = styleObject.padding;
    if (typeof padding === 'string') {
      const standardPadding = getStandardSpacing(padding);
      if (standardPadding) {
        addClass(`p-${standardPadding}`);
      } else {
        addClass(`p-[${padding}]`);
      }
    }
    markAsProcessed('padding');
  }

  // Handle individual padding properties
  ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(prop => {
    if (styleObject[prop]) {
      const value = styleObject[prop];
      const prefix = prop.replace('padding', '').toLowerCase();
      const tailwindPrefix = prefix === 'top' ? 'pt' : 
                           prefix === 'right' ? 'pr' : 
                           prefix === 'bottom' ? 'pb' : 'pl';
      
      if (typeof value === 'string') {
        const standardValue = getStandardSpacing(value);
        if (standardValue) {
          addClass(`${tailwindPrefix}-${standardValue}`);
        } else {
          addClass(`${tailwindPrefix}-[${value}]`);
        }
      }
      markAsProcessed(prop);
    }
  });

  // Handle margin
  if (styleObject.margin) {
    const margin = styleObject.margin;
    if (typeof margin === 'string') {
      const standardMargin = getStandardSpacing(margin);
      if (standardMargin) {
        addClass(`m-${standardMargin}`);
      } else {
        addClass(`m-[${margin}]`);
      }
    }
    markAsProcessed('margin');
  }

  // Handle individual margin properties
  ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach(prop => {
    if (styleObject[prop]) {
      const value = styleObject[prop];
      const prefix = prop.replace('margin', '').toLowerCase();
      const tailwindPrefix = prefix === 'top' ? 'mt' : 
                           prefix === 'right' ? 'mr' : 
                           prefix === 'bottom' ? 'mb' : 'ml';
      
      if (typeof value === 'string') {
        const standardValue = getStandardSpacing(value);
        if (standardValue) {
          addClass(`${tailwindPrefix}-${standardValue}`);
        } else {
          addClass(`${tailwindPrefix}-[${value}]`);
        }
      }
      markAsProcessed(prop);
    }
  });

  // LAYOUT
  if (styleObject.display) {
    const display = styleObject.display;
    if (display === 'flex') addClass('flex');
    else if (display === 'block') addClass('block');
    else if (display === 'inline') addClass('inline');
    else if (display === 'inline-block') addClass('inline-block');
    else if (display === 'grid') addClass('grid');
    else if (display === 'hidden') addClass('hidden');
    else addClass(`[display:${display}]`);
    markAsProcessed('display');
  }

  if (styleObject.flexDirection) {
    const flexDirection = styleObject.flexDirection;
    if (flexDirection === 'row') addClass('flex-row');
    else if (flexDirection === 'column') addClass('flex-col');
    else if (flexDirection === 'row-reverse') addClass('flex-row-reverse');
    else if (flexDirection === 'column-reverse') addClass('flex-col-reverse');
    markAsProcessed('flexDirection');
  }

  if (styleObject.justifyContent) {
    const justifyContent = styleObject.justifyContent;
    if (justifyContent === 'center') addClass('justify-center');
    else if (justifyContent === 'flex-start') addClass('justify-start');
    else if (justifyContent === 'flex-end') addClass('justify-end');
    else if (justifyContent === 'space-between') addClass('justify-between');
    else if (justifyContent === 'space-around') addClass('justify-around');
    else if (justifyContent === 'space-evenly') addClass('justify-evenly');
    markAsProcessed('justifyContent');
  }

  if (styleObject.alignItems) {
    const alignItems = styleObject.alignItems;
    if (alignItems === 'center') addClass('items-center');
    else if (alignItems === 'flex-start') addClass('items-start');
    else if (alignItems === 'flex-end') addClass('items-end');
    else if (alignItems === 'stretch') addClass('items-stretch');
    else if (alignItems === 'baseline') addClass('items-baseline');
    markAsProcessed('alignItems');
  }

  // POSITION
  if (styleObject.position) {
    const position = styleObject.position;
    if (position === 'relative') addClass('relative');
    else if (position === 'absolute') addClass('absolute');
    else if (position === 'fixed') addClass('fixed');
    else if (position === 'sticky') addClass('sticky');
    else if (position === 'static') addClass('static');
    markAsProcessed('position');
  }

  ['top', 'left', 'right', 'bottom'].forEach(prop => {
    if (styleObject[prop] !== undefined) {
      const value = styleObject[prop];
      if (typeof value === 'string') {
        addClass(`${prop}-[${value}]`);
      } else if (typeof value === 'number') {
        addClass(`${prop}-[${value}px]`);
      }
      markAsProcessed(prop);
    }
  });

  // EFFECTS
  if (styleObject.boxShadow) {
    const boxShadow = styleObject.boxShadow;
    if (typeof boxShadow === 'string') {
      // Check for common shadow patterns
      if (boxShadow === '0px 4px 4px rgba(0, 0, 0, 0.25)') {
        addClass('shadow-md');
      } else if (boxShadow === '0px 10px 15px rgba(0, 0, 0, 0.1)') {
        addClass('shadow-lg');
      } else if (boxShadow === '0px 1px 3px rgba(0, 0, 0, 0.1)') {
        addClass('shadow-sm');
      } else if (boxShadow === '0px 25px 50px rgba(0, 0, 0, 0.25)') {
        addClass('shadow-2xl');
      } else if (boxShadow === 'none') {
        addClass('shadow-none');
      } else {
        // Custom shadow - replace spaces with underscores for Tailwind
        const customShadow = boxShadow.replace(/\s+/g, '_');
        addClass(`shadow-[${customShadow}]`);
      }
    }
    markAsProcessed('boxShadow');
  }

  if (styleObject.zIndex !== undefined) {
    const zIndex = styleObject.zIndex;
    if (typeof zIndex === 'number') {
      // Check for standard z-index values
      const zIndexMap = {
        0: 'z-0',
        10: 'z-10',
        20: 'z-20',
        30: 'z-30',
        40: 'z-40',
        50: 'z-50'
      };
      
      const standardClass = zIndexMap[zIndex];
      if (standardClass) {
        addClass(standardClass);
      } else {
        addClass(`z-[${zIndex}]`);
      }
    }
    markAsProcessed('zIndex');
  }

  return {
    className: tailwindClasses.join(' '),
    remainingStyles
  };
}
