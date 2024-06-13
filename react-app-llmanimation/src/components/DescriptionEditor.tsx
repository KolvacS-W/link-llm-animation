import React, { useState, useEffect } from 'react';
import ReactLoading from 'react-loading';
import ContentEditable from './ContentEditable';

interface DescriptionEditorProps {
  onApply: (description: string) => void;
  onInitialize: (code: { html: string; css: string; js: string }) => void;
}

const API_KEY = "YOUR_API_KEY_HERE";

const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ onApply, onInitialize }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [latestText, setLatestText] = useState(description); // Initialize with description

  useEffect(() => {
    setLatestText(description); // Update latestText when description changes
  }, [description]);
  
  const handleInitialize = async () => {
    onApply(description);
    setLoading(true);

    const prompt = `Create an animation using anime.js based on the given instruction. Make the result animation on a square page that can fit and center on any pages. You can refer to this code snippet to Use customizable svg paths for object movement. Return response in this format: (Code:  \`\`\`html html code \`\`\`html, \`\`\`js javascript code, leave blank if none \`\`\`js, \`\`\`css css code, leave blank if none \`\`\`css; Explanation: explanations of the code). Instruction: ${description}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "system", content: "You are a creative programmer." }, { role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      console.log('sent initial description');

      if (content) {
        const newCode = parseGPTResponse(content);
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
    const newPrompt = `Based on the following code and description, provide an updated description. Code: HTML: \`\`\`html${newCode.html}\`\`\` CSS: \`\`\`css${newCode.css}\`\`\` JS: \`\`\`js${newCode.js}\`\`\` Description: ${existingDescription}. The new description should be same old description + added details to specific parts of the old description (for example, add number of planets and each planet's dom element type, class, style features and name to entity 'planet') according to the code, and all the added details should be within {}, and put the corresponding entity the details are describing in []. Put each added detail behind the specific words that directly related to the detail. Include nothing but the new description in the response.`;

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
        setDescription(newDescriptionContent);
        onApply(newDescriptionContent);
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
    console.log('toggleDetails', latestText)
    setDescription(latestText); // Set description to the latest text when right-click is called
  };

  const handleTextChange = (html: string) => {
    // console.log('html', html);
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
    const text = Array.from(doc.body.childNodes)
      .map(extractText)
      .join('')
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .replace('\n', ' ')
      .replace('] {', ']{') // Replace '] {' with ']{'
      .trim(); // Trim any leading or trailing whitespace

    console.log('handleTextChange', text);
    setLatestText(text); // Save the newest text
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
    const text = Array.from(doc.body.childNodes)
      .map(extractText)
      .join('')
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .replace('\n', ' ')
      .replace('] {', ']{') // Replace '] {' with ']{'
      .trim(); // Trim any leading or trailing whitespace
    console.log('handleTabPress', text)
    setDescription(text);
  };

  return (
    <div className="description-editor">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter description here"
      />
      <ContentEditable
        value={description}
        onChange={handleTextChange}
        onRightClick={toggleDetails}
        showDetails={showDetails}
        onTabPress={handleTabPress} // Pass the new handler for Tab key
      />
      <div className="button-group">
        <button className="purple-button" onClick={handleInitialize}>Initialize Description</button>
        <button className="purple-button" onClick={() => onApply(description)}>Update Description</button>
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
