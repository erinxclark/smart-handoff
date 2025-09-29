# Smart Handoff

An AI-powered tool for seamless design-to-development handoff that converts Figma designs into React components with live preview and visual comparison capabilities.

## Overview

Smart Handoff revolutionizes the design-to-development workflow by:
- **AI-Powered Code Generation**: Automatically converts Figma designs into clean, production-ready React components
- **Live Preview System**: Real-time React Live rendering with instant visual feedback
- **Intelligent Positioning**: Preserves Figma hierarchy with proper CSS positioning (relative containers, absolute children)
- **Visual Comparison**: Side-by-side comparison between Figma designs and generated React components
- **Error Recovery**: AI-powered code analysis and fixing for robust component generation

## Key Features

### 1. Figma Integration
- Tree view of Figma document structure
- Support for groups and frames
- Preservation of visual hierarchy
- Real-time design updates

### 2. Code Generation
- Automatic React component generation
- Exact styling preservation
- Proper handling of nested elements
- Support for text styles and fonts

### 3. AI-Powered Live Preview
- **React Live Integration**: Real-time JSX rendering with instant updates
- **Smart Code Cleaning**: Automatic removal of comments, imports, and formatting issues
- **Error Handling**: Graceful fallbacks and AI-powered code fixing
- **Visual Comparison**: Side-by-side Figma vs React component comparison
- **Interactive Testing**: Live editing and immediate visual feedback

### 4. Intelligent Positioning & Layout
- **Hierarchy Preservation**: Maintains Figma's parent-child relationships
- **CSS Positioning**: Converts Figma coordinates to proper CSS (relative containers, absolute children)
- **Root Element Normalization**: Ensures components always render within preview bounds
- **Z-Index Management**: Preserves layer stacking order from Figma
- **Responsive Layout**: Handles multi-element components with proper positioning

### 5. AI-Powered Code Analysis
- **Component Structure Analysis**: AI identifies and fixes structural issues
- **Code Validation**: Automatic syntax checking and error detection
- **Smart Fallbacks**: Graceful degradation when code generation fails
- **Continuous Improvement**: AI learns from patterns and improves over time

## Technical Details

### Component Structure
- **`AICodePreview`**: Core React Live integration for real-time JSX rendering
- **`AIGeneratedCodePreview`**: Specialized component for AI output section
- **`SimpleLivePreview`**: Lightweight wrapper for CodeEditor integration
- **`FigmaTreeViewer`**: Displays and manages Figma document structure
- **`LiveCodePreview`**: Orchestrates React component preview and comparison
- **`CodeEditor`**: Provides code editing capabilities with AI integration
- **`ComponentStructureAnalyzer`**: AI service for code analysis and fixing

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
- Click "Generate Spec + Code" to trigger AI analysis
- AI analyzes Figma node properties and relationships
- Generates clean, production-ready React components
- Preserves exact styling, positioning, and hierarchy

### 3. Live Preview & Comparison
- View generated React code in the editor
- See real-time live preview using React Live
- Compare visually with original Figma design
- Edit code and see instant updates in preview

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
