import React from 'react';
import './InputArea.css';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (text: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ input, setInput, onSend }) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(input);
    }
  };

  return (
    <div className="input-area">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message here..."
        className="input-textarea"
      />
      <button 
        onClick={() => onSend(input)} 
        className="send-button"
        disabled={!input.trim()}
      >
        Send
      </button>
    </div>
  );
};

export default InputArea;