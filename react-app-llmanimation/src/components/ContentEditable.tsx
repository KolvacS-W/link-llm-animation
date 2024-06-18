import React, { useState, useEffect } from 'react';

interface ContentEditableProps {
  value: string;
  onChange: (value: string) => void;
  onRightClick: (word: string) => void;
  showDetails: { [key: string]: boolean };
  onTabPress: (value: string) => void; // New prop for handling 'Tab' key press
  hiddenInfo: string[]; // Prop to receive hiddenInfo
  setHiddenInfo: (info: string[]) => void; // New prop to set hiddenInfo
  onDoubleClick: (word: string) => void; // Add this prop
}

const ContentEditable: React.FC<ContentEditableProps> = ({ value, onChange, onRightClick, showDetails, onTabPress, hiddenInfo, setHiddenInfo, onDoubleClick }) => {
  const [initialValue, setInitialValue] = useState<string>(value);

  useEffect(() => {
    console.log('contenteditable-useeffect')
    setInitialValue(formatDescription(value));
  }, [value, showDetails]);

  const handleInput = (event: React.FormEvent<HTMLSpanElement>) => {
    const innerHTML = (event.target as HTMLSpanElement).innerHTML;
    const sanitizedText = sanitizeText(innerHTML);
    console.log('handleinput1', sanitizedText)
    console.log('handleinput2', hiddenInfo)

    const restoredText = restoreDetails(sanitizedText);
    console.log('handleinput3', restoredText)
    onChange(restoredText);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault(); // Prevent the default tab behavior
      const innerHTML = (event.target as HTMLSpanElement).innerHTML;
      const sanitizedText = sanitizeText(innerHTML);
      const restoredText = restoreDetails(sanitizedText);
      onTabPress(restoredText); // Call the onTabPress function with the sanitized text
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

  const handleDoubleClick = (event: React.MouseEvent) => {
    // console.log('double clicked')
    const selection = window.getSelection();
    if (selection) {
      const word = selection.toString().trim();
      if (word) {
        // console.log('word doubleclicked:', word)
        onDoubleClick(word); // Notify the double-clicked word
      }
    }
  };

  const formatDescription = (desc: string): string => {
    console.log('format description called')
    const parts = desc.split(/(\[.*?\]\{.*?\})/g);
    const details: string[] = [];
    const formatted = parts.map((part, index) => {
      const match = part.match(/\[(.*?)\]\{(.*?)\}/);
      if (match) {
        const word = match[1];
        const detail = match[2];
        details.push(detail); // Save the details in the order they appear
        const isShown = showDetails[word];
        return `
          <span>
            <span style="color: red; cursor: pointer;" data-word="${word}">
              [${word}]
            </span>
            ${isShown ? `<span style="color: MediumVioletRed;">{${detail}}</span>` : ''}
          </span>
        `;
      }
      return part;
    }).join('');
    setHiddenInfo(details); // Update hiddenInfo with the extracted details
    console.log('hidden info updated', hiddenInfo)
    return formatted;
  };

  const sanitizeText = (html: string): string => {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    const plainText = tempElement.innerText;
    return plainText;
  };

  const restoreDetails = (text: string): string => {
    const parts = text.split(/(\[.*?\])/g);
    console.log('parts', parts)
    let hiddenInfoIndex = 0;
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const nextPart = parts[index + 1] || '';
        const hasDetail = /\{.*?\}/.test(nextPart);
        console.log('restore detail', part, hasDetail, hiddenInfoIndex, hiddenInfo[hiddenInfoIndex])
        if (!hasDetail && hiddenInfoIndex < hiddenInfo.length) {
          return `${part}{${hiddenInfo[hiddenInfoIndex++]}}`;
        }
        hiddenInfoIndex++;
      }
      return part;
    }).join('');
  };

  return (
    <span
      contentEditable
      onInput={handleInput}
      onKeyDown={handleKeyDown} // Add keydown event listener
      onContextMenu={handleRightClick}
      onDoubleClick={handleDoubleClick}
      className="custom-textarea"
      dangerouslySetInnerHTML={{ __html: initialValue }}
      style={{ outline: 'none' }} // Remove the blue border outline
    />
  );
};

export default ContentEditable;
