import React from 'react'
import ReactDOM from 'react-dom/client'

const App = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#1890ff' }}>Claude Code Best</h1>
      <p style={{ color: '#666', marginTop: '16px' }}>Vite development server is running</p>
      <div style={{
        marginTop: '32px',
        padding: '24px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p>This is a placeholder for the Claude Code Best application.</p>
        <p>For the full CLI experience, please run: <code>bun run dev</code></p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
