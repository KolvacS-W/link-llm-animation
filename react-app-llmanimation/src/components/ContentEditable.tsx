import React, { useState, useEffect } from 'react';

interface ContentEditableProps {
  value: string;
  onChange: (value: string) => void;
  onRightClick: (word: string) => void;
  showDetails: { [key: string]: boolean };
}

const ContentEditable: React.FC<ContentEditableProps> = ({ value, onChange, onRightClick, showDetails }) => {
  const [initialValue, setInitialValue] = useState<string>(value);

  useEffect(() => {
    setInitialValue(formatDescription(value));
  }, [value, showDetails]);

  const handleInput = (event: React.FormEvent<HTMLSpanElement>) => {
    const innerHTML = (event.target as HTMLSpanElement).innerHTML;
    onChange(innerHTML);
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

  return (
    <span
      contentEditable
      onInput={handleInput}
      onContextMenu={handleRightClick}
      className="custom-textarea"
      dangerouslySetInnerHTML={{ __html: initialValue }}
    />
  );
};

export default ContentEditable;
