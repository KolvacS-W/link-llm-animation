import React, { useState } from 'react';

interface CodeEditorProps {
  onApply: (code: { html: string; css: string; js: string }) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ onApply }) => {
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
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="Enter HTML here"
          />
        );
      case 'css':
        return (
          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            placeholder="Enter CSS here"
          />
        );
      case 'js':
        return (
          <textarea
            value={js}
            onChange={(e) => setJs(e.target.value)}
            placeholder="Enter JS here"
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

export default CodeEditor;
