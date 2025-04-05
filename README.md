# Smart Handoff

A React application that helps compare Figma designs with React implementations using AI-powered visual analysis.

## Features

- Live React component preview
- Figma design integration
- AI-powered visual comparison
- Detailed styling analysis
- Priority-based difference detection

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- Figma Personal Access Token

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smart-handoff.git
cd smart-handoff
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update the `.env` file with your credentials:
     ```
     REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
     REACT_APP_FIGMA_TOKEN=your_figma_token_here
     REACT_APP_FIGMA_FILE_ID=your_figma_file_id_here
     ```

## Usage

1. Start the development server:
```bash
npm start
# or
yarn start
```

2. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Technologies Used

- React
- OpenAI API
- Figma API
- html2canvas
- react-live

## License

MIT
