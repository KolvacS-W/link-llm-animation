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
      <button onClick={handleApply}>Apply Description</button>
    </div>
  );
};

export default DescriptionEditor;
