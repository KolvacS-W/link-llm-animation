// Import necessary libraries and types
import React, { useEffect } from 'react';
import ReactLoading from 'react-loading';
import ContentEditable from './ContentEditable';
import { Version, KeywordTree } from '../types';
import { useState } from 'react';



interface DescriptionEditorProps {
  onApply: (description: string) => void;
  savedOldCode: { html: string; css: string; js: string };
  onWordSelected: (word: string) => void;
  currentVersionId: string | null;
  versions: Version[];
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  extractKeywords: (description: string) => KeywordTree[];
}

const API_KEY = '';

const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
  onApply,
  savedOldCode,
  onWordSelected,
  currentVersionId,
  versions,
  setVersions,
  extractKeywords,
}) => {
  const version = versions.find(version => version.id === currentVersionId);
  const loading = version ? version.loading : false;

  //update latestDescriptionText whenever description changes
  useEffect(() => {
    const currentDescription = versions.find(version => version.id === currentVersionId)?.description || '';
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, latestDescriptionText: currentDescription }
          : version
      );
      return updatedVersions;
    });
  }, [versions.find(version => version.id === currentVersionId)?.description]);

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
  

  const handleParseDescription = async (versionId: string) => {
    saveVersionToHistory(versionId);
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, loading: true }
          : version
      );
      return updatedVersions;
    });
  
    const prompt = `Find the text pieces that is about specific code details (e.g, variable name, parameters, size, number, path, coordinates) from the given description of an animation program made by anime.js.
                    and return a list of the found text pieces. make sure the returned text pieces are exactly from the description. Splift the text pieces with ///.
                    Example description:
                    A [cottage] {rect element with x: 50, y: 80, width: 100, height: 60, filled in white} perched on 
                    a [green mountain] {path element shaped to create a mountainous outline with coordinates "M0 140 L50 100 L100 140 L150 90 L200 140 L200 200 L0 200 Z", filled in #006400} under 
                    a [sky-blue background] {rect element covering the entire SVG's upper area with width="100%" and height="200", fill="#87CEEB"}.

                    Example response:
                    with x: 50, y: 80, width: 100, height: 60
                    ///
                    with coordinates "M0 140 L50 100 L100 140 L150 90 L200 140 L200 200 L0 200 Z"
                    ///
                    filled in #006400
                    ///
                     with width="100%" and height="200"
                     ///
                     fill="#87CEEB"
                    
                     Return pieces from this description: : ${version?.description}
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
      const content = data.choices[0]?.message?.content;
      console.log('response from handleParseDescription', content)
  
      if (content) {
        const specificParamList = content.split('///').map((param: string) => param.trim());
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version =>
            version.id === versionId
              ? { ...version, specificParamList }
              : version
          );
          return updatedVersions;
        });
      }
    } catch (error) {
      console.error("Error processing request:", error);
    } finally {
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version =>
          version.id === versionId
            ? { ...version, loading: false }
            : version
        );
        return updatedVersions;
      });
    }
  };
  
  const handleSpecificParamRightClick = (text: string) => {
    if (!currentVersionId) return;
    const currentDescription = versions.find(version => version.id === currentVersionId)?.description || '';
    const updatedDescription = currentDescription.replace(text, '');
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? {
              ...version,
              description: updatedDescription,
              specificParamList: version.specificParamList.filter(param => param !== text)
            }
          : version
      );
      return updatedVersions;
    });
    console.log('description updated by handleSpecificParamRightClick', versions)
  };
  
  
  
  // functions for GPT calls. for async functions, versionId must be passed as a parameter to keep track of the right version
  const handleInitialize = async (versionId: string) => {
    saveVersionToHistory(versionId);
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, loading: true }
          : version
      );
      return updatedVersions;
    });

    const prompt = `Create an animation using anime.js based on the given instruction. Make the result animation on a square page that can fit and center on any pages. Use customizable svg paths for object movement. You can refer to this code snippet to see example methods and code formats but need to create different code:\\
    Code snippet:\\
    <!DOCTYPE html>\\<html lang="en">\\  <head>\\    <style>\\      html, body {\\        margin: 0;\\        padding: 0;\\        width: 100%;\\        height: 100%;\\        display: flex;\\        justify-content: center;\\        align-items: center;\\        overflow: hidden;\\      }\\      svg {\\        width: 100vmin;\\        height: 100vmin;\\      }\\    </style>\\  </head>\\  <body>\\    <svg viewBox="0 0 200 200">\\      <path id="path1" d="M10,10 Q90,90 180,10" fill="transparent" stroke="black"/>\\      <path id="path2" d="M10,190 Q90,110 180,190" fill="transparent" stroke="black"/>\\      <circle id="ball1" cx="0" cy="0" r="5" fill="red"/>\\      <circle id="ball2" cx="0" cy="0" r="5" fill="blue"/>\\    </svg>\\    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>\\    <script>\\      anime({\\        targets: \'#ball1\',\\        translateX: anime.path(\'#path1\')(\'x\'),\\        translateY: anime.path(\'#path1\')(\'y\'),\\        easing: \'easeInOutQuad\',\\        duration: 2000,\\        loop: true,\\        direction: \'alternate\'\\      });\\      anime({\\        targets: \'#ball2\',\\        translateX: anime.path(\'#path2\')(\'x\'),\\        translateY: anime.path(\'#path2\')(\'y\'),\\        easing: \'easeInOutQuad\',\\        duration: 2000,\\        loop: true,\\        direction: \'alternate\'\\      });\\    </script>\\  </body>\\</html>\\ 
    Donnot use any external elements like images or svg, create everything with code.\\
    Make sure to implement as much details from the description as possible. e.g., include elements (e.g., eyes, windows) of objects (e.g., fish, house), the features (e.g., shape, color) and the changes (e.g., movement, size, color)).
    Try to include css and javascript code in html like the code snippet.
    Return response in this format: (Code:  \`\`\`html html code \`\`\`html, \`\`\`js javascript code, leave blank if none \`\`\`js, \`\`\`css css code, leave blank if none \`\`\`css; Explanation: explanations of the code). Instruction: ${version?.description}`;
    try {
      console.log('meet eytan', prompt)
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "system", content: "You are a creative programmer." }, { role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (content) {
        const newCode = parseGPTResponse(content);
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version =>
            version.id === versionId
              ? { ...version, code: newCode, savedOldCode: newCode }
              : version
          );
          return updatedVersions;
        });
        await handleSecondGPTCall(newCode, version?.description || '', versionId);
      }
    } catch (error) {
      console.error("Error processing request:", error);
    } finally {
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version =>
          version.id === versionId
            ? { ...version, loading: false }
            : version
        );
        return updatedVersions;
      });
      console.log('check versions after handlesecondgptcall', versions)
    }
  };

  const handleSecondGPTCall = async (newCode: { html: string; css: string; js: string }, existingDescription: string, versionId: string) => {
    const newPrompt = `Based on the following code and description, provide an updated description. Code: HTML: \`\`\`html${newCode.html}\`\`\` CSS: \`\`\`css${newCode.css}\`\`\` JS: \`\`\`js${newCode.js}\`\`\` Description: ${existingDescription}. create the updated description by 1): finding important entities in the old description (for example, 'planet', 'shape', 'color', 'move' are all entity) and inserting [] around them 2): insert a detail wrapped in {} behind each entity according to the code (for example, add number of planets and each planet's dom element type, class, style features and name to entity 'planet').\\
    New description format:\\
    xxxxx[entity1]{detail for entity1}xxxx[entity2]{detail for entity2}... \\ 
    Important: The entities must be within the old description already instead of being newly created. Find as much entities in the old description as possible. Each entity and each detail are wrapped in a [] and {} respectively. Other than the two symbols ([], {}) and added details, the updated description should be exactly same as old description. Include nothing but the new description in the response.\\
    Example old description: Polygons moving and growing
    Example output updated description:
    [polygons]{two different polygon elements, polygon1 and polygon2 colored red and blue respectively, each defined by three points to form a triangle shape} [moving]{motion defined along path1-transparent fill and black stroke, and path2 -transparent fill and black stroke} and [growing]{size oscillates between 1 and 2 over a duration of 2000ms with easing}
`;

    try {
      console.log('prompt eytan', newPrompt)
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [{ role: "system", content: "You are a creative programmer." }, { role: "user", content: newPrompt }],
        }),
      });

      const data = await response.json();
      const newDescriptionContent = data.choices[0]?.message?.content;

      if (newDescriptionContent) {
        const updatedDescription = newDescriptionContent.replace('] {', ']{');
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version =>
            version.id === versionId
              ? {
                  ...version,
                  description: updatedDescription,
                  savedOldDescription: updatedDescription,
                  keywordTree: extractKeywords(updatedDescription),
                }
              : version
          );
          return updatedVersions;
        });
      }
    } catch (error) {
      console.error("Error processing second request:", error);
    }
  };

  const updateDescriptionGPTCall = async (versionId: string) => {
    saveVersionToHistory(versionId);
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, loading: true }
          : version
      );
      return updatedVersions;
    });

    const prompt = `Based on the following old code and its old description, I am showing you an updated description and you will provide an updated code. \\
    Old code: HTML: \`\`\`html${savedOldCode.html}\`\`\` CSS: \`\`\`css${savedOldCode.css}\`\`\` JS: \`\`\`js${savedOldCode.js}\`\`\` \\
    Old Description: ${versions.find(version => version.id === versionId)?.savedOldDescription}. \\
    New description: ${version?.description}. \\
    In the description, words in [] are important entities that must be created by code, and following entities are detailed hints in {} to specify how to create these entities and animations with code.
    Still use anime.js and use customizable svg paths for object movement. You can refer to old code to see example methods and code formats and refine it according to the new description.\\
    Donnot use any external elements like images or svg, create everything with code.\\
    Try to include css and javascript code in html like the old code.\\
    Make sure to modify as little code as possible, keep as much original objects and structure as possible, only change the necessary parts that is updated by new description.\\
    Unless chenged in description, donnot change html and body Styles or svg styles in the <style> tag.\\
    Include updated code and the explanation of what changed in the updated description, and why your change in the code can match this description change, and how your change didn't affect the existing code pieces or CSS Styles that remains the same according to description.\\
    Return response in this format: (Code:  \`\`\`html html code \`\`\`html, \`\`\`js javascript code, leave blank if none \`\`\`js, \`\`\`css css code, leave blank if none \`\`\`css; Explanation: explanation content)`;
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
      const content = data.choices[0]?.message?.content;
      if (content) {
        console.log('prompt for update description', prompt)
        console.log('response after update description', content)
        const newCode = parseGPTResponse(content);
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version =>
            version.id === versionId
              ? { ...version, code: newCode, savedOldCode: newCode }
              : version
          );
          return updatedVersions;
        });
        await GPTCallAfterupdateDescription(newCode, version?.description || '', versionId);
      }
    } catch (error) {
      console.error("Error processing update description request:", error);
    } finally {
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version =>
          version.id === versionId
            ? { ...version, loading: false }
            : version
        );
        return updatedVersions;
      });
    }
  };

  const GPTCallAfterupdateDescription = async (newCode: { html: string; css: string; js: string }, existingDescription: string, versionId: string) => {
    const newPrompt = `Slightly refine the given description for the code, to make it fit the code better. Code: HTML: \`\`\`html${newCode.html}\`\`\` CSS: \`\`\`css${newCode.css}\`\`\` JS: \`\`\`js${newCode.js}\`\`\` Description: ${existingDescription}.\\
    New description format:\\
    xxxxx[entity1]{detail for entity1}xxxx[entity2]{detail for entity2}... \\ 
    Important: One [] only contain one entity and one {} only contain one detail. Each entity and each detail are wrapped in a [] and {} respectively. Include nothing but the new description in the response.\\
    Example description:
    [fishes]{#fish1 and #fish2, orange-colored, marine creatures depicted using polygonal SVG elements} shaped as [complex polygons]{polygonal shapes simulating the bodily form of fish with points configured in specific coordinates} are [swimming]{both #fish1 and #fish2 are animated to dynamically move along their designated paths:#path1 and #path2, predefined SVG paths depicted as smooth wavy lines} across an [ocean]{visualized by a large rectangular area filled with a vertical blue gradient, representing water}\\
    Just as the old description, make sure it is made of coherent sentences with words other than entities and details.\\
    Try to keep the updated description as close to the old description as possible, only change necessary parts to fit the code better.\\
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
          messages: [{ role: "system", content: "You are a creative programmer." }, { role: "user", content: newPrompt }],
        }),
      });

      const data = await response.json();
      const newDescriptionContent = data.choices[0]?.message?.content;

      if (newDescriptionContent) {
        const updatedDescription = newDescriptionContent.replace('] {', ']{');
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version =>
            version.id === versionId
              ? {
                  ...version,
                  description: updatedDescription,
                  savedOldDescription: updatedDescription,
                  keywordTree: extractKeywords(updatedDescription),
                }
              : version
          );
          return updatedVersions;
        });
      }
    } catch (error) {
      console.error("Error processing second request:", error);
    }
  };

  const handleExtend = async (versionId: string) => {
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, loading: true }
          : version
      );
      return updatedVersions;
    });

    const baseVersionName = versionId;

    try {
      const prompt = `Help me extend a prompt and add more details. The prompt is for creating animations with anime.js. 
      Extend the original prompt, to make it more expressive with more details that suits the prompt description and also give more clear instructions to what the animation code should be (e.g., tell in detail elements (e.g., eyes, windows) of objects (e.g., fish, house), the features (e.g., shape, color) and the changes (e.g., movement, size, color) as well as how they are made in animation code).
      Just add details and descriptions without changing the sentence structure.\\
      return 4 extended prompts in the response (divided by ///), and only return these extended. prompts in the response.
      Make the extended prompt simple and precise, just describe the necessary details. Do not add too many subjective modifiers and contents irrelevant to original prompt.
      Example:
      Original prompt:
      A fish swimming in ocean

      response:
      a blue fish with large eyes and flowing fins swimming straight in blue ocean.
      ///
      a fish with intricate scales, a bright orange body, and a curved tail swimming in waving paths in darkblue ocean.
      ///
      a tropical fish with vibrant stripes of yellow, green, and red with a streamlined body and sharp, pointed fins swimming slowly in blue ocean.
      ///
      a fish with a round body, whimsical patterns on its scales with small black eyes swimming from left to right in waving ocean.

      Extend this prompt: ${version?.description}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a creative programmer." },
            { role: "user", content: prompt },
          ],
        }),
      });

      const data = await response.json();
      const newDescriptionContent = data.choices[0]?.message?.content;

      if (newDescriptionContent) {
        const newDescriptions = newDescriptionContent.split('///');
        setVersions(prevVersions => {
          const updatedVersions = [...prevVersions];
          newDescriptions.forEach((desc: string, index: number) => {
            updatedVersions.push({
              id: `${baseVersionName} extended ${index + 1}`,
              description: desc.trim(),
              savedOldDescription: '',
              code: { html: '', css: '', js: '' },
              savedOldCode: { html: '', css: '', js: '' },
              keywordTree: extractKeywords(desc),
              wordselected: 'ocean',
              highlightEnabled: false,
              loading: false,
              piecesToHighlightLevel1: [],
              piecesToHighlightLevel2: [],
              showDetails: {},
              latestDescriptionText: desc.trim(),
              hiddenInfo: [],
              formatDescriptionHtml:'',
              specificParamList: [], // Added
              paramCheckEnabled: false, // Added
            });
          });
          return updatedVersions;
        });
      }
    } catch (error) {
      console.error("Error processing extend request:", error);
    } finally {
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version =>
          version.id === versionId
            ? { ...version, loading: false }
            : version
        );
        return updatedVersions;
      });
    }
  };

  const parseGPTResponse = (response: string): { html: string; css: string; js: string } => {
    const htmlMatch = response.match(/```html([\s\S]*?)```/);
    const cssMatch = response.match(/```css([\s\S]*?)```/);
    const jsMatch = response.match(/```js([\\s\S]*?)```/);

    const html = htmlMatch ? htmlMatch[1].trim() : '';
    const css = cssMatch ? cssMatch[1].trim() : '';
    const js = jsMatch ? jsMatch[1].trim() : '';

    return { html, css, js };
  };


  //functions for contenteditable props: handle user interaction for formatted description 
  const toggleDetails = (word: string) => {
    if (!currentVersionId) return;
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? {
              ...version,
              showDetails: { ...version.showDetails, [word]: !version.showDetails[word] },
              description: version.latestDescriptionText.replace('] {', ']{'),
            }
          : version
      );
      return updatedVersions;
    });
  };
  
  const handleTextChange = (html: string) => {
    if (!currentVersionId) return;
    const extractText = (node: ChildNode): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const word = element.getAttribute('data-word');
        if (word) {
          const detailsElement = element.querySelector('span[style="color: orange;"]');
          const details = detailsElement ? detailsElement.textContent : '';
          return `[${word}]${details ? ` {${details}}` : ''}`;
        }
        return Array.from(node.childNodes).map(extractText).join('');
      }
      return '';
    };
  
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let text = Array.from(doc.body.childNodes)
      .map(extractText)
      .join('')
      .replace(/\s+/g, ' ')
      .replace('\n', ' ')
      .replace('] {', ']{')
      .trim();
  
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? {
              ...version,
              latestDescriptionText: text.replace('] {', ']{'),
            }
          : version
      );
      return updatedVersions;
    });
  };
  
  const handleTabPress = (value: string) => {
    if (!currentVersionId) return;
    const extractText = (node: ChildNode): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const word = element.getAttribute('data-word');
        if (word) {
          const detailsElement = element.querySelector('span[style="color: orange;"]');
          const details = detailsElement ? detailsElement.textContent : '';
          return `[${word}]${details ? ` {${details}}` : ''}`;
        }
        return Array.from(node.childNodes).map(extractText).join('');
      }
      return '';
    };
  
    const doc = new DOMParser().parseFromString(value, 'text/html');
    let text = Array.from(doc.body.childNodes)
      .map(extractText)
      .join('')
      .replace(/\s+/g, ' ')
      .replace('\n', ' ')
      .replace('] {', ']{')
      .trim();
  
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? {
              ...version,
              description: text.replace('] {', ']{'),
            }
          : version
      );
      return updatedVersions;
    });
    onApply(text.replace('] {', ']{'));
  };
  
  const handleDoubleClick = (word: string) => {
    const processedWord = unpluralize(uncapitalize(word.trim()));
    onWordSelected(processedWord);
  };
  
  // Dummy implementations of uncapitalize and unpluralize for demonstration purposes
  function uncapitalize(word: string): string {
    return word.charAt(0).toLowerCase() + word.slice(1);
  }
  
  function unpluralize(word: string): string {
    return word.endsWith('s') ? word.slice(0, -1) : word;
  }

  const handleUndo = () => {
    if (!currentVersionId) return;
    
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version => {
        if (version.id === currentVersionId && version.history) {
          return { ...version.history, id: currentVersionId };
        }
        console.log('undo, but this version has no history yet')
        return version;
      }).filter(version => !version.id.endsWith('-history'));
      return updatedVersions;
    });
  };
  
  return (
    <div className="description-editor">
      <div className="content-editable-container">
        <ContentEditable
          value={version?.description || ''}
          onChange={handleTextChange}
          onRightClick={toggleDetails}
          onTabPress={handleTabPress}
          currentVersionId={currentVersionId}
          onDoubleClick={handleDoubleClick}
          versions={versions}
          setVersions={setVersions}
          paramCheckEnabled={version?.paramCheckEnabled || false} // Added
          specificParamList={version?.specificParamList || []} // Added
          onSpecificParamRightClick={handleSpecificParamRightClick} // Added
        />
      </div>
      <textarea
        value={version?.description || ''}
        onChange={(e) => {
          if (!currentVersionId) return;
          setVersions(prevVersions => {
            const updatedVersions = prevVersions.map(version =>
              version.id === currentVersionId
                ? { ...version, description: e.target.value }
                : version
            );
            return updatedVersions;
          });
        }}
        placeholder="Enter description here"
      />
      <div className="button-group">
        <button className="purple-button" onClick={() => handleExtend(currentVersionId || '')}>Extend</button>
        <button className="purple-button" onClick={() => handleInitialize(currentVersionId || '')}>Initialize</button>
        <button className="purple-button" onClick={() => updateDescriptionGPTCall(currentVersionId || '')}>Update</button>
      </div>
      <div className="button-group">
        <button className="blue-button" onClick={() => handleParseDescription(currentVersionId || '')}>Parse Description</button>
        <button className="green-button" onClick={() => {
          setVersions(prevVersions => {
            const updatedVersions = prevVersions.map(version =>
              version.id === currentVersionId
                ? { ...version, paramCheckEnabled: !version.paramCheckEnabled }
                : version
            );
            return updatedVersions;
          });
        }}>
          {version?.paramCheckEnabled ? 'Disable Param Check' : 'Enable Param Check'}
        </button>
        <button className="red-button" onClick={handleUndo}>Undo</button>
      </div>
      {loading && (
        <div className="loading-container">
          <ReactLoading type="spin" color="#007bff" height={50} width={50} />
        </div>
      )}
    </div>
  );
  
};

export default DescriptionEditor;
