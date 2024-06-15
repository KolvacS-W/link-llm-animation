import React, { useState, useEffect } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import ReactLoading from 'react-loading';

interface CodeEditorProps {
  code: { html: string; css: string; js: string };
  onApply: (code: { html: string; css: string; js: string }) => void;
  description: string;
  onUpdateDescription: (newDescription: string) => void;
  latestCode: { html: string; css: string; js: string };
  setLatestCode: (code: { html: string; css: string; js: string }) => void;
}

const API_KEY = '';

const CustomCodeEditor: React.FC<CodeEditorProps> = ({ code, onApply, description, onUpdateDescription,  latestCode, setLatestCode }) => {
  const [html, setHtml] = useState(code.html);
  const [css, setCss] = useState(code.css);
  const [js, setJs] = useState(code.js);
  const [activeTab, setActiveTab] = useState('html');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHtml(code.html);
    setCss(code.css);
    setJs(code.js);
  }, [code]);

  const handleApply = () => {
    onApply({ html, css, js });
  };

  const handleUpdateCode = async () => {
    setLoading(true);
    onApply({ html, css, js });//save new updated code
    const prompt = `Based on the following existing old description describing old code and the updated code, provide an updated description reflecting changes to the code. \\
    Old description: ${description}. \\
    Old code: HTML: \`\`\`html${latestCode.html}\`\`\` CSS: \`\`\`css${latestCode.css}\`\`\` JS: \`\`\`js${latestCode.js}\`\`\` \\
    Updated code: HTML: \`\`\`html${html}\`\`\` CSS: \`\`\`css${css}\`\`\` JS: \`\`\`js${js}\`\`\` \\
    Description format:\\
    xxxxx[entity1]{detail for entity1}xxxx[entity2]{detail for entity2}... \\ 
    Important: One [] only contain one entity and one {} only contain one detail. Each entity and each detail are wrapped in a [] and {} respectively. Include nothing but the new description in the response.\\
    Example description:
    [polygons]{two different polygon elements, polygon1 and polygon2 colored red and blue respectively, each defined by three points to form a triangle shape} [moving]{motion defined along path1-transparent fill and black stroke, and path2 -transparent fill and black stroke} and [growing]{size oscillates between 1 and 2 over a duration of 2000ms with easing}\\
    Include only the updated description in the response.`;
    console.log('prompt:', prompt);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [{ role: "system", content: "You are a creative programmer." }, { role: "user", content: prompt }],
        }),
      });
      console.log('sent update code call');
      const data = await response.json();
      const newDescriptionContent = data.choices[0]?.message?.content;
      console.log('update code call data', newDescriptionContent);
      if (newDescriptionContent) {
        onUpdateDescription(newDescriptionContent);
      }
    } catch (error) {
      console.error("Error processing update code request:", error);
    } finally {
      setLoading(false);
    }
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
      {loading && <div className="loading-container"><ReactLoading type="spin" color="#007bff" height={50} width={50} /></div>}
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
        <button className="blue-button" onClick={handleApply}>Run</button>
        <button className="purple-button" onClick={handleUpdateCode}>Update Code</button>
        <button className="blue-button" onClick={handleApply}>Adjust Code</button>
      </div>
    </div>
  );
};

export default CustomCodeEditor;
