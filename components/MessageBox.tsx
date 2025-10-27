
import React, { useState } from 'react';
import type { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBoxProps {
  message: Message;
}

const UserIcon: React.FC = () => (
    <div className="w-8 h-8 flex-shrink-0 border-2 border-gray-600 bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-sm">
      &gt;_
    </div>
);

const ModelIcon: React.FC = () => (
    <div className="w-8 h-8 flex-shrink-0 border-2 border-[#00ff9c] bg-[#00ff9c]/10 flex items-center justify-center text-[#00ff9c] font-bold text-sm">
      AI
    </div>
);

const stripMarkdown = (markdown: string): string => {
  // A simple regex-based markdown stripper
  let output = markdown;
  // Remove headings
  output = output.replace(/^#{1,6}\s+/gm, '');
  // Remove bold, italics, and strikethrough (and keep content)
  output = output.replace(/(\*\*|__)(.*?)\1/g, '$2');
  output = output.replace(/(\*|_)(.*?)\1/g, '$2');
  output = output.replace(/~~(.*?)~~/g, '$1');
  // Remove inline code
  output = output.replace(/`([^`]+)`/g, '$1');
  // Remove images
  output = output.replace(/!\[.*?\]\(.*?\)/g, '');
  // Remove links (keep text)
  output = output.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  // Remove blockquotes
  output = output.replace(/^\s*>\s?/gm, '');
  // Remove horizontal rules
  output = output.replace(/^\s*[-*_]{3,}\s*$/gm, '');
  // Remove list markers
  output = output.replace(/^\s*[\d\.\-+*]\s+/gm, '');
  // Clean up extra newlines
  output = output.replace(/\n{2,}/g, '\n\n');
  return output.trim();
};


export const MessageBox: React.FC<MessageBoxProps> = ({ message }) => {
  const { role, content, isError } = message;
  const isUser = role === 'user';

  const [copyText, setCopyText] = useState('Copy');
  
  const downloadFile = (filename: string, text: string, mimeType: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  const handleDownloadTxt = () => {
    const plainText = stripMarkdown(content);
    downloadFile('revrebel-ai-output.txt', plainText, 'text/plain;charset=utf-8');
  };

  const handleDownloadMd = () => {
    downloadFile('revrebel-ai-output.md', content, 'text/markdown;charset=utf-8');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopyText('Copied!');
      setTimeout(() => {
        setCopyText('Copy');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setCopyText('Error!');
       setTimeout(() => {
        setCopyText('Copy');
      }, 2000);
    });
  };


  const baseClasses = 'flex items-start space-x-4 w-full';
  
  const contentClasses = isError 
    ? "prose prose-invert max-w-none text-red-500" 
    : "prose prose-invert max-w-none text-gray-300";

  return (
    <div className={baseClasses}>
      <div className="flex-shrink-0 pt-1">
        {isUser ? <UserIcon /> : <ModelIcon />}
      </div>
      <div className="flex-grow">
        <div className={contentClasses}>
           {isUser ? <p>{content}</p> : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-8 mb-4 text-cyan-400" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-6 mb-3 text-cyan-400" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-cyan-400" {...props} />,
                strong: ({node, ...props}) => <strong className="text-white" {...props} />,
                em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                code: ({node, inline, ...props}) => inline ?
                  <code className="bg-gray-800 text-pink-400 px-1 py-0.5 rounded-sm text-sm" {...props} /> :
                  <pre className="bg-gray-800/50 p-2 rounded-md"><code {...props} /></pre>,
                a: ({node, ...props}) => <a className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
              }}
            >
              {content}
            </ReactMarkdown>
           )}
          {!isUser && content === '' && <span className="blinking-cursor text-[#00ff9c]">▋</span>}
        </div>

        {!isUser && content && !isError && (
            <div className="mt-4 flex items-center gap-2">
                <button 
                    onClick={handleCopy} 
                    className="px-2 py-1 text-xs bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors"
                >
                    {copyText}
                </button>
                <button 
                    onClick={handleDownloadTxt}
                    className="px-2 py-1 text-xs bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors"
                >
                    Download .txt
                </button>
                <button 
                    onClick={handleDownloadMd}
                    className="px-2 py-1 text-xs bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors"
                >
                    Download .md
                </button>
            </div>
        )}
      </div>
    </div>
  );
};