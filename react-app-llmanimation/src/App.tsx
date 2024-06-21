import React, { useState } from 'react';
import DescriptionEditor from './components/DescriptionEditor';
import CustomCodeEditor from './components/CodeEditor';
import ResultViewer from './components/ResultViewer';
import './App.css';
import { KeywordTree } from './types';

interface Version {
  id: string; // Change id to string to store custom names
  description: string;
  code: { html: string; css: string; js: string };
  latestCode: { html: string; css: string; js: string };
  keywordTree: KeywordTree[];
  wordselected: string;
}

const App: React.FC = () => {
  const [description, setDescription] = useState('Adding sth...');
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
  const [wordselected, setWordSelected] = useState('ocean');
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number | null>(null);

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
        .split(/[\s,()]+/)
        .map(word => word.trim())
        .filter(word => word && !stopwords.has(word));
  
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
    const newKeywordTree = extractKeywords(newDescription);
    setKeywordTree(newKeywordTree);
    console.log('keyword tree updated by description', keywordTree)
  };

  const handleWordSelected = (word: string) => {
    console.log('App: word selected:', word);
    setWordSelected(word);
  };

  const saveCurrentVersion = () => {
    const versionName = prompt("Enter version name:");
    if (!versionName) return; // If no name is provided, do not save the version

    const currentVersion: Version = {
      id: versionName,
      description,
      code,
      latestCode,
      keywordTree,
      wordselected,
    };

    setVersions((prevVersions) => [...prevVersions, currentVersion]);
  };

  const createNewVersion = () => {
    setCurrentVersionIndex(null);
    setDescription('');
    setCode({ html: '', css: '', js: '' });
    setLatestCode({ html: '', css: '', js: '' });
    setKeywordTree([
      { level: 1, keywords: [] },
      { level: 2, keywords: [] },
    ]);
    setWordSelected('');
  };

  const switchToVersion = (index: number) => {
    const selectedVersion = versions[index];
    setCurrentVersionIndex(index);
    setDescription(selectedVersion.description);
    setCode(selectedVersion.code);
    setLatestCode(selectedVersion.latestCode);
    setKeywordTree(selectedVersion.keywordTree);
    setWordSelected(selectedVersion.wordselected);
  };

  const deleteVersion = (id: string) => {
    setVersions((prevVersions) => prevVersions.filter(version => version.id !== id));
    setCurrentVersionIndex(null);
    createNewVersion(); // Start a new version after deletion
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
          onWordSelected={handleWordSelected}
        />
        <CustomCodeEditor 
          code={code} 
          onApply={handleCodeInitialize} 
          description={description} 
          onUpdateDescription={handleUpdateDescription} 
          latestCode={latestCode}
          setLatestCode={setLatestCode}
          keywordTree={keywordTree}
          wordselected={wordselected}
        />
        <ResultViewer code={code} />
      </div>
      <div className="version-controls">
        <button className="purple-button" onClick={saveCurrentVersion}>Save</button>
        <button className="green-button" onClick={createNewVersion}>New</button>
        {currentVersionIndex !== null && (
          <button className="red-button" onClick={() => deleteVersion(versions[currentVersionIndex].id)}>Delete</button>
        )}
        <div className="version-buttons">
          {versions.map((version, index) => (
            <button
              key={version.id}
              className={`version-button ${currentVersionIndex === index ? 'selected' : ''}`}
              onClick={() => switchToVersion(index)}
            >
              {version.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
