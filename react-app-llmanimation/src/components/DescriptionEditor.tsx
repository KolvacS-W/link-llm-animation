import React, { useState } from 'react';

interface DescriptionEditorProps {
  onApply: (description: string) => void;
}

const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ onApply }) => {
  const [description, setDescription] = useState('');

  const handleApply = () => {
    onApply(description);
  };

  return (
    <div className="description-editor">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter description here"
      />
      <div className="button-group">
        <button className="purple-button" onClick={handleApply}>Initialize Description</button>
        <button className="purple-button" onClick={handleApply}>Update Description</button>
        <button className="blue-button" onClick={handleApply}>Adjust Description</button>
      </div>
    </div>
  );
};

export default DescriptionEditor;
