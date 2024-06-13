import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

interface ContentEditableProps {
  value: string;
  onChange: (value: string) => void;
  onRightClick: (word: string) => void;
  showDetails: { [key: string]: boolean };
}

const ContentEditable: React.FC<ContentEditableProps> = ({ value, onChange, onRightClick, showDetails }) => {
  const [initialValue, setInitialValue] = useState<string>('');
  const editableRef = useRef<HTMLSpanElement>(null);
  const savedSelectionRef = useRef<{ startContainer: Node, startOffset: number, endContainer: Node, endOffset: number } | null>(null);

  useEffect(() => {
    setInitialValue(cleanHTML(formatDescription(value)));
  }, [value, showDetails]);

  useLayoutEffect(() => {
    console.log('check selection', window.getSelection());
    restoreSelection();
  });

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      savedSelectionRef.current = {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset
      };
      console.log('saved selection', savedSelectionRef.current);
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    const savedSelection = savedSelectionRef.current;
    console.log('in restored selection', savedSelection);

    if (savedSelection && sel) {
      const range = document.createRange();
      range.setStart(savedSelection.startContainer, savedSelection.startOffset);
      range.setEnd(savedSelection.endContainer, savedSelection.endOffset);
      sel.removeAllRanges();
      sel.addRange(range);
      console.log('restored selection', window.getSelection());
    }
  };

  const handleInput = (event: React.FormEvent<HTMLSpanElement>) => {
    saveSelection();
    const innerHTML = (event.target as HTMLSpanElement).innerHTML;
    const cleanedHTML = cleanHTML(innerHTML);
    onChange(cleanedHTML);
    setInitialValue(cleanedHTML);
  };

  const handleRightClick = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.preventDefault();
    const target = event.target as HTMLSpanElement;
    const word = target.getAttribute("data-word");
    if (word) {
      onRightClick(word);
    }
  };

  const cleanHTML = (html: string): string => {
    return html.replace(/&nbsp;/g, ' ').replace(/<div>/g, '<br>').replace(/<\/div>/g, '');
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
      ref={editableRef}
      contentEditable
      onInput={handleInput}
      onContextMenu={handleRightClick}
      className="custom-textarea"
      dangerouslySetInnerHTML={{ __html: initialValue }}
    />
  );
};

export default ContentEditable;
