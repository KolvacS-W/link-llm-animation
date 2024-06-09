import React, { useState } from 'react';
import DescriptionEditor from './components/DescriptionEditor';
import CodeEditor from './components/CodeEditor';
import ResultViewer from './components/ResultViewer';
import './App.css';

const App: React.FC = () => {
  const [description, setDescription] = useState('');
  const [code, setCode] = useState({
    html: '',
    css: '',
    js: ''
  });

  const handleDescriptionApply = (newDescription: string) => {
    setDescription(newDescription);
  };

  const handleCodeApply = (newCode: { html: string; css: string; js: string }) => {
    setCode(newCode);
  };

  return (
    <div className="App">
      <div className="editor-section">
        <DescriptionEditor onApply={handleDescriptionApply} />
        <CodeEditor onApply={handleCodeApply} />
        <ResultViewer code={code} />
      </div>
    </div>
  );
}

export default App;
