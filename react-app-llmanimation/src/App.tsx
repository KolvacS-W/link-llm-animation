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
  const [keywordTree, setKeywordTree] = useState<KeywordTree[]>([
    { level: 1, keywords: [] },
    { level: 2, keywords: [] },
  ]);
  const [wordselected, setWordSelected] = useState('ocean'); // Add state for the selected keyword

  const stopwords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it', 
    'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they', 
    'this', 'to', 'was', 'will', 'with'
  ]);

  const extractKeywords = (description: string) => {
    const regex = /\[(.*?)\]\{(.*?)\}/g;
    const level1Keywords = new Set<string>();
    const allSubKeywords = new Set<string>();

    let match;
    while ((match = regex.exec(description)) !== null) {
      const keyword = match[1].trim();
      const details = match[2].trim();
      level1Keywords.add(keyword);

      const subKeywords = details
        .split(' ')
        .map(word => word.trim())
        .filter(word => !stopwords.has(word));

      subKeywords.forEach(subKeyword => allSubKeywords.add(subKeyword));
    }

    const newKeywordTree: KeywordTree[] = [
      { level: 1, keywords: [] },
      { level: 2, keywords: [] },
    ];

    level1Keywords.forEach(keyword => {
      newKeywordTree[0].keywords.push({ 
        keyword, 
        subKeywords: [], 
        children: [], 
        codeBlock: '', 
        parentKeyword: null 
      });
    });

    const uniqueSubKeywords = Array.from(allSubKeywords).filter(
      subKeyword => !level1Keywords.has(subKeyword)
    );

    uniqueSubKeywords.forEach(subKeyword => {
      newKeywordTree[1].keywords.push({ 
        keyword: subKeyword, 
        subKeywords: [], 
        children: [], 
        codeBlock: '', 
        parentKeyword: null 
      });
    });

    return newKeywordTree;
  };

  

  const handleDescriptionApply = (newDescription: string) => {
    console.log('App: new description applied:', newDescription);
    setDescription(newDescription);
    const newKeywordTree = extractKeywords(newDescription);
    setKeywordTree(newKeywordTree);
    console.log('keyword tree updated by description', keywordTree)
  };

  const handleCodeInitialize = (newCode: { html: string; css: string; js: string }) => {
    setCode(newCode);
  };

  const handleUpdateDescription = (newDescription: string) => {
    console.log('App: updating description:', newDescription);
    setDescription(newDescription);
  };


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
