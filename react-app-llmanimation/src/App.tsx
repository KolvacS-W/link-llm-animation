import React, { useState } from 'react';
import DescriptionEditor from './components/DescriptionEditor';
import CustomCodeEditor from './components/CodeEditor';
import ResultViewer from './components/ResultViewer';
import './App.css';

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

  return (
    <div className="App">
      <div className="editor-section">
        <DescriptionEditor 
          onApply={handleDescriptionApply} 
          onInitialize={handleCodeInitialize} 
          latestCode={latestCode}
          setLatestCode={setLatestCode}
          description={description} // Pass description as a prop
        />
        <CustomCodeEditor 
          code={code} 
          onApply={handleCodeInitialize} 
          description={description} 
          onUpdateDescription={handleUpdateDescription} 
          latestCode={latestCode}
          setLatestCode={setLatestCode}
        />
        <ResultViewer code={code} />
      </div>
    </div>
  );
}

export default App;
