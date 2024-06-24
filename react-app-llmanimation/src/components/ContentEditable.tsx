import React, { useEffect } from 'react';
import { Version } from '../types';

interface ContentEditableProps {
  value: string;
  onChange: (value: string) => void;
  onRightClick: (word: string) => void;
  onTabPress: (value: string) => void; // New prop for handling 'Tab' key press
  onDoubleClick: (word: string) => void; // Add this prop
  currentVersionId: string | null;
  versions: Version[];
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
}

// How description content editables work: 
// whenever description updates: description (with [] and {})from specific version as prop; -> formatted to html (with all details saved) -> displayed
// whenever user edit the content, html content will be sanitized to text, restore all the hidden details, and saved in latestText (latestText will be initiated by description)
// when user rightclick a word, showDetails is updated to control show/hide detail. also the latest text will be used to update description (so right click is also saving)
// whenever user tab to save the content, html content will be sanitized to text, restore all the hidden details, be used to update description for specific version


// since all the user interactions here must happen when user is on correct page, we can just use currentversionId to access all version specific states
const ContentEditable: React.FC<ContentEditableProps> = ({ value, onChange, onRightClick, onTabPress, onDoubleClick, currentVersionId,  versions, setVersions}) => {
  
  //after value (description) change, update initialValue (initialvalue is to get full hidden info)
  useEffect(() => {
    // console.log('contenteditable-useeffect1', value)
    const formattedvalue = formatDescription(value);
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, initialValue: formattedvalue }
          : version
      );
      return updatedVersions;
    });  
    // console.log('contenteditable-useeffect2', formattedvalue)
    // console.log('contenteditable-useeffect3', versions)
  }, [value, versions.find(version => version.id === currentVersionId)?.showDetails]);

  //user edit desc
  const handleInput = (event: React.FormEvent<HTMLSpanElement>) => {
    const innerHTML = (event.target as HTMLSpanElement).innerHTML;
    const sanitizedText = sanitizeText(innerHTML);
    // console.log('handleinput1', sanitizedText)
    // console.log('handleinput2', versions.find(version => version.id === currentVersionId)?.hiddenInfo)

    const restoredText = restoreDetails(sanitizedText);
    // console.log('handleinput3', restoredText)
    onChange(restoredText);// typed sth, update latesttext in specific version, can just use currentversionId

  };

  //user press tab to save edit
  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault(); // Prevent the default tab behavior
      const innerHTML = (event.target as HTMLSpanElement).innerHTML;
      const sanitizedText = sanitizeText(innerHTML);
      const restoredText = restoreDetails(sanitizedText);
      onTabPress(restoredText); // tab pressed, update description for specific version, can just use currentversionId
    }
  };

  //user right click to show details
  const handleRightClick = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.preventDefault();
    const target = event.target as HTMLSpanElement;
    const word = target.getAttribute("data-word");
    if (word) {
      onRightClick(word); // right clicked, update detail config for each word (showdetails) for specific version, can just use currentversionId
    }
  };

  //user select a word
  const handleDoubleClick = (event: React.MouseEvent) => {
    // console.log('double clicked')
    const selection = window.getSelection();
    if (selection) {
      const word = selection.toString().trim();
      if (word) {
        onDoubleClick(word); // Notify the double-clicked word
      }
    }
  };

  // format description from text to html with correct show/hidden details
  //while we do so, we save all the details first, since description will always have full details but formatted html text won't
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
        const isShown = versions.find(version => version.id === currentVersionId)?.showDetails[word];
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
    //we can just use currentversionId
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, hiddenInfo: details}
          : version
      );
      return updatedVersions;
    });  
    console.log('hidden info updated', versions.find(version => version.id === currentVersionId)?.hiddenInfo)
    return formatted;
  };

  const sanitizeText = (html: string): string => {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    const plainText = tempElement.innerText;
    return plainText;
  };

  // since the html texts (formatteddescription) don't contain details once they are hidden, everytime we need to update the description, 
  // we need to add back the hidden details
  const restoreDetails = (text: string): string => {
    const parts = text.split(/(\[.*?\])/g);
    console.log('parts', parts)
    let hiddenInfoIndex = 0;
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const nextPart = parts[index + 1] || '';
        const hasDetail = /\{.*?\}/.test(nextPart);
        const hiddenInfo = versions.find(version => version.id === currentVersionId)?.hiddenInfo || []
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
      dangerouslySetInnerHTML={{ __html: versions.find(version => version.id === currentVersionId)?.initialValue || '' }}
      style={{ outline: 'none' }} // Remove the blue border outline
    />
  );
};

export default ContentEditable;
