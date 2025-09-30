/**
 * Component Library Mapper Utility
 * @fileoverview Converts detected component patterns into actual component library code
 */

/**
 * Maps detected component patterns to actual component library implementations
 * 
 * @param {Object} detectionResult - Result from detectComponentPattern
 * @param {string} detectionResult.componentType - Detected component type
 * @param {number} detectionResult.confidence - Confidence score (0-100)
 * @param {string} detectionResult.suggestedLibrary - Suggested library
 * @param {Object} figmaNode - Original Figma node data
 * @param {string} library - User's selected library: 'shadcn' | 'mui' | 'chakra' | 'none'
 * @returns {Object} Mapping result object
 * @returns {string} returns.code - Generated JSX code using component library
 * @returns {Array} returns.imports - Array of import statements needed
 * @returns {Object} returns.props - Extracted props from Figma data
 * @returns {boolean} returns.usesLibrary - Whether library component was used
 * 
 * @example
 * const detectionResult = {
 *   componentType: 'button',
 *   confidence: 90,
 *   suggestedLibrary: 'shadcn'
 * };
 * 
 * const figmaNode = {
 *   width: 120,
 *   height: 40,
 *   fills: [{ color: { r: 0.23, g: 0.51, b: 0.96 } }],
 *   children: [{ type: 'TEXT', characters: 'Submit' }]
 * };
 * 
 * const result = mapToComponentLibrary(detectionResult, figmaNode, 'shadcn');
 * // Returns: {
 * //   code: '<Button variant="default" size="lg">Submit</Button>',
 * //   imports: ['import { Button } from "@/components/ui/button"'],
 * //   props: { text: 'Submit', onClick: '() => {}' },
 * //   usesLibrary: true
 * // }
 */
export function mapToComponentLibrary(detectionResult, figmaNode, library = 'none') {
  if (!detectionResult || !figmaNode) {
    return {
      code: '<div>Invalid component data</div>',
      imports: [],
      props: {},
      usesLibrary: false
    };
  }

  const { componentType } = detectionResult;

  // Decide whether to use library component or custom div
  const shouldUseLibrary = shouldUseLibraryComponent(detectionResult, library);

  if (!shouldUseLibrary) {
    return generateCustomComponent(figmaNode, componentType);
  }

  // Route to appropriate library mapper
  switch (library.toLowerCase()) {
    case 'shadcn':
      return mapToShadcn(componentType, figmaNode, detectionResult);
    case 'mui':
    case 'material-ui':
      return mapToMUI(componentType, figmaNode, detectionResult);
    case 'chakra':
      return mapToChakra(componentType, figmaNode, detectionResult);
    default:
      return generateCustomComponent(figmaNode, componentType);
  }
}

/**
 * Maps component to shadcn/ui implementation
 */
function mapToShadcn(componentType, figmaNode, detectionResult) {
  const props = extractPropsFromFigma(figmaNode, componentType);
  
  switch (componentType) {
    case 'button':
      return mapToShadcnButton(figmaNode, props);
    case 'input':
      return mapToShadcnInput(figmaNode, props);
    case 'card':
      return mapToShadcnCard(figmaNode, props);
    case 'badge':
      return mapToShadcnBadge(figmaNode, props);
    case 'avatar':
      return mapToShadcnAvatar(figmaNode, props);
    default:
      return generateCustomComponent(figmaNode, componentType);
  }
}

/**
 * Maps to shadcn/ui Button component
 */
function mapToShadcnButton(figmaNode, props) {
  const { text = 'Button', onClick = '() => {}' } = props;
  const { height, fills = [] } = figmaNode;
  
  // Determine variant based on background color
  const variant = determineButtonVariant(fills);
  
  // Determine size based on height
  const size = determineButtonSize(height);
  
  // Check for custom colors
  const customColor = getCustomButtonColor(fills);
  const className = customColor ? `bg-[${customColor}]` : '';
  
  const code = `<Button 
  variant="${variant}" 
  size="${size}"${className ? `\n  className="${className}"` : ''}
  onClick={${onClick}}
>
  ${text}
</Button>`;

  return {
    code,
    imports: ['import { Button } from "@/components/ui/button"'],
    props: { text, onClick, variant, size },
    usesLibrary: true
  };
}

/**
 * Maps to shadcn/ui Input component
 */
function mapToShadcnInput(figmaNode, props) {
  const { placeholder = '', type = 'text' } = props;
  const { width, height } = figmaNode;
  
  const code = `<Input 
  type="${type}"
  placeholder="${placeholder}"
  className="w-[${width}px] h-[${height}px]"
/>`;

  return {
    code,
    imports: ['import { Input } from "@/components/ui/input"'],
    props: { placeholder, type, width, height },
    usesLibrary: true
  };
}

/**
 * Maps to shadcn/ui Card component
 */
function mapToShadcnCard(figmaNode, props) {
  const { title = '', hasFooter = false } = props;
  const { width, height, children = [] } = figmaNode;
  
  let code = `<Card className="w-[${width}px]${height ? ` h-[${height}px]` : ''}">`;
  
  if (title) {
    code += `\n  <CardHeader>\n    <CardTitle>${title}</CardTitle>\n  </CardHeader>`;
  }
  
  code += `\n  <CardContent>`;
  
  // Add placeholder content for children
  if (children.length > 0) {
    code += `\n    {/* Card content */}`;
  }
  
  code += `\n  </CardContent>`;
  
  if (hasFooter) {
    code += `\n  <CardFooter>\n    {/* Card actions */}\n  </CardFooter>`;
  }
  
  code += `\n</Card>`;

  const imports = ['import { Card, CardContent } from "@/components/ui/card"'];
  if (title) {
    imports[0] = 'import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"';
  }
  if (hasFooter) {
    imports[0] = imports[0].replace('}', ', CardFooter }');
  }

  return {
    code,
    imports,
    props: { title, hasFooter, width, height },
    usesLibrary: true
  };
}

/**
 * Maps to shadcn/ui Badge component
 */
function mapToShadcnBadge(figmaNode, props) {
  const { text = 'Badge' } = props;
  const { fills = [] } = figmaNode;
  
  const variant = determineBadgeVariant(fills);
  
  const code = `<Badge variant="${variant}">
  ${text}
</Badge>`;

  return {
    code,
    imports: ['import { Badge } from "@/components/ui/badge"'],
    props: { text, variant },
    usesLibrary: true
  };
}

/**
 * Maps to shadcn/ui Avatar component
 */
function mapToShadcnAvatar(figmaNode, props) {
  const { imageUrl = '', initials = 'U', alt = 'User avatar' } = props;
  const { width, height } = figmaNode;
  
  const code = `<Avatar className="w-[${width}px] h-[${height}px]">
  <AvatarImage src="${imageUrl}" alt="${alt}" />
  <AvatarFallback>${initials}</AvatarFallback>
</Avatar>`;

  return {
    code,
    imports: ['import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"'],
    props: { imageUrl, initials, alt, width, height },
    usesLibrary: true
  };
}

/**
 * Maps to Material-UI components (placeholder for future implementation)
 */
function mapToMUI(componentType, figmaNode, detectionResult) {
  // Placeholder implementation - can be expanded later
  return generateCustomComponent(figmaNode, componentType);
}

/**
 * Maps to Chakra UI components (placeholder for future implementation)
 */
function mapToChakra(componentType, figmaNode, detectionResult) {
  // Placeholder implementation - can be expanded later
  return generateCustomComponent(figmaNode, componentType);
}

/**
 * Generates custom component when library component shouldn't be used
 */
function generateCustomComponent(figmaNode, componentType) {
  const { width, height, fills = [], children = [] } = figmaNode;
  
  // Get basic styling
  const backgroundColor = fills.length > 0 ? getColorFromFill(fills[0]) : '#f0f0f0';
  const textContent = extractTextFromChildren(children);
  
  // Generate appropriate semantic element
  const element = getSemanticElement(componentType);
  
  const code = `<${element} 
  className="w-[${width}px] h-[${height}px] bg-[${backgroundColor}]"
>
  ${textContent || ''}
</${element}>`;

  return {
    code,
    imports: [],
    props: { width, height, backgroundColor, textContent },
    usesLibrary: false
  };
}

/**
 * Decides whether to use library component or custom div
 * 
 * @param {Object} detectionResult - Component detection result
 * @param {string} userPreference - User's selected library preference
 * @returns {boolean} Whether to use library component
 */
export function shouldUseLibraryComponent(detectionResult, userPreference) {
  // If user selected 'none', always use custom
  if (userPreference === 'none') {
    return false;
  }
  
  // If confidence is too low, don't use library
  if (detectionResult.confidence < 70) {
    return false;
  }
  
  // If component type is unknown, don't use library
  if (detectionResult.componentType === 'unknown') {
    return false;
  }
  
  // Containers are too generic for library components
  if (detectionResult.componentType === 'container') {
    return false;
  }
  
  return true;
}

/**
 * Generates deduplicated import statements from mapping results
 * 
 * @param {Array} mappingResults - Array of mapping result objects
 * @returns {Array} Deduplicated array of import statements
 * 
 * @example
 * const results = [
 *   { imports: ['import { Button } from "@/components/ui/button"'] },
 *   { imports: ['import { Card, CardContent } from "@/components/ui/card"'] },
 *   { imports: ['import { Button } from "@/components/ui/button"'] }
 * ];
 * 
 * const imports = generateImports(results);
 * // Returns: [
 * //   'import { Button } from "@/components/ui/button"',
 * //   'import { Card, CardContent } from "@/components/ui/card"'
 * // ]
 */
export function generateImports(mappingResults) {
  if (!Array.isArray(mappingResults)) {
    return [];
  }
  
  const importSet = new Set();
  
  mappingResults.forEach(result => {
    if (result.imports && Array.isArray(result.imports)) {
      result.imports.forEach(importStatement => {
        importSet.add(importStatement);
      });
    }
  });
  
  return Array.from(importSet);
}

/**
 * Extracts relevant props from Figma node based on component type
 * 
 * @param {Object} figmaNode - Figma node data
 * @param {string} componentType - Detected component type
 * @returns {Object} Extracted props object
 */
export function extractPropsFromFigma(figmaNode, componentType) {
  const { children = [], fills = [], name = '' } = figmaNode;
  
  switch (componentType) {
    case 'button':
      return {
        text: extractTextFromChildren(children) || 'Button',
        onClick: '() => {}',
        variant: determineButtonVariant(fills),
        size: determineButtonSize(figmaNode.height)
      };
      
    case 'input':
      return {
        placeholder: extractPlaceholderText(children) || 'Enter text',
        type: determineInputType(name, children),
        width: figmaNode.width,
        height: figmaNode.height
      };
      
    case 'card':
      return {
        title: extractCardTitle(children),
        hasFooter: hasCardFooter(children),
        width: figmaNode.width,
        height: figmaNode.height
      };
      
    case 'badge':
      return {
        text: extractTextFromChildren(children) || 'Badge',
        variant: determineBadgeVariant(fills)
      };
      
    case 'avatar':
      return {
        imageUrl: extractImageUrl(fills),
        initials: extractInitials(children) || 'U',
        alt: `User avatar${extractTextFromChildren(children) ? ` - ${extractTextFromChildren(children)}` : ''}`,
        width: figmaNode.width,
        height: figmaNode.height
      };
      
    default:
      return {
        text: extractTextFromChildren(children) || '',
        width: figmaNode.width,
        height: figmaNode.height
      };
  }
}

// Helper functions for prop extraction

function extractTextFromChildren(children) {
  if (!Array.isArray(children)) return '';
  
  const textChild = children.find(child => child.type === 'TEXT' && child.characters);
  return textChild ? textChild.characters.trim() : '';
}

function extractPlaceholderText(children) {
  const text = extractTextFromChildren(children);
  if (text && (text.includes('Enter') || text.includes('Type') || text.includes('Placeholder'))) {
    return text;
  }
  return '';
}

function extractCardTitle(children) {
  if (!Array.isArray(children)) return '';
  
  // Look for the first text child as potential title
  const textChild = children.find(child => child.type === 'TEXT' && child.characters);
  return textChild ? textChild.characters.trim() : '';
}

function hasCardFooter(children) {
  if (!Array.isArray(children)) return false;
  
  // Simple heuristic: if there are multiple children, might have footer
  return children.length > 1;
}

function extractImageUrl(fills) {
  if (!Array.isArray(fills)) return '';
  
  const imageFill = fills.find(fill => fill.type === 'IMAGE' && fill.imageRef);
  return imageFill ? `{/* Image: ${imageFill.imageRef} */}` : '';
}

function extractInitials(children) {
  const text = extractTextFromChildren(children);
  if (!text) return '';
  
  // Extract initials from text (first 2 characters, uppercase)
  return text.substring(0, 2).toUpperCase();
}

function determineInputType(name, children) {
  const lowerName = name.toLowerCase();
  const text = extractTextFromChildren(children);
  
  if (lowerName.includes('email') || text.includes('email')) return 'email';
  if (lowerName.includes('password') || text.includes('password')) return 'password';
  if (lowerName.includes('search') || text.includes('search')) return 'search';
  if (lowerName.includes('tel') || lowerName.includes('phone')) return 'tel';
  if (lowerName.includes('url')) return 'url';
  
  return 'text';
}

// Helper functions for component styling

function determineButtonVariant(fills) {
  if (!fills.length) return 'outline';
  
  const color = getColorFromFill(fills[0]);
  
  // Primary blue colors
  if (color.includes('#3b82f6') || color.includes('#2563eb') || color.includes('#1d4ed8')) {
    return 'default';
  }
  
  // Destructive red colors
  if (color.includes('#ef4444') || color.includes('#dc2626') || color.includes('#b91c1c')) {
    return 'destructive';
  }
  
  // Gray colors
  if (color.includes('#6b7280') || color.includes('#4b5563') || color.includes('#374151')) {
    return 'secondary';
  }
  
  // Default for other colors
  return 'default';
}

function determineButtonSize(height) {
  if (height < 36) return 'sm';
  if (height > 44) return 'lg';
  return 'default';
}

function determineBadgeVariant(fills) {
  if (!fills.length) return 'secondary';
  
  const color = getColorFromFill(fills[0]);
  
  // Blue/primary colors
  if (color.includes('#3b82f6') || color.includes('#2563eb')) {
    return 'default';
  }
  
  // Red colors
  if (color.includes('#ef4444') || color.includes('#dc2626')) {
    return 'destructive';
  }
  
  // Yellow/orange colors
  if (color.includes('#f59e0b') || color.includes('#f97316')) {
    return 'outline';
  }
  
  // Default to secondary
  return 'secondary';
}

function getCustomButtonColor(fills) {
  if (!fills.length) return null;
  
  const color = getColorFromFill(fills[0]);
  
  // Only return custom color if it's not a standard shadcn color
  const standardColors = ['#3b82f6', '#2563eb', '#1d4ed8', '#ef4444', '#dc2626', '#b91c1c', '#6b7280', '#4b5563', '#374151'];
  
  if (standardColors.some(standard => color.includes(standard))) {
    return null;
  }
  
  return color;
}

function getColorFromFill(fill) {
  if (!fill || !fill.color) return '#000000';
  
  const { r, g, b } = fill.color;
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function getSemanticElement(componentType) {
  switch (componentType) {
    case 'button': return 'button';
    case 'input': return 'input';
    case 'card': return 'article';
    case 'badge': return 'span';
    case 'avatar': return 'img';
    case 'container': return 'section';
    default: return 'div';
  }
}
