import React, { useState, useEffect, useRef } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import ReactLoading from 'react-loading';
import rehypePrism from 'rehype-prism-plus';
import rehypeRewrite from 'rehype-rewrite';
import { KeywordTree, KeywordNode } from '../types';

interface CodeEditorProps {
  code: { html: string; css: string; js: string };
  onApply: (code: { html: string; css: string; js: string }) => void;
  description: string;
  onUpdateDescription: (newDescription: string) => void;
  latestCode: { html: string; css: string; js: string };
  setLatestCode: (code: { html: string; css: string; js: string }) => void;
  keywordTree: KeywordTree[];
  wordselected: string; // Add wordselected to props
}

const API_KEY = '';

const CustomCodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onApply,
  description,
  onUpdateDescription,
  latestCode,
  setLatestCode,
  keywordTree,
  wordselected,
}) => {
  const [html, setHtml] = useState(code.html);
  const [css, setCss] = useState(code.css);
  const [js, setJs] = useState(code.js);
  const [activeTab, setActiveTab] = useState('html');
  const [loading, setLoading] = useState(false);
  const [piecesToHighlightLevel1, setPiecesToHighlightLevel1] = useState<string[]>([]);
  const [piecesToHighlightLevel2, setPiecesToHighlightLevel2] = useState<string[]>([]);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setHtml(code.html);
    setCss(code.css);
    setJs(code.js);
  }, [code]);

  useEffect(() => {
    updateHighlightPieces();
  }, [keywordTree, wordselected]);

  const handleApply = () => {
    onApply({ html, css, js });
    processKeywordTree(keywordTree);
  };

  const updateHighlightPieces = () => {
    console.log('Updated Keyword Tree:', keywordTree);
    console.log('updating pieces', wordselected)
    const level1Pieces: string[] = [];
    const level2Pieces: string[] = [];

    keywordTree.forEach(tree => {
      tree.keywords.forEach(keywordNode => {
        if (tree.level === 1 && keywordNode.keyword === wordselected) {
          level1Pieces.push(keywordNode.codeBlock);
        } else if (tree.level === 2 && keywordNode.keyword === wordselected) {
          level2Pieces.push(keywordNode.codeBlock);
        }
      });
    });

    setPiecesToHighlightLevel1(level1Pieces);
    setPiecesToHighlightLevel2(level2Pieces);
    console.log('PiecesToHighlightLevel1 updated', piecesToHighlightLevel1)
    console.log('PiecesToHighlightLevel2 updated', piecesToHighlightLevel2)
  };

  const processKeywordTree = async (keywordTree: KeywordTree[]) => {
    const gptResults = await ParseCodeGPTCall();
    const codePieces = gptResults.split('$$$');
    const sublists = codePieces.map(piece => piece.split('@@@'));

    console.log('Code pieces:', codePieces);
    console.log('Sublists:', sublists);

    const level1Pieces: string[] = [];
    const level2Pieces: string[] = [];

    codePieces.forEach(piece => {
      console.log('trimmed piece', piece.trim());
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

    keywordTree.forEach(tree => {
      tree.keywords.forEach(keywordNode => {
        console.log(`Level ${tree.level}, Keyword: ${keywordNode.keyword}, Parent: ${keywordNode.parentKeyword}`);
        keywordNode.codeBlock = '';

        if (tree.level === 1) {
          codePieces.forEach(piece => {
            if (piece.includes(keywordNode.keyword)) {
              keywordNode.codeBlock += piece;
              console.log('level1 node added codeblock', keywordNode.keyword, piece);
            }
          });
        }

        if (tree.level === 2) {
          console.log('node for level2', keywordNode.keyword);
          sublists.forEach(sublist => {
            sublist.forEach(subpiece => {
              console.log('level2 subpiece', subpiece);
              if (subpiece.includes(keywordNode.keyword)) {
                keywordNode.codeBlock += subpiece;
                console.log('level2 node added codeblock', keywordNode.keyword, subpiece);
              }
            });
          });
        }
      });
    });
    updateHighlightPieces();
    // setPiecesToHighlightLevel1(level1Pieces);
    // setPiecesToHighlightLevel2(level2Pieces);

    // console.log('codepieces created:', level1Pieces);
    // console.log('codepieces created:', level2Pieces);

    // console.log('Updated Keyword Tree:', JSON.stringify(keywordTree, null, 2));
  };

  const ParseCodeGPTCall = async (): Promise<string> => {
    setLoading(true);
    const prompt = `Segment the following animation code into different blocks in two levels according to its functionalities.\\
    Use $$$ to segment level 1 blocks, and @@@ to segment level 2 blocks within each level 1 block.\\
    level 1 block should be a snippet that concerns one object or behaviour, level 2 block should be a snippet that serve 1 specific function.\\
    Return only parsed code blocks in this format:
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
    Example code:\\
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }
          svg {
            width: 100vmin;
            height: 100vmin;
          }
          body {
            background-color: skyblue; /* Added blue sky background */
          }
        </style>
      </head>
      <body>
        <svg viewBox="0 0 200 200">
          <!-- Forest (complex polygon area) -->
          <polygon points="0,200 40,140 80,180 120,120 160,170 200,130 200,200" fill="green" />
          
          <!-- Paths representing birds' flight -->
          <path id="birdPath1" d="M30,150 Q70,80 110,10" fill="transparent" stroke="transparent"/>
          <path id="birdPath2" d="M60,150 Q100,90 140,20" fill="transparent" stroke="transparent"/>
          
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
      </body>
    </html>
    Example segmented result:
    ...
    $$$
    @@@
    <!-- Bird-like shapes representing birds -->
      <polygon id="bird1" points="25,150 35,150 30,145" fill="brown"/>
      <polygon id="bird2" points="55,150 65,150 60,145" fill="brown"/>
    @@@
    </svg>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
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
    ...
    Donnot add anything to the code other than $$$ and @@@. Include only the segmented code in response.
    Code to segment: ${html}
    `    
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

      console.log('sent GPT call');
      const data = await response.json();
      const gptResponse = data.choices[0]?.message?.content;
      console.log('GPT response:', gptResponse);

      return gptResponse;
    } catch (error) {
      console.error("Error processing GPT request:", error);
      return '';
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCode = async () => {
    setLoading(true);
    onApply({ html, css, js }); // Save new updated code

    processKeywordTree(keywordTree);

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
        console.log('Updating description in CodeEditor:', newDescriptionContent);
        onUpdateDescription(newDescriptionContent); // Update the prop description to App.tsx, so it will cause DescriptionEditor to update its description and re-render
      }
    } catch (error) {
      console.error("Error processing update code request:", error);
    } finally {
      setLoading(false);
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

  const highlightCodeLines = (node: any, level1: string[], level2: string[]) => {
    console.log('highlighting code', level1)
    const nodeText = getFullText(node).trim();
    const regex = /[^{}()@#\s$]/; // Regex to check for strings other than {},(),@,$,#

    // Function to check if the nodeText contains meaningful content
    const isMeaningfulText = (text: string) => regex.test(text);

    if (!isMeaningfulText(nodeText)) {
      return;
    }

    console.log('level2', level2);

    level1.forEach(piece => {
      if (piece.includes(nodeText)) {
        console.log('nodetext:', nodeText, 'piece:', piece);
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
  };

  const renderActiveTab = () => {
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (editorRef.current) {
        editorRef.current.scrollTop = e.currentTarget.scrollTop;
      }
    };

    switch (activeTab) {
      case 'html':
        return (
          <div style={{ height: '600px', width: '400px', overflow: 'auto' }}>
            <CodeEditor
              value={html}
              language="html"
              placeholder="Enter HTML here"
              onChange={(e) => setHtml(e.target.value)}
              padding={15}
              ref={editorRef}
              rehypePlugins={[
                [rehypePrism, { ignoreMissing: true }] as any,
                [
                  rehypeRewrite,
                  {
                    rewrite: (node, index, parent) => {
                      if (node.properties?.className?.includes('code-line')) {
                        highlightCodeLines(node, piecesToHighlightLevel1, piecesToHighlightLevel2);
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
      case 'css':
        return (
          <div style={{ height: '600px', width: '400px', overflow: 'auto' }}>
            <CodeEditor
              value={css}
              language="css"
              placeholder="Enter CSS here"
              onChange={(e) => setCss(e.target.value)}
              padding={15}
              ref={editorRef}
              style={{
                fontSize: 12,
                backgroundColor: '#f5f5f5',
                fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              }}
            />
          </div>
        );
      case 'js':
        return (
          <div style={{ height: '600px', width: '400px', overflow: 'auto' }}>
            <CodeEditor
              value={js}
              language="javascript"
              placeholder="Enter JS here"
              onChange={(e) => setJs(e.target.value)}
              padding={15}
              ref={editorRef}
              style={{
                fontSize: 12,
                backgroundColor: '#f5f5f5',
                fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              }}
            />
          </div>
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
      <div style={{ height: '100%' }}>
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
