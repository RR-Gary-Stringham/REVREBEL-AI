
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { MessageBox } from './components/MessageBox';
import { Tabs } from './components/Tabs';
import { SamplePrompts } from './components/SamplePrompts';
import type { Message, Mode } from './types';
import { generateResponse } from './services/geminiService';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<Mode>('COPYWRITING');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'REVREBEL/AI initialized. System ready. How can I assist you in crafting brand strategy, copy, or design assets today?',
      mode: 'COPYWRITING'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePromptSubmit = useCallback(async (prompt: string) => {
    if (!prompt || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: prompt, mode: activeMode };
    setMessages(prev => [...prev, userMessage]);

    // Add a placeholder for the streaming response
    setMessages(prev => [...prev, { role: 'model', content: '', mode: activeMode }]);

    try {
      const stream = generateResponse(prompt, activeMode);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = "ERROR: Failed to get response from the model. Check console for details.";
          newMessages[newMessages.length - 1].isError = true;
          return newMessages;
        });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeMode]);

  const handleSamplePrompt = (prompt: string, mode: Mode) => {
    setActiveMode(mode);
    handlePromptSubmit(prompt);
  };


  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E0E0E0] flex flex-col p-4 md:p-6 lg:p-8">
      <Header />
      <Tabs activeMode={activeMode} setActiveMode={setActiveMode} />
      
      <main className="flex-grow overflow-y-auto w-full max-w-4xl mx-auto mb-4 pr-2">
        <div className="space-y-6">
          {messages.map((msg, index) => (
            <MessageBox key={index} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="w-full max-w-4xl mx-auto sticky bottom-0 bg-[#0D0D0D] pt-2">
        <SamplePrompts onPromptClick={handleSamplePrompt} currentMode={activeMode} />
        <PromptInput onSubmit={handlePromptSubmit} isLoading={isLoading} />
        <p className="text-center text-xs text-gray-500 mt-2">REVREBEL/AI v1.0 // Brand Strategist & Design Synthesizer</p>
      </footer>
    </div>
  );
};

export default App;
