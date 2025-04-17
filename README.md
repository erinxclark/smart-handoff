# Smart Handoff

A tool for converting Figma designs into React components while preserving design fidelity.

## Overview

Smart Handoff bridges the gap between design and development by:
- Converting Figma designs into React components
- Preserving exact styling and layout
- Maintaining proper component hierarchy
- Providing real-time preview and comparison

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

### 3. Live Preview
- Real-time React component preview
- Side-by-side comparison with Figma
- Visual difference analysis
- Interactive component testing

### 4. Styling Preservation
- Exact color matching
- Font family and size preservation
- Proper spacing and layout
- Support for complex nested structures

## Technical Details

### Component Structure
- `FigmaTreeViewer`: Displays and manages Figma document structure
- `LiveCodePreview`: Handles React component preview and comparison
- `CodeEditor`: Provides code editing capabilities

### Key Technologies
- React 18 for UI components
- Figma API for design integration
- React Live for code preview
- HTML2Canvas for visual comparison
- Monaco Editor for code editing
- OpenAI API for AI-powered analysis
- Axios for API requests
- TailwindCSS for styling
- PostCSS for CSS processing
- Jest and Testing Library for testing

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- Figma Personal Access Token

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start the development server: `npm start`

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
