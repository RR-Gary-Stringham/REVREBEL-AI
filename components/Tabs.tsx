
import React from 'react';
import type { Mode } from '../types';

interface TabsProps {
  activeMode: Mode;
  setActiveMode: (mode: Mode) => void;
}

const modes: { id: Mode; label: string }[] = [
  { id: 'COPYWRITING', label: 'Copywriting' },
  { id: 'VISUAL_QA', label: 'Visual QA' },
  { id: 'STRATEGY', label: 'Strategy' },
];

export const Tabs: React.FC<TabsProps> = ({ activeMode, setActiveMode }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <div className="flex space-x-2 border-b-2 border-gray-700">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none -mb-0.5
              ${
                activeMode === mode.id
                  ? 'border-b-2 border-[#00ff9c] text-[#00ff9c] text-glow'
                  : 'border-b-2 border-transparent text-gray-400 hover:text-white'
              }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
};
