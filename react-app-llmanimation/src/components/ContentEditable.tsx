import React, { useState, useEffect } from 'react';

interface ContentEditableProps {
  value: string;
  onChange: (value: string) => void;
  onRightClick: (word: string) => void;
  showDetails: { [key: string]: boolean };
  onTabPress: (value: string) => void; // New prop for handling 'Tab' key press
}

const ContentEditable: React.FC<ContentEditableProps> = ({ value, onChange, onRightClick, showDetails, onTabPress }) => {
  const [initialValue, setInitialValue] = useState<string>(value);

  useEffect(() => {
    setInitialValue(formatDescription(value));
  }, [value, showDetails]);

  const handleInput = (event: React.FormEvent<HTMLSpanElement>) => {
    const innerHTML = (event.target as HTMLSpanElement).innerHTML;
    const sanitizedText = sanitizeText(innerHTML);
    onChange(sanitizedText);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault(); // Prevent the default tab behavior
      const innerHTML = (event.target as HTMLSpanElement).innerHTML;
      const sanitizedText = sanitizeText(innerHTML);
      onTabPress(sanitizedText); // Call the onTabPress function with the sanitized text
    }
  };

  const handleRightClick = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.preventDefault();
    const target = event.target as HTMLSpanElement;
    const word = target.getAttribute("data-word");
    if (word) {
      onRightClick(word);
    }
  };

  const formatDescription = (desc: string): string => {
    const parts = desc.split(/(\[.*?\]\{.*?\})/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(.*?)\]\{(.*?)\}/);
      if (match) {
        const word = match[1];
        const details = match[2];
        const isShown = showDetails[word];
        return `
          <span>
            <span style="color: red; cursor: pointer;" data-word="${word}">
              [${word}]
            </span>
            ${isShown ? `<span style="color: orange;">{${details}}</span>` : ''}
          </span>
        `;
      }
      return part;
    }).join('');
  };

  const sanitizeText = (html: string): string => {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    const plainText = tempElement.innerText;
    return plainText;
  };

  return (
    <span
      contentEditable
      onInput={handleInput}
      onKeyDown={handleKeyDown} // Add keydown event listener
      onContextMenu={handleRightClick}
      className="custom-textarea"
      dangerouslySetInnerHTML={{ __html: initialValue }}
    />
  );
};

export default ContentEditable;
