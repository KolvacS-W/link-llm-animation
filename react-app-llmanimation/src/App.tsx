import React, { useState, useEffect } from 'react';
import DescriptionEditor from './components/DescriptionEditor';
import CustomCodeEditor from './components/CodeEditor';
import ResultViewer from './components/ResultViewer';
import './App.css';
import { KeywordTree, Version } from './types';

const App: React.FC = () => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number | null>(0);

  useEffect(() => {
    // Initialize the base version on load
    const baseVersion: Version = {
      id: "",
      description: "Adding sth...",
      code: { html: '', css: '', js: '' },
      latestCode: { html: '', css: '', js: '' },
      keywordTree: [
        { level: 1, keywords: [] },
        { level: 2, keywords: [] },
      ],
      wordselected: 'ocean',
      highlightEnabled: false,
      loading: false,
      piecesToHighlightLevel1: [],
      piecesToHighlightLevel2: []
    };

    setVersions([baseVersion]);
  }, []);

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
    if (currentVersionIndex === null) return;
    const updatedVersions = [...versions];
    updatedVersions[currentVersionIndex] = {
      ...updatedVersions[currentVersionIndex],
      description: newDescription,
      keywordTree: extractKeywords(newDescription),
    };
    setVersions(updatedVersions);
  };

  const handleCodeInitialize = (newCode: { html: string; css: string; js: string }) => {
    if (currentVersionIndex === null) return;
    const updatedVersions = [...versions];
    updatedVersions[currentVersionIndex] = {
      ...updatedVersions[currentVersionIndex],
      code: newCode,
    };
    setVersions(updatedVersions);
  };

  const handleUpdateDescription = (newDescription: string) => {
    if (currentVersionIndex === null) return;
    const updatedVersions = [...versions];
    updatedVersions[currentVersionIndex] = {
      ...updatedVersions[currentVersionIndex],
      description: newDescription,
      keywordTree: extractKeywords(newDescription),
    };
    setVersions(updatedVersions);
  };

  const handleWordSelected = (word: string) => {
    if (currentVersionIndex === null) return;
    const updatedVersions = [...versions];
    updatedVersions[currentVersionIndex] = {
      ...updatedVersions[currentVersionIndex],
      wordselected: word,
    };
    setVersions(updatedVersions);
  };

  const saveCurrentVersion = () => {
    if (versions[currentVersionIndex].id != '') {
      console.log('update and save version', versions[currentVersionIndex]);
      const updatedVersions = versions.map((version, index) =>
        index === currentVersionIndex
          ? {
              ...version,
              description: versions[currentVersionIndex]!.description,
              code: versions[currentVersionIndex]!.code,
              latestCode: versions[currentVersionIndex]!.latestCode,
              keywordTree: versions[currentVersionIndex]!.keywordTree,
              wordselected: versions[currentVersionIndex]!.wordselected,
              highlightEnabled: versions[currentVersionIndex]!.highlightEnabled,
              loading: versions[currentVersionIndex]!.loading,
              piecesToHighlightLevel1: versions[currentVersionIndex]!.piecesToHighlightLevel1,
              piecesToHighlightLevel2: versions[currentVersionIndex]!.piecesToHighlightLevel2,
            }
          : version
      );
      setVersions(updatedVersions);
    } else {
      const versionName = prompt("Enter version name:");
      if (!versionName) return;
      console.log('update and save version', versions[currentVersionIndex], versions[currentVersionIndex]!.description);
      const updatedVersions = versions.map((version, index) =>
        index === currentVersionIndex
          ? {
              ...version,
              id: versionName,
              description: versions[currentVersionIndex]!.description,
              code: versions[currentVersionIndex]!.code,
              latestCode: versions[currentVersionIndex]!.latestCode,
              keywordTree: versions[currentVersionIndex]!.keywordTree,
              wordselected: versions[currentVersionIndex]!.wordselected,
              highlightEnabled: versions[currentVersionIndex]!.highlightEnabled,
              loading: versions[currentVersionIndex]!.loading,
              piecesToHighlightLevel1: versions[currentVersionIndex]!.piecesToHighlightLevel1,
              piecesToHighlightLevel2: versions[currentVersionIndex]!.piecesToHighlightLevel2,
            }
          : version
      );
      setVersions(updatedVersions);
    }
    console.log('check all versions', versions);
  };

  const createNewVersion = () => {
    console.log('check all versions', versions);
    const newVersion: Version = {
      id: ``,
      description: "Adding sth...",
      code: { html: '', css: '', js: '' },
      latestCode: { html: '', css: '', js: '' },
      keywordTree: [
        { level: 1, keywords: [] },
        { level: 2, keywords: [] },
      ],
      wordselected: 'ocean',
      highlightEnabled: false,
      loading: false,
      piecesToHighlightLevel1: [],
      piecesToHighlightLevel2: []
    };

    setVersions([...versions, newVersion]);
    setCurrentVersionIndex(versions.length);
  };

  const switchToVersion = (index: number) => {
    console.log('check all versions', versions);
    const selectedVersion = versions[index];
    console.log('selected version', selectedVersion);
    setCurrentVersionIndex(index);
  };

  const deleteVersion = (id: string) => {
    setVersions((prevVersions) => prevVersions.filter(version => version.id !== id));
    setCurrentVersionIndex(null);
    // createNewVersion();
  };

  return (
    <div className="App">
      <div className="editor-section">
        {currentVersionIndex !== null && versions[currentVersionIndex] && (
          <>
            <DescriptionEditor
              onApply={handleDescriptionApply}
              onInitialize={handleCodeInitialize}
              latestCode={versions[currentVersionIndex].latestCode}
              setLatestCode={(code) => handleCodeInitialize(code)}
              description={versions[currentVersionIndex].description}
              onWordSelected={handleWordSelected}
              currentVersionIndex={currentVersionIndex}
              versions={versions}
              setVersions={setVersions}
            />
            <CustomCodeEditor
              code={versions[currentVersionIndex].code}
              onApply={handleCodeInitialize}
              description={versions[currentVersionIndex].description}
              onUpdateDescription={handleUpdateDescription}
              latestCode={versions[currentVersionIndex].latestCode}
              setLatestCode={(code) => handleCodeInitialize(code)}
              keywordTree={versions[currentVersionIndex].keywordTree}
              wordselected={versions[currentVersionIndex].wordselected}
              currentVersionIndex={currentVersionIndex}
              versions={versions}
              setVersions={setVersions}
            />
            <ResultViewer code={versions[currentVersionIndex].code} />
          </>
        )}
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
