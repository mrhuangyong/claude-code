import React from 'react';

export function App(): React.ReactElement {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white text-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-brand)' }}>
          Claude Code Best
        </h1>
        <p className="mt-2 text-gray-500">Desktop GUI Application</p>
      </div>
    </div>
  );
}
