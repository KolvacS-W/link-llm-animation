import React, { useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';

interface CodeEditorProps {
  onApply: (code: { html: string; css: string; js: string }) => void;
}

const CustomCodeEditor: React.FC<CodeEditorProps> = ({ onApply }) => {
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [activeTab, setActiveTab] = useState('html');

  const handleApply = () => {
    onApply({ html, css, js });
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'html':
        return (
          <CodeEditor
            value={html}
            language="html"
            placeholder="Enter HTML here"
            onChange={(e) => setHtml(e.target.value)}
            padding={15}
            style={{
              fontSize: 12,
              backgroundColor: '#f5f5f5',
              fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              height: '100%', /* Ensure it takes full height */
              overflow: 'auto', /* Ensure it scrolls if content overflows */
            }}
            className="code-editor-textarea" /* Add the class */
          />
        );
      case 'css':
        return (
          <CodeEditor
            value={css}
            language="css"
            placeholder="Enter CSS here"
            onChange={(e) => setCss(e.target.value)}
            padding={15}
            style={{
              fontSize: 12,
              backgroundColor: '#f5f5f5',
              fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              height: '100%', /* Ensure it takes full height */
              overflow: 'auto', /* Ensure it scrolls if content overflows */
            }}
            className="code-editor-textarea" /* Add the class */
          />
        );
      case 'js':
        return (
          <CodeEditor
            value={js}
            language="javascript"
            placeholder="Enter JS here"
            onChange={(e) => setJs(e.target.value)}
            padding={15}
            style={{
              fontSize: 12,
              backgroundColor: '#f5f5f5',
              fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              height: '100%', /* Ensure it takes full height */
              overflow: 'auto', /* Ensure it scrolls if content overflows */
            }}
            className="code-editor-textarea" /* Add the class */
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="code-editor">
      <div className="tabs">
        <button
          className={activeTab === 'html' ? 'active' : ''}
          onClick={() => setActiveTab('html')}
        >
          HTML
        </button>
        <button
          className={activeTab === 'css' ? 'active' : ''}
          onClick={() => setActiveTab('css')}
        >
          CSS
        </button>
        <button
          className={activeTab === 'js' ? 'active' : ''}
          onClick={() => setActiveTab('js')}
        >
          JS
        </button>
      </div>
      <div className="editor-container">
        {renderActiveTab()}
      </div>
      <button onClick={handleApply}>Apply Code</button>
    </div>
  );
};

export default CustomCodeEditor;
