import React, { useState, useEffect } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';

interface CodeEditorProps {
  code: { html: string; css: string; js: string };
  onApply: (code: { html: string; css: string; js: string }) => void;
}

const CustomCodeEditor: React.FC<CodeEditorProps> = ({ code, onApply }) => {
  const [html, setHtml] = useState(code.html);
  const [css, setCss] = useState(code.css);
  const [js, setJs] = useState(code.js);
  const [activeTab, setActiveTab] = useState('html');

  useEffect(() => {
    setHtml(code.html);
    setCss(code.css);
    setJs(code.js);
  }, [code]);

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
              height: '100%',
              overflow: 'auto',
            }}
            className="code-editor-textarea"
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
              height: '100%',
              overflow: 'auto',
            }}
            className="code-editor-textarea"
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
              height: '100%',
              overflow: 'auto',
            }}
            className="code-editor-textarea"
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
      <div className="button-group">
        <button className="purple-button" onClick={handleApply}>Initialize Code</button>
        <button className="purple-button" onClick={handleApply}>Update Code</button>
        <button className="blue-button" onClick={handleApply}>Adjust Code</button>
      </div>
    </div>
  );
};

export default CustomCodeEditor;
