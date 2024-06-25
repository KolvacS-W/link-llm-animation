import React, { useState, useEffect, useRef } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import ReactLoading from 'react-loading';
import rehypePrism from 'rehype-prism-plus';
import rehypeRewrite from 'rehype-rewrite';
import { Version, KeywordTree, KeywordNode } from '../types';

//how code highlight work:
// whenever the description is updated, the corresponding keyword tree will be updated for this version, to capture all the keywords
// when we click parse or update a code, processKeywordTree() will be called
// processKeywordTree() will segment code from GPT, then add code blocks for each keyword in keyword tree for this version
// then it will call updateHighlightPieces(), accroding to which word is selected, to update two code lists to highlight: piecesToHighlightLevel1 and piecesToHighlightLevel2 for this specific version
// the piecesToHighlightLevel1 and piecesToHighlightLevel2 will tell exactly which lines of code to highlight, they will be refered when the code is rendered
// when rendering the code, is a line of code is in pieces to highlight, also +-5 lines of code near it would contain the selected word, then highlight it

interface CodeEditorProps {
  code: { html: string; css: string; js: string };
  onApply: (code: { html: string; css: string; js: string }) => void;
  description: string;
  savedOldCode: { html: string; css: string; js: string };
  keywordTree: KeywordTree[];
  wordselected: string;
  currentVersionId: string | null;
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  versions: Version[]; // Add versions to the props;
  extractKeywords: (description: string) => KeywordTree[];
}

const API_KEY = '';

const CustomCodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onApply,
  description,
  savedOldCode,
  keywordTree,
  wordselected,
  currentVersionId,
  setVersions,
  versions, // Receive versions as a prop
  extractKeywords
}) => {
  const [html, setHtml] = useState(code.html);
  const [css, setCss] = useState(code.css);
  const [js, setJs] = useState(code.js);
  const [activeTab, setActiveTab] = useState('html');
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const version = currentVersionId !== null ? versions.find(version => version.id === currentVersionId) : null;
  const loading = version ? version.loading : false;
  const highlightEnabled = version ? version.highlightEnabled : true;
  const piecesToHighlightLevel1 = version ? version.piecesToHighlightLevel1 : [];
  const piecesToHighlightLevel2 = version ? version.piecesToHighlightLevel2 : [];

  useEffect(() => {
    setHtml(code.html);
    setCss(code.css);
    setJs(code.js);
  }, [code]);

  useEffect(() => {
    if (highlightEnabled) {
      updateHighlightPieces(currentVersionId);
    }
  }, [keywordTree, wordselected, highlightEnabled, currentVersionId]);

  //save the last state of current version when it updates
  const saveVersionToHistory = (currentVersionId: string) => {
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version => {
        if (version.id === currentVersionId) {
          const historyVersion = { ...version, id: `${currentVersionId}-history` };
          return { ...version, history: historyVersion };
        }
        return version;
      });
      return updatedVersions;
    });
  };

  const handleParseRun = (versionId: string) => {
    onApply({ html, css, js });
    processKeywordTree(versionId);
  };

  const updateHighlightPieces = (versionId: string | null) => {
    if (!versionId) return;
    
    const level1Pieces: string[] = [];
    const level2Pieces: string[] = [];

    const keywordTree = versions.find(version => version.id === versionId)?.keywordTree || [];

    keywordTree.forEach((tree: KeywordTree) => {
      tree.keywords.forEach((keywordNode: KeywordNode) => {
        if (tree.level === 1 && keywordNode.keyword === wordselected) {
          level1Pieces.push(keywordNode.codeBlock);
        } else if (tree.level === 2 && keywordNode.keyword === wordselected) {
          level2Pieces.push(keywordNode.codeBlock);
        }
      });
    });

    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, piecesToHighlightLevel1: level1Pieces, piecesToHighlightLevel2: level2Pieces }
          : version
      );
      return updatedVersions;
    });
  };

  //called when new code is generated
  const processKeywordTree = async (versionId: string | null) => {
    if (!versionId) return;

    const gptResults = await ParseCodeGPTCall(versionId);
    const codePieces = gptResults.split('$$$');
    const sublists = codePieces.map(piece => piece.split('@@@'));

    const level1Pieces: string[] = [];
    const level2Pieces: string[] = [];

    codePieces.forEach(piece => {
      if (piece.trim() && !piece.match(/^[\n@$]+$/)) {
        level1Pieces.push(piece);
      }
    });

    sublists.forEach(sublist => {
      sublist.forEach(subpiece => {
        if (subpiece.trim() && !subpiece.match(/^[\n@$]+$/)) {
          level2Pieces.push(subpiece);
        }
      });
    });

    const updatedKeywordTree = versions.find(version => version.id === versionId)?.keywordTree || [];

    updatedKeywordTree.forEach((tree: KeywordTree) => {
      tree.keywords.forEach((keywordNode: KeywordNode) => {
        keywordNode.codeBlock = '';

        if (tree.level === 1) {
          codePieces.forEach(piece => {
            if (piece.toLowerCase().includes(keywordNode.keyword.toLowerCase())) {
              keywordNode.codeBlock += piece;
            }
          });
        }
  
        if (tree.level === 2) {
          sublists.forEach(sublist => {
            sublist.forEach(subpiece => {
              if (subpiece.toLowerCase().includes(keywordNode.keyword.toLowerCase())) {
                keywordNode.codeBlock += subpiece;
              }
            });
          });
        }
      });
    });
    //update tree first
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version => 
        version.id === versionId 
          ? { 
              ...version, 
              keywordTree: updatedKeywordTree
            }
          : version
      );
      return updatedVersions;
    });

    updateHighlightPieces(versionId);

  };

  const ParseCodeGPTCall = async (versionId: string): Promise<string> => {
    saveVersionToHistory(versionId);
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, loading: true }
          : version
      );
      return updatedVersions;
    });

    const prompt = `Segment the following animation code into different blocks in two levels according to its functionalities.\\
    Use $$$ to segment level 1 blocks, and @@@ to further segment level 2 blocks within each level 1 block.\\
    Return full parsed code blocks in this format:
    $$$
    ...
    @@@
    ...
    @@@
    ...
    @@@
    ...
    $$$
    ...
    $$$
    Example input code:\\          
      <!-- Bird-like shapes representing birds -->
      <polygon id="bird1" points="25,150 35,150 30,145" fill="brown"/>
      <polygon id="bird2" points="55,150 65,150 60,145" fill="brown"/>
    </svg>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    <script>
      // Animate the first bird
      anime({
        targets: '#bird1',
        translateX: anime.path('#birdPath1')('x'),
        translateY: anime.path('#birdPath1')('y'),
        easing: 'easeInOutSine',
        duration: 3000,
        loop: true,
        direction: 'alternate'
      });
      
      // Animate the second bird
      anime({
        targets: '#bird2',
        translateX: anime.path('#birdPath2')('x'),
        translateY: anime.path('#birdPath2')('y'),
        easing: 'easeInOutSine',
        duration: 3500,
        loop: true,
        direction: 'alternate'
      });
    </script>

    Example segmented result:
    $$$
    @@@
    <!-- Bird-like shapes representing birds -->
      <polygon id="bird1" points="25,150 35,150 30,145" fill="brown"/>
    @@@
      <polygon id="bird2" points="55,150 65,150 60,145" fill="brown"/>
    @@@
    $$$
    </svg>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    $$$
    <script>
    @@@
      // Animate the first bird
      anime({
        targets: '#bird1',
        translateX: anime.path('#birdPath1')('x'),
        translateY: anime.path('#birdPath1')('y'),
        easing: 'easeInOutSine',
        duration: 3000,
        loop: true,
        direction: 'alternate'
      });
    @@@
      // Animate the second bird
      anime({
        targets: '#bird2',
        translateX: anime.path('#birdPath2')('x'),
        translateY: anime.path('#birdPath2')('y'),
        easing: 'easeInOutSine',
        duration: 3500,
        loop: true,
        direction: 'alternate'
      });
    @@@
    </script>
    $$$ 
    There must be at least 4 level1 blocks and 8 level2 blocks in the segmented code response;
    Segmented code should include all the code in the input.
    Include only the segmented code in response.
    Code to segment: ${html}
    `;

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

      const data = await response.json();
      const gptResponse = data.choices[0]?.message?.content;
      return gptResponse;
    } catch (error) {
      console.error("Error processing GPT request:", error);
      return '';
    } finally {
      setVersions((prevVersions) => {
        const updatedVersions = prevVersions.map(version =>
          version.id === versionId
            ? { ...version, loading: false }
            : version
        );
        return updatedVersions;
      });
    }
  };

  const handleUpdateCode = async (versionId: string) => {
    saveVersionToHistory(versionId);
    if (!versionId) return;

    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, code: { html, css, js } }
          : version
      );
      return updatedVersions;
    });  

    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, loading: true }
          : version
      );
      return updatedVersions;
    });

    const prompt = `Based on the following existing old description describing old code and the updated code, provide an updated description reflecting changes to the code. \\
    Old description: ${description}. \\
    Old code: HTML: \`\`\`html${savedOldCode.html}\`\`\` CSS: \`\`\`css${savedOldCode.css}\`\`\` JS: \`\`\`js${savedOldCode.js}\`\`\` \\
    Updated code: HTML: \`\`\`html${html}\`\`\` CSS: \`\`\`css${css}\`\`\` JS: \`\`\`js${js}\`\`\` \\
    Description format:\\
    xxxxx[entity1]{detail for entity1}xxxx[entity2]{detail for entity2}... \\ 
    Important: One [] only contain one entity and one {} only contain one detail. Each entity and each detail are wrapped in a [] and {} respectively. Include nothing but the new description in the response.\\
    Example description:
    [fishes]{#fish1 and #fish2, orange-colored, marine creatures depicted using polygonal SVG elements} shaped as [complex polygons]{polygonal shapes simulating the bodily form of fish with points configured in specific coordinates} are [swimming]{both #fish1 and #fish2 are animated to dynamically move along their designated paths:#path1 and #path2, predefined SVG paths depicted as smooth wavy lines} across an [ocean]{visualized by a large rectangular area filled with a vertical blue gradient, representing water}\\
    Just as the old description, make sure it is made of coherent sentences with words other than entities and details.\\
    Include only the updated description in the response.`;

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

      const data = await response.json();
      const newDescriptionContent = data.choices[0]?.message?.content;

      if (newDescriptionContent) {
        const updatedDescription = newDescriptionContent.replace('] {', ']{');
        setVersions((prevVersions) => {
          const updatedVersions = prevVersions.map(version => 
            version.id === versionId 
              ? { 
                  ...version, 
                  description: updatedDescription,
                  savedOldDescription: updatedDescription,  
                  keywordTree: extractKeywords(updatedDescription) 
                }
              : version
          );
          return updatedVersions;
        });
        processKeywordTree(versionId);
      }
    } catch (error) {
      console.error("Error processing update code request:", error);
    } finally {
      setVersions((prevVersions) => {
        const updatedVersions = prevVersions.map(version =>
          version.id === versionId
            ? { ...version, loading: false }
            : version
        );
        return updatedVersions;
      });
    }
  };

  const getFullText = (node: any) => {
    let text = '';
    const recurse = (child: any) => {
      if (child.type === 'text') {
        text += child.value;
      } else if (child.children) {
        child.children.forEach(recurse);
      }
    };
    node.children.forEach(recurse);
    return text.trim();
  };

  const shouldHighlightLine = (nodeText: string, index: number, codeLines: string[]) => {
    const regex = /[^{}()@#\s$]/; 
    const isMeaningfulText = (text: string) => regex.test(text);

    if (!isMeaningfulText(nodeText)) {
      return false;
    }

    if (nodeText.includes(wordselected)) {
      return true;
    }

    for (let i = Math.max(0, index - 5); i < Math.min(codeLines.length, index + 5); i++) {
      if (codeLines[i].includes(wordselected)) {
        return true;
      }
    }

    return false;
  };

  const highlightCodeLines = (node: any, level1: string[], level2: string[], codeLines: string[], index: number) => {
    const nodeText = getFullText(node).trim();

    if (shouldHighlightLine(nodeText, index, codeLines)) {
      level1.forEach(piece => {
        if (piece.includes(nodeText)) {
          if (!node.properties.className) {
            node.properties.className = [];
          }
          node.properties.className.push('highlight-level1');
        }
      });

      level2.forEach(piece => {
        if (piece.includes(nodeText)) {
          if (!node.properties.className) {
            node.properties.className = [];
          }
          node.properties.className.push('highlight-level2');
        }
      });
    }
  };

  const renderEditor = (language: string, value: string, setValue: React.Dispatch<React.SetStateAction<string>>) => {
    const codeLines = value.split('\n');
    return (
      <div style={{ height: '600px', width: '400px', overflow: 'auto' }}>
        <CodeEditor
          value={value}
          language={language}
          placeholder={`Enter ${language.toUpperCase()} here`}
          onChange={(e) => setValue(e.target.value)}
          padding={15}
          ref={editorRef}
          rehypePlugins={[
            [rehypePrism, { ignoreMissing: true }] as any,
            [
              rehypeRewrite,
              {
                rewrite: (node, index, parent) => {
                  if (node.properties?.className?.includes('code-line')) {
                    if (highlightEnabled) {
                      highlightCodeLines(node, piecesToHighlightLevel1, piecesToHighlightLevel2, codeLines, index);
                    }
                  }
                }
              }
            ] as any
          ]}
          style={{
            fontSize: 12,
            backgroundColor: '#f5f5f5',
            fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
          }}
        />
      </div>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'html':
        return renderEditor('html', html, setHtml);
      case 'css':
        return renderEditor('css', css, setCss);
      case 'js':
        return renderEditor('javascript', js, setJs);
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
      <div style={{ height: '100%' }}>
        {renderActiveTab()}
      </div>
      <div className="button-group">
        <button className="blue-button" onClick={() => handleParseRun(currentVersionId || '')}>Parse and Run</button>
        <button className="purple-button" onClick={() => handleUpdateCode(currentVersionId || '')}>Update Code</button>
        <button 
          className="green-button" 
          onClick={() => setVersions(prevVersions => {
            const updatedVersions = prevVersions.map(version =>
              version.id === currentVersionId
                ? { ...version, highlightEnabled: !highlightEnabled }
                : version
            );
            return updatedVersions;
          })}
        >
          {highlightEnabled ? 'Disable Highlight' : 'Enable Highlight'}
        </button>
      </div>
    </div>
  );
};

export default CustomCodeEditor;
