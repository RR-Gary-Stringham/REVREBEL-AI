import React, { useState, useRef, useEffect } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const SendIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z"/>
        <path d="M22 2 11 13"/>
    </svg>
);


export const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
      setPrompt('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start space-x-2 p-2 border-2 border-[#FACA78]/50 bg-[#2E2E2E]/50">
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder="Enter your request..."
        className="flex-grow bg-transparent text-[#EFF5F6] placeholder-[#B2D3DE]/60 focus:outline-none resize-none max-h-48 overflow-y-auto"
        rows={1}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        className="w-10 h-10 flex items-center justify-center bg-[#FACA78] text-[#163666] font-bold transition-all duration-200 enabled:hover:bg-[#FAFAFA] enabled:hover:shadow-[0_0_15px_#FACA78] disabled:bg-[#575757] disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-[#163666] border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <SendIcon />
        )}
      </button>
    </form>
  );
};