import React, { useState, useEffect } from 'react';
import ReactLoading from 'react-loading';
import ContentEditable from './ContentEditable';
import { Version, KeywordTree } from '../types';

interface DescriptionEditorProps {
  onApply: (description: string) => void;
  onInitialize: (code: { html: string; css: string; js: string }) => void;
  latestCode: { html: string; css: string; js: string };
  setLatestCode: (code: { html: string; css: string; js: string }) => void;
  description: string;
  onWordSelected: (word: string) => void;
  currentVersionIndex: number | null;
  versions: Version[];
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  extractKeywords: (description: string) => KeywordTree[];
}

const API_KEY = '';

const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
  onApply,
  onInitialize,
  latestCode,
  setLatestCode,
  description: propDescription,
  onWordSelected,
  currentVersionIndex,
  versions,
  setVersions,
  extractKeywords,
}) => {
  const [description, setDescription] = useState(propDescription);
  const [savedDescription, setSavedDescription] = useState('');
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [latestText, setLatestText] = useState(propDescription); // Initialize with propDescription
  const [hiddenInfo, setHiddenInfo] = useState<string[]>([]); // State to store details in {}

  useEffect(() => {
    setDescription(propDescription);
    setLatestText(propDescription); // Update latestText when description changes
  }, [propDescription]);

  const handleInitialize = async () => {
    if (currentVersionIndex === null) return;

    setVersions((prevVersions) => {
      const updatedVersions = [...prevVersions];
      updatedVersions[currentVersionIndex].loading = true;
      return updatedVersions;
    });

    const prompt = `Create an animation using anime.js based on the given instruction. Make the result animation on a square page that can fit and center on any pages. Use customizable svg paths for object movement. You can refer to this code snippet to see example methods and code formats but need to create different code:\\
    Code snippet:\\
    <!DOCTYPE html>\\<html lang="en">\\  <head>\\    <style>\\      html, body {\\        margin: 0;\\        padding: 0;\\        width: 100%;\\        height: 100%;\\        display: flex;\\        justify-content: center;\\        align-items: center;\\        overflow: hidden;\\      }\\      svg {\\        width: 100vmin;\\        height: 100vmin;\\      }\\    </style>\\  </head>\\  <body>\\    <svg viewBox="0 0 200 200">\\      <path id="path1" d="M10,10 Q90,90 180,10" fill="transparent" stroke="black"/>\\      <path id="path2" d="M10,190 Q90,110 180,190" fill="transparent" stroke="black"/>\\      <circle id="ball1" cx="0" cy="0" r="5" fill="red"/>\\      <circle id="ball2" cx="0" cy="0" r="5" fill="blue"/>\\    </svg>\\    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>\\    <script>\\      anime({\\        targets: \'#ball1\',\\        translateX: anime.path(\'#path1\')(\'x\'),\\        translateY: anime.path(\'#path1\')(\'y\'),\\        easing: \'easeInOutQuad\',\\        duration: 2000,\\        loop: true,\\        direction: \'alternate\'\\      });\\      anime({\\        targets: \'#ball2\',\\        translateX: anime.path(\'#path2\')(\'x\'),\\        translateY: anime.path(\'#path2\')(\'y\'),\\        easing: \'easeInOutQuad\',\\        duration: 2000,\\        loop: true,\\        direction: \'alternate\'\\      });\\    </script>\\  </body>\\</html>\\ 
    Donnot use any external elements like images or svg, create everything with code.\\
    Make sure to implement as much details from the description as possble. e.g., include elements (e.g., eyes, windows)of objects(e.g., fish, house), the features (e.g., shape, color) and the changes (e.g., movement, size, color)).
    Return response in this format: (Code:  \`\`\`html html code \`\`\`html, \`\`\`js javascript code, leave blank if none \`\`\`js, \`\`\`css css code, leave blank if none \`\`\`css; Explanation: explanations of the code). Instruction: ${description}`;
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
        setLatestCode(newCode);
        onInitialize(newCode);
        console.log('check code after gpt response', currentVersionIndex, newCode)
        await handleSecondGPTCall(newCode, description);
      }
    } catch (error) {
      console.error("Error processing request:", error);
    } finally {
      setVersions((prevVersions) => {
        const updatedVersions = [...prevVersions];
        updatedVersions[currentVersionIndex].loading = false;
        return updatedVersions;
      });
    }
  };

  const handleSecondGPTCall = async (newCode: { html: string; css: string; js: string }, existingDescription: string) => {
    if (currentVersionIndex === null) return;

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
        setDescription(updatedDescription);
        setSavedDescription(updatedDescription);
        onApply(updatedDescription);
      }
    } catch (error) {
      console.error("Error processing second request:", error);
    }
  };

  const updateDescriptionGPTCall = async () => {
    if (currentVersionIndex === null) return;

    setVersions((prevVersions) => {
      const updatedVersions = [...prevVersions];
      updatedVersions[currentVersionIndex].loading = true;
      return updatedVersions;
    });

    const prompt = `Based on the following old code and its old description and an updated description, provide an updated code. \\
    Old code: HTML: \`\`\`html${latestCode.html}\`\`\` CSS: \`\`\`css${latestCode.css}\`\`\` JS: \`\`\`js${latestCode.js}\`\`\` \\
    Old Description: ${savedDescription}. \\
    New description: ${description}. \\
    Include updated code and the explanation of what changed in the updated description, and why your change in the code can match this description change.\\
    Still use anime.js and svg paths as backbone of the animation code as the old code.\\
    Use customizable svg paths for object movement. You can refer to old code to see example methods and code formats and refine it according to the new description.\\
    Donnot use any external elements like images or svg, create everything with code.\\
    Return response in this format: (Code:  \`\`\`html html code \`\`\`html, \`\`\`js javascript code, leave blank if none \`\`\`js, \`\`\`css css code, leave blank if none \`\`\`css; Explanation: explanation content)`;
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
      console.log('check response from updateDescriptionGPTCall', content)
      if (content) {
        const newCode = parseGPTResponse(content);
        setLatestCode(newCode);
        onInitialize(newCode);
        await GPTCallAfterupdateDescription(newCode, description);
      }
    } catch (error) {
      console.error("Error processing update description request:", error);
    } finally {
      setVersions((prevVersions) => {
        const updatedVersions = [...prevVersions];
        updatedVersions[currentVersionIndex].loading = false;
        return updatedVersions;
      });
    }
  };

  const GPTCallAfterupdateDescription = async (newCode: { html: string; css: string; js: string }, existingDescription: string) => {
    if (currentVersionIndex === null) return;

    const newPrompt = `Slightly refine the given description for the code, to make it fit the code better. Code: HTML: \`\`\`html${newCode.html}\`\`\` CSS: \`\`\`css${newCode.css}\`\`\` JS: \`\`\`js${newCode.js}\`\`\` Description: ${description}.\\
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

      console.log('new desc after updating desc', newDescriptionContent)

      if (newDescriptionContent) {
        const updatedDescription = newDescriptionContent.replace('] {', ']{');
        setDescription(updatedDescription);
        setSavedDescription(updatedDescription);
        onApply(updatedDescription);
      }
    } catch (error) {
      console.error("Error processing second request:", error);
    }
  };

  const parseGPTResponse = (response: string): { html: string; css: string; js: string } => {
    const htmlMatch = response.match(/```html([\s\S]*?)```/);
    const cssMatch = response.match(/```css([\s\S]*?)```/);
    const jsMatch = response.match(/```js([\s\S]*?)```/);

    const html = htmlMatch ? htmlMatch[1].trim() : '';
    const css = cssMatch ? cssMatch[1].trim() : '';
    const js = jsMatch ? jsMatch[1].trim() : '';

    return { html, css, js };
  };

  const toggleDetails = (word: string) => {
    setShowDetails(prev => ({ ...prev, [word]: !prev[word] }));
    setDescription(latestText.replace('] {', ']{'));
  };

  const handleTextChange = (html: string) => {
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

    setLatestText(text.replace('] {', ']{')); // Save the newest text
  };

  const handleTabPress = (value: string) => {
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

    setDescription(text.replace('] {', ']{'));
    onApply(text.replace('] {', ']{'));
    console.log('tab press, save desc', description)
  };

  const handleDoubleClick = (word: string) => {
    onWordSelected(word);
  };

  const handleExtend = async () => {
    if (currentVersionIndex === null) return;

    setVersions((prevVersions) => {
      const updatedVersions = [...prevVersions];
      updatedVersions[currentVersionIndex].loading = true;
      return updatedVersions;
    });

    const baseVersionName = versions[currentVersionIndex].id;
    const newDescriptions: string[] = [];

    try {

      const prompt = `Help me extend a prompt and add more details. The prompt is for creating animations with anime.js. 
      Extend the original prompt, to make it more expressive with more details that suits the prompt description and also give more clear instructions to what the animation code should be (e.g., tell in detail elements (e.g., eyes, windows)of objects(e.g., fish, house), the features (e.g., shape, color) and the changes (e.g., movement, size, color) as well as how they are made in animation code).
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

      Extend this prompt: ${description}`

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
      console.log('check response from handleextend', data, newDescriptionContent)
      if (newDescriptionContent) {
        const newDescriptions = newDescriptionContent.split('///');

        setVersions((prevVersions) => {
          const updatedVersions = [...prevVersions];
          newDescriptions.forEach((desc: string, index: number) => {
            updatedVersions.push({
              id: `${baseVersionName} extended ${index + 1}`,
              description: desc.trim(),
              code: { html: '', css: '', js: '' },
              latestCode: { html: '', css: '', js: '' },
              keywordTree: extractKeywords(desc),
              wordselected: 'ocean',
              highlightEnabled: false,
              loading: false,
              piecesToHighlightLevel1: [],
              piecesToHighlightLevel2: []
            });
          });
          return updatedVersions;
        });
      }
      console.log('check versions in handleextend', versions)
    } catch (error) {
      console.error("Error processing extend request:", error);
    }finally {
      setVersions((prevVersions) => {
        const updatedVersions = [...prevVersions];
        updatedVersions[currentVersionIndex].loading = false;
        return updatedVersions;
      });
    }
  };

  const version = versions[currentVersionIndex || 0];
  const loading = version ? version.loading : false;

  return (
    <div className="description-editor">
      <div className="content-editable-container">
        <ContentEditable
          value={description}
          onChange={handleTextChange}
          onRightClick={toggleDetails}
          showDetails={showDetails}
          onTabPress={handleTabPress}
          hiddenInfo={hiddenInfo}
          setHiddenInfo={setHiddenInfo}
          onDoubleClick={handleDoubleClick}
        />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter description here"
      />
      <div className="button-group">
        <button className="purple-button" onClick={handleExtend}>Extend</button>
        <button className="purple-button" onClick={handleInitialize}>Initialize Description</button>
        <button className="purple-button" onClick={updateDescriptionGPTCall}>Update Description</button>
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
