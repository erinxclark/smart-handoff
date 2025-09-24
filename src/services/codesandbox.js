/**
 * CodeSandbox Integration Service
 * 
 * Provides functionality to deploy React components directly to CodeSandbox
 * for live preview, sharing, and collaboration.
 */

export const deployToCodeSandbox = async (componentCode, componentName = 'Component') => {
  try {
    const sandboxConfig = {
      files: {
        'package.json': {
          content: {
            name: componentName.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            description: `Generated React component: ${componentName}`,
            main: 'index.js',
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0',
              'react-scripts': '5.0.1'
            },
            scripts: {
              start: 'react-scripts start',
              build: 'react-scripts build',
              test: 'react-scripts test',
              eject: 'react-scripts eject'
            },
            browserslist: {
              production: ['>0.2%', 'not dead', 'not op_mini all'],
              development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
            }
          }
        },
        'src/App.js': {
          content: `import React from 'react';
import './App.css';
import ${componentName} from './components/${componentName}';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>${componentName}</h1>
        <p>Generated from Figma design</p>
      </header>
      <main>
        <${componentName} />
      </main>
    </div>
  );
}

export default App;`
        },
        'src/App.css': {
          content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.App {
  text-align: center;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.App-header {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.App-header h1 {
  margin: 0 0 10px 0;
  color: #333;
}

.App-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

main {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}`
        },
        'src/index.js': {
          content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
        },
        'src/index.css': {
          content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

* {
  box-sizing: border-box;
}`
        },
        'public/index.html': {
          content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Generated React component from Figma design" />
    <title>${componentName} - Figma to React</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`
        },
        [`src/components/${componentName}.js`]: {
          content: componentCode
        }
      }
    };

    console.log('Deploying to CodeSandbox...');
    
    const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sandboxConfig)
    });

    if (!response.ok) {
      throw new Error(`CodeSandbox API error: ${response.status}`);
    }

    const result = await response.json();
    const sandboxUrl = `https://codesandbox.io/s/${result.sandbox_id}`;
    
    console.log('Successfully deployed to CodeSandbox:', sandboxUrl);
    
    return {
      success: true,
      url: sandboxUrl,
      sandboxId: result.sandbox_id
    };

  } catch (error) {
    console.error('Error deploying to CodeSandbox:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const createShareableLink = (componentCode, componentName) => {
  // Create a shareable link that can be used to recreate the component
  const shareableData = {
    code: componentCode,
    name: componentName,
    timestamp: Date.now()
  };
  
  const encodedData = btoa(JSON.stringify(shareableData));
  
  return {
    shareableLink: `${window.location.origin}/share/${encodedData}`,
    rawData: shareableData
  };
};
