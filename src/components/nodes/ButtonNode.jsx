import React, { useState } from 'react';
import { Handle } from 'reactflow';

const ButtonNode = ({ data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [buttonText, setButtonText] = useState(data.text || 'Cliquez-moi');

  const handleSubmit = () => {
    data.text = buttonText;
    setIsEditing(false);
  };

  return (
    <div className="button-node" style={{
      padding: '10px',
      borderRadius: '5px',
      background: 'white',
      border: '1px solid #ddd',
      width: '200px'
    }}>
      <Handle type="target" position="left" />
      
      {isEditing ? (
        <div>
          <input
            type="text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="Texte du bouton"
          />
          <button onClick={handleSubmit}>Valider</button>
        </div>
      ) : (
        <div>
          <button 
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: '#f0f0f0',
              cursor: 'pointer',
              width: '100%'
            }}
            onClick={() => setIsEditing(true)}
          >
            {buttonText}
          </button>
        </div>
      )}

      <Handle type="source" position="right" />
    </div>
  );
};

export default ButtonNode;
