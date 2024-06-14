import React, { useState, useEffect } from 'react';
import ReactLoading from 'react-loading';
import ContentEditable from './ContentEditable';

interface DescriptionEditorProps {
  onApply: (description: string) => void;
  onInitialize: (code: { html: string; css: string; js: string }) => void;
}

const API_KEY = '';

const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ onApply, onInitialize }) => {
  const [description, setDescription] = useState('');
  const [savedDescription, setSavedDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [latestText, setLatestText] = useState(description); // Initialize with description
  const [hiddenInfo, setHiddenInfo] = useState<string[]>([]); // State to store details in {}
  const [latestCode, setLatestCode] = useState({ html: '', css: '', js: '' }); // Initialize with description

  useEffect(() => {
    setLatestText(description); // Update latestText when description changes
  }, [description]);

  const handleInitialize = async () => {
    onApply(description);
    setLoading(true);

    const prompt = `Create an animation using anime.js based on the given instruction. Make the result animation on a square page that can fit and center on any pages. Use customizable svg paths for object movement. You can refer to this code snippet to see example methods and code formats but need to create different code:\\
    Code snippet:\\
    <!DOCTYPE html>\\<html lang="en">\\  <head>\\    <style>\\      html, body {\\        margin: 0;\\        padding: 0;\\        width: 100%;\\        height: 100%;\\        display: flex;\\        justify-content: center;\\        align-items: center;\\        overflow: hidden;\\      }\\      svg {\\        width: 100vmin;\\        height: 100vmin;\\      }\\    </style>\\  </head>\\  <body>\\    <svg viewBox="0 0 200 200">\\      <path id="path1" d="M10,10 Q90,90 180,10" fill="transparent" stroke="black"/>\\      <path id="path2" d="M10,190 Q90,110 180,190" fill="transparent" stroke="black"/>\\      <circle id="ball1" cx="0" cy="0" r="5" fill="red"/>\\      <circle id="ball2" cx="0" cy="0" r="5" fill="blue"/>\\    </svg>\\    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>\\    <script>\\      anime({\\        targets: \'#ball1\',\\        translateX: anime.path(\'#path1\')(\'x\'),\\        translateY: anime.path(\'#path1\')(\'y\'),\\        easing: \'easeInOutQuad\',\\        duration: 2000,\\        loop: true,\\        direction: \'alternate\'\\      });\\      anime({\\        targets: \'#ball2\',\\        translateX: anime.path(\'#path2\')(\'x\'),\\        translateY: anime.path(\'#path2\')(\'y\'),\\        easing: \'easeInOutQuad\',\\        duration: 2000,\\        loop: true,\\        direction: \'alternate\'\\      });\\    </script>\\  </body>\\</html>\\ 
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
      console.log('sent initial description');

      if (content) {
        console.log('content', content);
        const newCode = parseGPTResponse(content);
        console.log('new code', newCode);
        setLatestCode(newCode);
        console.log('current code saved')
        onInitialize(newCode);
        await handleSecondGPTCall(newCode, description);
      }
    } catch (error) {
      console.error("Error processing request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSecondGPTCall = async (newCode: { html: string; css: string; js: string }, existingDescription: string) => {
    const newPrompt = `Based on the following code and description, provide an updated description. Code: HTML: \`\`\`html${newCode.html}\`\`\` CSS: \`\`\`css${newCode.css}\`\`\` JS: \`\`\`js${newCode.js}\`\`\` Description: ${existingDescription}. create the updated description by 1): finding important entities in the old description (for example, 'planet', 'shape', 'color', 'move' are all entity) and wrap up them with [] 2): add details for this entity according to the code (for example, add number of planets and each planet's dom element type, class, style features and name to entity 'planet') right after the entity.\\
    New description format:\\
    xxxxx[entity1]{description1}xxxx[entity2]{description2}... \\ Other than the added details. Important: other than the annotation ([], {}) and added details, the updated description should be exactly same as old description. Include nothing but the new description in the response.`;
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
      console.log('sent description update');
      const data = await response.json();
      const newDescriptionContent = data.choices[0]?.message?.content;
      console.log('second call data', newDescriptionContent);
      if (newDescriptionContent) {
        const updatedDescription = newDescriptionContent.replace('] {', ']{');
        setDescription(updatedDescription);
        setSavedDescription(updatedDescription); // Save the description
        onApply(updatedDescription);
      }
    } catch (error) {
      console.error("Error processing second request:", error);
    }
  };

  const updateDescriptionGPTCall = async () => {
    setLoading(true);
    const prompt = `Based on the following old code and its old description and an updated description, provide an updated code. \\
    Old code: HTML: \`\`\`html${latestCode.html}\`\`\` CSS: \`\`\`css${latestCode.css}\`\`\` JS: \`\`\`js${latestCode.js}\`\`\` \\
    Old Description: ${savedDescription}. \\
    New description: ${description}. \\
    Include updated code and the explanation of what changed in the updated description, and why your change in the code can match this description change.\\
    Return response in this format: (Code:  \`\`\`html html code \`\`\`html, \`\`\`js javascript code, leave blank if none \`\`\`js, \`\`\`css css code, leave blank if none \`\`\`css; Explanation: explanation content)`;
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "system", content: "You are a creative programmer." }, { role: "user", content: prompt }],
        }),
      });
      console.log('sent update description call');
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      console.log('update description call data', content);
      if (content) {
        const newCode = parseGPTResponse(content);
        setLatestCode(newCode);
        console.log('current code saved')
        onInitialize(newCode);
      }
    } catch (error) {
      console.error("Error processing update description request:", error);
    } finally {
      setLoading(false);
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
    console.log('toggleDetails', latestText);
    setDescription(latestText.replace('] {', ']{')); // Set description to the latest text when right-click is called
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

    console.log('handleTextChange', text);
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

    console.log('handleTabPress', text);
    setDescription(text.replace('] {', ']{'));
  };

  return (
    <div className="description-editor">
      <ContentEditable
        value={description}
        onChange={handleTextChange}
        onRightClick={toggleDetails}
        showDetails={showDetails}
        onTabPress={handleTabPress} // Pass the new handler for Tab key
        hiddenInfo={hiddenInfo} // Pass hiddenInfo to ContentEditable
        setHiddenInfo={setHiddenInfo} // Pass setHiddenInfo function to ContentEditable
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter description here"
      />
      <div className="button-group">
        <button className="purple-button" onClick={handleInitialize}>Initialize Description</button>
        <button className="purple-button" onClick={updateDescriptionGPTCall}>Update Description</button>
        <button className="blue-button" onClick={() => onApply(description)}>Adjust Description</button>
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
