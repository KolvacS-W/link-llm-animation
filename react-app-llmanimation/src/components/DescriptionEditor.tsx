import React, { useState } from 'react';
import ReactLoading from 'react-loading';

interface DescriptionEditorProps {
  onApply: (description: string) => void;
  onInitialize: (code: { html: string; css: string; js: string }) => void;
}

const API_KEY = "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";

const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ onApply, onInitialize }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInitialize = async () => {
    onApply(description);
    setLoading(true);

    console.log('clicked initialize description')
    // Prepare the prompt based on the description
    const prompt = `Create an animation using anime.js based on the given instruction. Make the result animation on a square page that can fit and center on any pages. You can refer to this code snippet to Use customizable svg paths for object movement. Return response in this format: (Code:  \`\`\`html html code \`\`\`, \`\`\`js javascript code, leave blank if none \`\`\`, \`\`\`css css code, leave blank if none \`\`\`; Explanation: explanations of the code). Instruction: ${description}`;

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
        console.log('content:', content)
        const newCode = parseGPTResponse(content);
        console.log('code:', newCode)
        onInitialize(newCode);
      }
    } catch (error) {
      console.error("Error processing request:", error);
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

  return (
    <div className="description-editor">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter description here"
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
