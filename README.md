# Smart Handoff

An AI-powered tool for seamless design-to-development handoff that converts Figma designs into React components with live preview and visual comparison capabilities.

## Overview

Smart Handoff revolutionizes the design-to-development workflow with a modern, optimized interface that prioritizes the live preview experience:

- **AI-Powered Code Generation**: Automatically converts Figma designs into clean, production-ready React components
- **Hero Live Preview**: Full-width live preview section with side-by-side Figma vs React comparison
- **Compact Control Panel**: Streamlined 25% left panel with smart state management
- **Intelligent Positioning**: Preserves Figma hierarchy with proper CSS positioning (relative containers, absolute children)
- **Visual Comparison**: Core Compare Visuals functionality with CodeSandbox deployment
- **Error Recovery**: AI-powered code analysis and positioning fixes for robust component generation

## Key Features

### 1. Modern UI Layout & Experience
- **Optimized 4-Column Grid**: 25% compact controls, 75% hero preview space
- **Smart State Management**: Figma setup hides after connection, showing clean status indicators
- **Top Row Efficiency**: Generated Code + Generate Code panels side-by-side for maximum workflow efficiency
- **Hero Live Preview**: Full-width bottom section with Compare Visuals functionality
- **Professional Design**: Modern gradients, smooth animations, and polished interface
- **Responsive Layout**: Adapts beautifully to desktop, tablet, and mobile screens
- **Maximum Preview Space**: 75% screen width dedicated to live preview and comparison

### 2. Figma Integration
- Tree view of Figma document structure
- Support for groups and frames
- Preservation of visual hierarchy
- Real-time design updates

### 3. Code Generation
- Automatic React component generation
- Exact styling preservation
- Proper handling of nested elements
- Support for text styles and fonts
- **Positioning Fixes**: Automatic correction of off-screen rendering issues
- **Robust Error Handling**: AI-powered code analysis and fixing

### 4. AI-Powered Live Preview
- **React Live Integration**: Real-time JSX rendering with instant updates
- **Smart Code Cleaning**: Automatic removal of comments, imports, and formatting issues
- **Error Handling**: Graceful fallbacks and AI-powered code fixing
- **Visual Comparison**: Side-by-side Figma vs React component comparison
- **Interactive Testing**: Live editing and immediate visual feedback

### 5. Tailwind CSS Integration
- **Dual Format Support**: Generate components with inline styles or Tailwind CSS classes
- **Smart Style Conversion**: Automatic conversion of CSS properties to Tailwind utilities
- **Standard Value Mapping**: Common values converted to Tailwind standards (16px → p-4)
- **Custom Value Support**: Arbitrary values preserved with Tailwind syntax (477px → w-[477px])
- **Real-time Toggle**: Switch between inline styles and Tailwind CSS with radio buttons
- **Mixed Style Support**: Handle partial conversions with both className and style attributes

### 6. Intelligent Positioning & Layout
- **Hierarchy Preservation**: Maintains Figma's parent-child relationships
- **CSS Positioning**: Converts Figma coordinates to proper CSS (relative containers, absolute children)
- **Root Element Normalization**: Ensures components always render within preview bounds
- **Z-Index Management**: Preserves layer stacking order from Figma
- **Responsive Layout**: Handles multi-element components with proper positioning

### 7. AI-Powered Code Analysis
- **Component Structure Analysis**: AI identifies and fixes structural issues
- **Code Validation**: Automatic syntax checking and error detection
- **Smart Fallbacks**: Graceful degradation when code generation fails
- **Continuous Improvement**: AI learns from patterns and improves over time

### 8. Intelligent Component Detection
- **Pattern Recognition**: Automatically detects UI component types (button, input, card, badge, avatar, container)
- **Confidence Scoring**: Provides 0-100% confidence scores with detailed reasoning
- **Library Suggestions**: Recommends appropriate UI libraries (shadcn/ui, MUI, Chakra, custom)
- **Component-Specific Generation**: Tailored code generation based on detected component type
- **Semantic HTML**: Generates proper semantic elements and ARIA attributes

### 9. Smart Image Handling
- **Graceful Fallbacks**: Handles missing Figma images with beautiful SVG placeholders
- **Placeholder Types**: Avatar, photo, icon, and generic placeholders with appropriate designs
- **Developer Guidance**: Includes helpful comments and data attributes for manual replacement
- **Figma Reference Preservation**: Maintains original Figma image references for easy updates

### 10. Component Library Integration
- **Real Component Libraries**: Generates actual shadcn/ui, Material-UI, and Chakra UI components
- **Intelligent Mapping**: Converts detected components to proper library implementations
- **Import Management**: Automatically generates required import statements
- **Smart Fallbacks**: Falls back to custom components when confidence is low
- **Library Selection**: Choose between different component libraries or custom implementation

## Technical Details

### Component Structure
- **`AICodePreview`**: Core React Live integration for real-time JSX rendering with Tailwind CSS conversion
- **`AIGeneratedCodePreview`**: Specialized component for AI output section
- **`SimpleLivePreview`**: Lightweight wrapper for CodeEditor integration
- **`FigmaTreeViewer`**: Displays and manages Figma document structure
- **`LiveCodePreview`**: Orchestrates React component preview and comparison
- **`CodeEditor`**: Provides code editing capabilities with AI integration
- **`ComponentStructureAnalyzer`**: AI service for code analysis and fixing
- **`styleConverter`**: Utility for converting React inline styles to Tailwind CSS classes
- **`componentDetector`**: Intelligent component pattern recognition and classification
- **`imageHandler`**: Graceful handling of missing Figma images with SVG placeholders
- **`componentMapper`**: Maps detected components to actual component library implementations

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
