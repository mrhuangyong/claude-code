import React, { useState } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import ToolPanel from './ToolPanel';
import './App.css';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `You said: ${text}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);

      // Show system notification for AI response
      if (window.electronAPI) {
        window.electronAPI.showNotification(
          'Claude Code Assistant',
          'You have a new message from Claude'
        );
      }
    }, 1000);
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>Claude Code Assistant</h1>
      </div>
      <div className="app-body">
        <div className="main-content">
          <MessageList messages={messages} />
          <InputArea 
            input={input} 
            setInput={setInput} 
            onSend={handleSendMessage} 
          />
        </div>
        <ToolPanel />
      </div>
    </div>
  );
};

export default App;