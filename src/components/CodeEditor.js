import React from 'react';
import Editor from '@monaco-editor/react';

/**
 * A code editor component using Monaco Editor
 * @param {Object} props - Component props
 * @param {string} props.code - The code to display in the editor
 * @param {Function} props.onChange - Callback function when code changes
 */
const CodeEditor = ({ code, onChange }) => {
  return (
    <div className="mt-6 w-full max-w-4xl">
      <Editor
        height="400px"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={code}
        onChange={onChange}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
};

export default CodeEditor; 