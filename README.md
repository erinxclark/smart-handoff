# Smart Handoff

An AI-powered tool for seamless design-to-development handoff that converts Figma designs into React components with live preview and visual comparison capabilities.

## Overview

Smart Handoff revolutionizes the design-to-development workflow with a modern, intuitive interface that maximizes productivity:

- **AI-Powered Code Generation**: Automatically converts Figma designs into clean, production-ready React components
- **Full-Width Live Preview**: Maximized preview section with side-by-side Figma vs React comparison
- **Vertical Layout**: Optimized three-row layout prioritizing live preview space
- **Intelligent Component Detection**: Automatic UI pattern recognition with library mapping
- **Tailwind CSS Support**: Real-time toggle between inline styles and Tailwind classes
- **Storybook Integration**: Export generated components as Storybook stories with component variants
- **Visual Comparison**: Built-in comparison tool with pixel-perfect analysis
- **File Size Detection**: Smart warnings for large Figma files with performance recommendations
- **Error Recovery**: AI-powered code analysis and automatic positioning fixes
- **Alignment Enforcement**: Simple exact value enforcement for pixel-perfect positioning
- **Accessibility Enhancement**: Automatic ARIA attributes, semantic HTML, and keyboard navigation
- **Design Token Extraction**: Intelligent extraction and categorization of design system tokens
- **Smart Pattern Recognition**: Deep analysis of Figma structures for accurate component generation
- **Robust Error Handling**: Comprehensive error recovery and user-friendly guidance

## Key Features

### 1. Modern UI Layout & Experience
- **Three-Row Vertical Layout**: Optimized for maximum preview space
  - **Row 1**: Figma connection, library selection, and file tree (collapses after connection)
  - **Row 2**: Full-width Live Preview with React and Figma side-by-side comparison
  - **Row 3**: Full-width Generated Code section with syntax highlighting
- **Centered Component Preview**: Components are perfectly centered both horizontally and vertically
- **Professional Design**: Modern gradients, smooth Framer Motion animations, and polished interface
- **Responsive Layout**: Adapts beautifully to desktop, tablet, and mobile screens
- **Maximum Preview Space**: 100% width dedicated to live preview and comparison
- **Clean Visual Design**: Matching preview boxes with gradient backgrounds and subtle shadows

### 2. Figma Integration & Performance
- **Interactive Tree View**: Browse and select components from Figma document structure
- **File Size Detection**: Automatic node counting with smart warnings
  - Yellow warning (>500 nodes): Performance notice
  - Orange warning (>1000 nodes): Recommendation to select specific frames
  - Red warning (>2000 nodes): Strong suggestion to use smaller files
- **Node Count Display**: Shows total node count in success message (e.g., "File loaded: design.fig (245 nodes)")
- **Continue Anyway Option**: Allows proceeding with large files if needed
- **Support for Groups and Frames**: Handles nested structures with proper hierarchy
- **Real-time Design Updates**: Fetches latest Figma thumbnails and metadata

### 3. Code Generation
- Automatic React component generation
- Exact styling preservation
- Proper handling of nested elements
- Support for text styles and fonts
- **Positioning Fixes**: Automatic correction of off-screen rendering issues
- **Robust Error Handling**: AI-powered code analysis and fixing

### 4. Storybook Integration
- **Export to Storybook**: Generate `.stories.js` files for design system documentation
- **Component Variants**: Automatic story generation based on detected component types
  - **Buttons**: Default, Primary, Secondary, Disabled, Large, Small variants
  - **Cards**: Default, With Content, Empty states
  - **Inputs**: Default, With Value, Error, Disabled states
  - **Badges**: Default, Primary, Secondary, Destructive, Outline variants
  - **Avatars**: Default, With Image, With Fallback, Large, Small variants
- **CSF 3.0 Format**: Modern Storybook story format with auto-generated documentation
- **Preview Modal**: Review story file content before downloading
- **Smart Filename Generation**: Automatic naming based on component detection
- **Design System Ready**: Perfect for documenting component libraries and design systems

### 5. AI-Powered Live Preview
- **React Live Integration**: Real-time JSX rendering with instant updates
- **Smart Code Cleaning**: Automatic removal of comments, imports, and formatting issues
- **Error Handling**: Graceful fallbacks and AI-powered code fixing
- **Visual Comparison**: Side-by-side Figma vs React component comparison
- **Interactive Testing**: Live editing and immediate visual feedback

### 5. Tailwind CSS Integration
- **Dual Format Support**: Generate components with inline styles or Tailwind CSS classes
- **Real-time Toggle**: Switch between formats with animated toggle buttons (Inline/Tailwind)
- **Smart Code Display**: Code block updates instantly to show selected format
- **Consistent Preview**: Live preview always renders correctly (uses inline styles internally)
- **Smart Style Conversion**: Automatic conversion of CSS properties to Tailwind utilities
  - Dimensions: `width: '477px'` → `w-[477px]`
  - Colors: `backgroundColor: '#44b24f'` → `bg-[#44b24f]`
  - Borders: `border: '13px solid #000'` → `border-[13px] border-solid border-black`
  - Spacing: `padding: '16px'` → `p-4` (standard values) or `p-[20px]` (custom)
  - Layout: `display: 'flex', justifyContent: 'center'` → `flex justify-center`
- **Standard Value Mapping**: Common values converted to Tailwind standards
- **Custom Value Support**: Arbitrary values preserved with Tailwind JIT syntax
- **Mixed Style Support**: Handles partial conversions with both className and style attributes
- **Copy Either Format**: Copy button respects current toggle selection

### 6. Intelligent Positioning & Layout
- **Hierarchy Preservation**: Maintains Figma's parent-child relationships
- **CSS Positioning**: Converts Figma coordinates to proper CSS (relative containers, absolute children)
- **Root Element Normalization**: Ensures components always render within preview bounds
- **Z-Index Management**: Preserves layer stacking order from Figma
- **Responsive Layout**: Handles multi-element components with proper positioning

### 7. Alignment Enforcement System
- **Exact Value Enforcement**: Simple post-processing to ensure generated code uses exact Figma pixel values
- **No Rounding**: Prevents AI from rounding or approximating positioning values
- **Coordinate Matching**: Ensures elements with same X/Y coordinates in Figma have matching CSS values
- **Debug Logging**: Enhanced console logging to track alignment corrections and validations
- **Value Validation**: Post-generation validation to verify exact value matching
- **Figma JSON Integration**: Direct enforcement using `absoluteBoundingBox` values from Figma data

### 8. AI-Powered Code Analysis
- **Component Structure Analysis**: AI identifies and fixes structural issues
- **Code Validation**: Automatic syntax checking and error detection
- **Smart Fallbacks**: Graceful degradation when code generation fails
- **Continuous Improvement**: AI learns from patterns and improves over time

### 9. Intelligent Component Detection
- **Pattern Recognition**: Automatically detects UI component types (button, input, card, badge, avatar, container)
- **Confidence Scoring**: Provides 0-100% confidence scores with detailed reasoning
- **Library Suggestions**: Recommends appropriate UI libraries (shadcn/ui, MUI, Chakra, custom)
- **Component-Specific Generation**: Tailored code generation based on detected component type
- **Semantic HTML**: Generates proper semantic elements and ARIA attributes

### 10. Smart Image Handling
- **Graceful Fallbacks**: Handles missing Figma images with beautiful SVG placeholders
- **Placeholder Types**: Avatar, photo, icon, and generic placeholders with appropriate designs
- **Developer Guidance**: Includes helpful comments and data attributes for manual replacement
- **Figma Reference Preservation**: Maintains original Figma image references for easy updates

### 11. Component Library Integration
- **Real Component Libraries**: Generates actual shadcn/ui, Material-UI, and Chakra UI components
- **Intelligent Mapping**: Converts detected components to proper library implementations
- **Import Management**: Automatically generates required import statements
- **Smart Fallbacks**: Falls back to custom components when confidence is low
- **Library Selection**: Choose between different component libraries or custom implementation

### 12. Accessibility Enhancement
- **Automatic ARIA Attributes**: Generates proper ARIA labels, roles, and descriptions
- **Semantic HTML**: Converts generic divs to semantic elements (button, input, nav, article, etc.)
- **Keyboard Navigation**: Adds tabIndex and onKeyPress handlers for interactive elements
- **Color Contrast Checking**: Validates WCAG AA/AAA compliance with actionable feedback
- **Screen Reader Support**: Ensures generated components are accessible to assistive technologies
- **Focus Management**: Proper focus indicators and keyboard navigation patterns

### 13. Design Token Extraction
- **Intelligent Token Analysis**: Automatically identifies and categorizes design tokens
- **Color Extraction**: Background colors, text colors, border colors with usage categorization
- **Spacing Patterns**: Padding, margins, gaps with consistent spacing scale detection
- **Typography Analysis**: Font families, sizes, weights, line heights, letter spacing
- **Border & Effects**: Border widths, corner radius values, box shadows, blur effects
- **Export Functionality**: CSS variables and JSON export for design systems
- **Token Organization**: Clean, scannable interface with copy-to-clipboard functionality

### 14. Smart Pattern Recognition
- **Deep Structure Analysis**: Recursive analysis of nested Figma components
- **GROUP vs FRAME Handling**: Specialized logic for different Figma container types
- **Button Pattern Detection**: Automatic recognition of RECTANGLE + TEXT button patterns
- **Badge Identification**: Small rounded elements with pill-shaped styling
- **Content Extraction**: Extracts actual text content instead of placeholder text
- **Hierarchy Preservation**: Maintains complete component structure and relationships

### 15. Enhanced Error Handling
- **Circular Reference Protection**: Safe JSON serialization for complex Figma data
- **Syntax Error Recovery**: Automatic JSX syntax correction and validation
- **Positioning Fixes**: Intelligent correction of element positioning issues
- **User-Friendly Messages**: Clear, actionable error messages with guidance
- **Graceful Degradation**: Fallback mechanisms for edge cases and failures

## Technical Details

### Component Structure
- **`AICodePreview`**: Core React Live integration for real-time JSX rendering with Tailwind CSS conversion
- **`AIGeneratedCodePreview`**: Specialized component for AI output section
- **`SimpleLivePreview`**: Lightweight wrapper for CodeEditor integration
- **`FigmaTreeViewer`**: Displays and manages Figma document structure with expand/collapse functionality
- **`LiveCodePreview`**: Orchestrates React component preview and comparison
- **`CodeEditor`**: Provides code editing capabilities with AI integration
- **`DesignTokensPanel`**: Extracts and displays design tokens with export functionality
- **`ComponentStructureAnalyzer`**: AI service for code analysis and fixing
- **`styleConverter`**: Utility for converting React inline styles to Tailwind CSS classes
- **`componentDetector`**: Intelligent component pattern recognition and classification
- **`imageHandler`**: Graceful handling of missing Figma images with SVG placeholders
- **`componentMapper`**: Maps detected components to actual component library implementations
- **`exactValueEnforcer`**: Simple post-processing utility for enforcing exact Figma pixel values
- **`accessibilityEnhancer`**: Automatic accessibility enhancement with ARIA attributes and semantic HTML
- **`tokenExtractor`**: Intelligent design token extraction and categorization system

### Key Technologies
- **React 18** for modern UI components and hooks
- **React Live** for real-time JSX rendering and live preview
- **Figma API** for design data extraction and thumbnail generation
- **OpenAI API** for AI-powered code generation and analysis
- **Monaco Editor** for advanced code editing with syntax highlighting
- **HTML2Canvas** for visual comparison and screenshot generation
- **Axios** for robust API communication
- **TailwindCSS** for utility-first styling
- **PostCSS** for CSS processing and optimization
- **Jest & Testing Library** for comprehensive testing

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- Figma Personal Access Token

## Getting Started

1. Clone the repository: `git clone https://github.com/erinxclark/smart-handoff.git`
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start the development server: `npm start`

## How It Works

### 1. Design Selection
- Browse your Figma document structure in the tree view
- Select individual components or frames for conversion
- View real-time Figma thumbnails and metadata

### 2. AI Code Generation
- **Select Component Library**: Choose from shadcn/ui, Material-UI, Chakra UI, or custom implementation
- Click "Generate Spec + Code" to trigger AI analysis
- **Component Detection**: AI automatically identifies component types (button, input, card, etc.)
- **Library Mapping**: Converts detected components to actual component library implementations
- **Image Analysis**: Detects and handles Figma images with intelligent placeholders
- AI analyzes Figma node properties and relationships
- Generates clean, production-ready React components with proper imports and library patterns
- Preserves exact styling, positioning, and hierarchy
- Includes semantic HTML and accessibility attributes based on component type

### 3. Live Preview & Comparison
- View generated React code in the editor
- Toggle between **Inline Styles** and **Tailwind CSS** formats
- See real-time live preview using React Live
- Compare visually with original Figma design
- Edit code and see instant updates in preview

#### Example: Style Format Toggle
```jsx
// Inline Styles Format
<div style={{
  width: '477px',
  height: '297px',
  backgroundColor: '#44b24f',
  border: '13px solid #000000',
  borderRadius: '15px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
  Content
</div>

// Tailwind CSS Format
<div className="w-[477px] h-[297px] bg-[#44b24f] border-[13px] border-solid border-black rounded-[15px] flex justify-center items-center">
  Content
</div>
```

### 4. Error Recovery
- AI automatically detects and fixes code issues
- Handles malformed JSX, syntax errors, and positioning problems
- Provides graceful fallbacks for edge cases
- Ensures components always render properly

## Project Architecture

The project follows a modular architecture:
- `src/components/`: React components
- `src/services/`: API and utility services
- `src/layouts/`: Application layouts
- `public/`: Static assets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details
