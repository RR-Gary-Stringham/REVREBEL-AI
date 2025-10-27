
import React from 'react';

const TerminalIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-3 text-cyan-400">
        <polyline points="4 17 10 11 4 5"></polyline>
        <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
);


export const Header: React.FC = () => {
  return (
    <header className="w-full max-w-4xl mx-auto mb-6">
      <div className="border-2 border-dashed border-cyan-400/50 p-4 flex items-center">
        <TerminalIcon/>
        <h1 className="text-2xl md:text-3xl font-bold text-cyan-400 text-glow">
          REVREBEL/AI_
        </h1>
      </div>
      <p className="text-gray-400 mt-2 text-sm">// Brand Strategist & Design Synthesizer</p>
    </header>
  );
};
