// Import necessary libraries and types
import React from 'react';
import ReactLoading from 'react-loading';
import ContentEditable from './ContentEditable';
import { Version, KeywordTree } from '../types';

interface DescriptionEditorProps {
  onApply: (description: string) => void;
  onInitialize: (code: { html: string; css: string; js: string }) => void;
  latestCode: { html: string; css: string; js: string };
  description: string;
  savedDescription: string;
  onWordSelected: (word: string) => void;
  currentVersionId: string | null;
  versions: Version[];
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  extractKeywords: (description: string) => KeywordTree[];
}

const API_KEY = '';

const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
  onApply,
  onInitialize,
  latestCode,
  description: propDescription,
  savedDescription,
  onWordSelected,
  currentVersionId,
  versions,
  setVersions,
  extractKeywords,
}) => {
  const version = versions.find(version => version.id === currentVersionId);
  const loading = version ? version.loading : false;

  const handleInitialize = async (versionId: string) => {
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
              ? { ...version, code: newCode }
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
                  savedDescription: updatedDescription,
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
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, loading: true }
          : version
      );
      return updatedVersions;
    });

    const prompt = `Based on the following old code and its old description and an updated description, provide an updated code. \\
    Old code: HTML: \`\`\`html${latestCode.html}\`\`\` CSS: \`\`\`css${latestCode.css}\`\`\` JS: \`\`\`js${latestCode.js}\`\`\` \\
    Old Description: ${versions.find(version => version.id === versionId)?.savedDescription}. \\
    New description: ${version?.description}. \\
    Include updated code and the explanation of what changed in the updated description, and why your change in the code can match this description change.\\
    Still use anime.js and svg paths as backbone of the animation code as the old code.\\
    Use customizable svg paths for object movement. You can refer to old code to see example methods and code formats and refine it according to the new description.\\
    Donnot use any external elements like images or svg, create everything with code.\\
    Try to include css and javascript code in html like the old code.\\
    Try to keep the new code as close as old one as possible, only change the necessary parts that is updated by new description.\\
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
        const newCode = parseGPTResponse(content);
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version =>
            version.id === versionId
              ? { ...version, code: newCode }
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
      return 4 extended prompts in the response (divided by ///), and only return these extended. prompts in the response.
      Make the extended prompt simple and precise, just describe the necessary details. Donnot add too much subjective modifier and contents irrelevant to original prompt.
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
          model: "gpt-4-turbo",
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
              savedDescription: '',
              code: { html: '', css: '', js: '' },
              latestCode: { html: '', css: '', js: '' },
              keywordTree: extractKeywords(desc),
              wordselected: 'ocean',
              highlightEnabled: false,
              loading: false,
              piecesToHighlightLevel1: [],
              piecesToHighlightLevel2: [],
              showDetails: {},
              latestText: desc.trim(),
              hiddenInfo: [],
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

  const toggleDetails = (word: string) => {
    if (!currentVersionId) return;
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? {
              ...version,
              showDetails: { ...version.showDetails, [word]: !version.showDetails[word] },
              description: version.latestText.replace('] {', ']{'),
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
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .replace('\n', ' ')
      .replace('] {', ']{') // Replace '] {' with ']{'
      .trim(); // Trim any leading or trailing whitespace

    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? {
              ...version,
              latestText: text.replace('] {', ']{'),
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
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .replace('\n', ' ')
      .replace('] {', ']{') // Replace '] {' with ']{'
      .trim(); // Trim any leading or trailing whitespace

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
    onWordSelected(word);
  };

  return (
    <div className="description-editor">
      <div className="content-editable-container">
        <ContentEditable
          value={version?.description || ''}
          onChange={handleTextChange}
          onRightClick={toggleDetails}
          showDetails={version?.showDetails || {}}
          onTabPress={handleTabPress}
          hiddenInfo={version?.hiddenInfo || []}
          setHiddenInfo={hiddenInfo => {
            if (!currentVersionId) return;
            setVersions(prevVersions => {
              const updatedVersions = prevVersions.map(version =>
                version.id === currentVersionId
                  ? { ...version, hiddenInfo }
                  : version
              );
              return updatedVersions;
            });
          }}
          onDoubleClick={handleDoubleClick}
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
        <button className="purple-button" onClick={() => handleInitialize(currentVersionId || '')}>Initialize Description</button>
        <button className="purple-button" onClick={() => updateDescriptionGPTCall(currentVersionId || '')}>Update Description</button>
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
