import React from 'react';
import './ToolPanel.css';

interface Tool {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const tools: Tool[] = [
  {
    id: '1',
    name: 'Code Analysis',
    icon: '🔍',
    description: 'Analyze your code for issues',
  },
  {
    id: '2',
    name: 'Documentation',
    icon: '📚',
    description: 'Generate documentation',
  },
  {
    id: '3',
    name: 'Testing',
    icon: '🧪',
    description: 'Create test cases',
  },
  {
    id: '4',
    name: 'Refactoring',
    icon: '🔄',
    description: 'Improve code quality',
  },
  {
    id: '5',
    name: 'Debugging',
    icon: '🐛',
    description: 'Find and fix bugs',
  },
];

const ToolPanel: React.FC = () => {
  return (
    <div className="tool-panel">
      <h2>Tools</h2>
      <div className="tool-list">
        {tools.map((tool) => (
          <div key={tool.id} className="tool-item">
            <div className="tool-icon">{tool.icon}</div>
            <div className="tool-info">
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolPanel;