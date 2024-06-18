// src/App.tsx
import React, { useState } from 'react';
import DescriptionEditor from './components/DescriptionEditor';
import CustomCodeEditor from './components/CodeEditor';
import ResultViewer from './components/ResultViewer';
import './App.css';
import { KeywordTree } from './types';

const App: React.FC = () => {
  const [description, setDescription] = useState('');
  const [code, setCode] = useState({
    html: '',
    css: '',
    js: ''
  });
  const [latestCode, setLatestCode] = useState({ html: '', css: '', js: '' });

  const handleDescriptionApply = (newDescription: string) => {
    console.log('App: new description applied:', newDescription);
    setDescription(newDescription);
  };

  const handleCodeInitialize = (newCode: { html: string; css: string; js: string }) => {
    setCode(newCode);
  };

  const handleUpdateDescription = (newDescription: string) => {
    console.log('App: updating description:', newDescription);
    setDescription(newDescription);
  };

  const keywordTree: KeywordTree[] = [
    {
      level: 1,
      keywords: [
        { keyword: 'fish', subKeywords: ['fill', 'polygon'], children: [], codeBlock: '', parentKeyword: null },
        { keyword: 'swim', subKeywords: ['path', 'stroke'], children: [], codeBlock: '', parentKeyword: null }
      ]
    },
    {
      level: 2,
      keywords: [
        { keyword: 'fill', subKeywords: [], children: [], codeBlock: '', parentKeyword: 'bird' },
        { keyword: 'polygon', subKeywords: [], children: [], codeBlock: '', parentKeyword: 'bird' },
        { keyword: 'path', subKeywords: [], children: [], codeBlock: '', parentKeyword: 'fly' },
        { keyword: 'stroke', subKeywords: [], children: [], codeBlock: '', parentKeyword: 'fly' }
      ]
    }
  ];

  const [wordselected, setWordSelected] = useState('path'); // Add state for the selected keyword

  return (
    <div className="App">
      <div className="editor-section">
        <DescriptionEditor 
          onApply={handleDescriptionApply} 
          onInitialize={handleCodeInitialize} 
          latestCode={latestCode}
          setLatestCode={setLatestCode}
          description={description}
        />
        <CustomCodeEditor 
          code={code} 
          onApply={handleCodeInitialize} 
          description={description} 
          onUpdateDescription={handleUpdateDescription} 
          latestCode={latestCode}
          setLatestCode={setLatestCode}
          keywordTree={keywordTree}
          wordselected={wordselected} // Pass wordselected as a prop
        />
        <ResultViewer code={code} />
      </div>
    </div>
  );
}

export default App;
