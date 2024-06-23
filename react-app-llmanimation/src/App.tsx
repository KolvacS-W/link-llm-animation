import React, { useState, useEffect } from 'react';
import DescriptionEditor from './components/DescriptionEditor';
import CustomCodeEditor from './components/CodeEditor';
import ResultViewer from './components/ResultViewer';
import './App.css';
import { KeywordTree, Version } from './types';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the base version on load
    const baseVersion: Version = {
      id: 'init',
      description: "Adding sth...",
      savedDescription: '',
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
      piecesToHighlightLevel2: [],
      showDetails: {},
      latestText: '',
      hiddenInfo: [],
    };

    setVersions([baseVersion]);
    setCurrentVersionId(baseVersion.id);
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
    console.log('keyword tree updated', currentVersionId, newKeywordTree)
    return newKeywordTree;
  };

  const handleDescriptionApply = (newDescription: string) => {
    if (currentVersionId === null) return;
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, description: newDescription, keywordTree: extractKeywords(newDescription) }
          : version
      );
      return updatedVersions;
    });
  };

  const handleCodeInitialize = (newCode: { html: string; css: string; js: string }) => {
    console.log('check code in handleCodeInitialize', newCode.html)
    if (currentVersionId === null) return;
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, code: newCode }
          : version
      );
      return updatedVersions;
    });
  };

  const handleUpdateDescription = (newDescription: string) => {
    if (currentVersionId === null) return;
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, description: newDescription, keywordTree: extractKeywords(newDescription) }
          : version
      );
      return updatedVersions;
    });
  };

  const handleWordSelected = (word: string) => {
    if (currentVersionId === null) return;
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, wordselected: word }
          : version
      );
      return updatedVersions;
    });
  };

  const saveCurrentVersion = () => {
    const currentVersion = versions.find(version => version.id === currentVersionId);
    if (!currentVersion) return;

    if (currentVersion.id.includes('init')) {
      const versionName = prompt("Enter version name:");
      if (!versionName) return;
      //change version id first
      setVersions((prevVersions) => {
        const updatedVersions = prevVersions.map(version =>
          version.id === currentVersionId
            ? { ...version,
              id: versionName,
              }
            : version
        );
        return updatedVersions;
      });
      setCurrentVersionId(versionName);
      //update version contents
      setVersions((prevVersions) => {
        const updatedVersions = prevVersions.map(version =>
          version.id === currentVersionId
            ? { ...version,
              description: versions[currentVersionId]!.description,
              savedDescription: versions[currentVersionId]!. savedDescription,
              code: versions[currentVersionId]!.code,
              latestCode: versions[currentVersionId]!.latestCode,
              keywordTree: versions[currentVersionId]!.keywordTree,
              wordselected: versions[currentVersionId]!.wordselected,
              highlightEnabled: versions[currentVersionId]!.highlightEnabled,
              loading: versions[currentVersionId]!.loading,
              piecesToHighlightLevel1: versions[currentVersionId]!.piecesToHighlightLevel1,
              piecesToHighlightLevel2: versions[currentVersionId]!.piecesToHighlightLevel2,
            }
            : version
        );
        return updatedVersions;
      });
    } else {
      setVersions((prevVersions) => {
        const updatedVersions = prevVersions.map(version =>
          version.id === currentVersionId
            ? { ...version,
              description: versions[currentVersionId]!.description,
              savedDescription: versions[currentVersionId]!. savedDescription,
              code: versions[currentVersionId]!.code,
              latestCode: versions[currentVersionId]!.latestCode,
              keywordTree: versions[currentVersionId]!.keywordTree,
              wordselected: versions[currentVersionId]!.wordselected,
              highlightEnabled: versions[currentVersionId]!.highlightEnabled,
              loading: versions[currentVersionId]!.loading,
              piecesToHighlightLevel1: versions[currentVersionId]!.piecesToHighlightLevel1,
              piecesToHighlightLevel2: versions[currentVersionId]!.piecesToHighlightLevel2,
            }
            : version
        );
        return updatedVersions;
      });
    }
    console.log('check all versions', versions);
  };

  const createNewVersion = () => {
    const newVersion: Version = {
      id: 'init'+uuidv4(),
      description: "Adding sth...",
      savedDescription: '',
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
      piecesToHighlightLevel2: [],
      showDetails: {},
      latestText: '',
      hiddenInfo: [],
    };

    setVersions([...versions, newVersion]);
    setCurrentVersionId(newVersion.id);
  };

  const generateUniqueId = (baseId: string) => {
    let newId = baseId;
    let counter = 1;
    while (versions.some(version => version.id === newId)) {
      newId = `${baseId}${counter}`;
      counter += 1;
    }
    return newId;
  };
  
  const copyCurrentVersion = () => {
    const currentVersion = versions.find(version => version.id === currentVersionId);
    if (!currentVersion) return;

    const baseId = `${currentVersion.id}-copy`;
    const newId = generateUniqueId(baseId);

    const newVersion: Version = {
      ...currentVersion,
      id: newId,
    };

    setVersions([...versions, newVersion]);
    setCurrentVersionId(newVersion.id);
  };


  const switchToVersion = (id: string) => {
    console.log('check all versions', versions);
    const selectedVersion = versions.find(version => version.id === id);
    if (selectedVersion) {
      console.log('selected version', selectedVersion);
      setCurrentVersionId(id);
    }
  };

  const deleteVersion = (id: string) => {
    setVersions((prevVersions) => prevVersions.filter(version => version.id !== id));
    setCurrentVersionId(null);
    // createNewVersion();
  };

  return (
    <div className="App">
      <div className="editor-section">
        {currentVersionId !== null && versions.find(version => version.id === currentVersionId) && (
          <>
            <DescriptionEditor
              onApply={handleDescriptionApply}
              onInitialize={handleCodeInitialize}
              latestCode={versions.find(version => version.id === currentVersionId)!.latestCode}
              setLatestCode={(code) => handleCodeInitialize(code)}
              description={versions.find(version => version.id === currentVersionId)!.description}
              savedDescription={versions.find(version => version.id === currentVersionId)!.savedDescription}
              onWordSelected={handleWordSelected}
              currentVersionId={currentVersionId}
              versions={versions}
              setVersions={setVersions}
              extractKeywords={extractKeywords} // Pass extractKeywords as a prop
            />
            <CustomCodeEditor
              code={versions.find(version => version.id === currentVersionId)!.code}
              onApply={handleCodeInitialize}
              description={versions.find(version => version.id === currentVersionId)!.description}
              onUpdateDescription={handleUpdateDescription}
              latestCode={versions.find(version => version.id === currentVersionId)!.latestCode}
              setLatestCode={(code) => handleCodeInitialize(code)}
              keywordTree={versions.find(version => version.id === currentVersionId)!.keywordTree}
              wordselected={versions.find(version => version.id === currentVersionId)!.wordselected}
              currentVersionId={currentVersionId}
              versions={versions}
              setVersions={setVersions}
              extractKeywords={extractKeywords} // Pass extractKeywords as a prop
            />
            <ResultViewer code={versions.find(version => version.id === currentVersionId)!.code} />
          </>
        )}
      </div>
      <div className="version-controls">
        <button className="purple-button" onClick={saveCurrentVersion}>Save</button>
        <button className="green-button" onClick={createNewVersion}>New</button>
        <button className="blue-button" onClick={copyCurrentVersion}>Copy</button>
        {currentVersionId !== null && (
          <button className="red-button" onClick={() => deleteVersion(currentVersionId)}>Delete</button>
        )}
        <div className="version-buttons">
          {versions.map((version) => (
            <button
              key={version.id}
              className={`version-button ${currentVersionId === version.id ? 'selected' : ''}`}
              onClick={() => switchToVersion(version.id)}
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
