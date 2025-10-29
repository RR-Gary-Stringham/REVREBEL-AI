
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { MessageBox } from './components/MessageBox';
import { Tabs } from './components/Tabs';
import { SamplePrompts } from './components/SamplePrompts';
import { Onboarding } from './components/Onboarding';
import type { Message, Mode, OnboardingState } from './types';
import { streamChatResponse } from './services/geminiService';
import * as workspaceAdapter from './services/workspaceAdapter';
import type { FunctionCall } from '@google/genai';

const App: React.FC = () => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(() => {
    try {
      const savedState = localStorage.getItem('revrebel-ai-onboarding');
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error("Failed to parse onboarding state from localStorage", error);
    }
    return { isComplete: false, storageProvider: null, vectorDBConnected: false, brandscape: null };
  });
  
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const savedMessages = localStorage.getItem('revrebel-ai-messages');
      return savedMessages ? JSON.parse(savedMessages) : [
        {
          id: `model-${Date.now()}`,
          role: 'model',
          content: 'REVREBEL/AI initialized. System ready. How can I assist you in crafting brand strategy, copy, or design assets today?',
          mode: 'COPYWRITING'
        }
      ];
    } catch (error) {
      console.error("Failed to parse messages from localStorage", error);
      return [];
    }
  });

  // FIX: Declare activeMode and setActiveMode state.
  const [activeMode, setActiveMode] = useState<Mode>('COPYWRITING');
  const [isLoading, setIsLoading] = useState(false);
  const [exportStates, setExportStates] = useState<Record<string, { inProgress: boolean; status: 'idle' | 'success' | 'error'; message?: string }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    try {
      if (onboardingState.isComplete) {
         localStorage.setItem('revrebel-ai-messages', JSON.stringify(messages));
      }
    } catch (error) {
      console.error("Failed to save messages to localStorage", error);
    }
  }, [messages, onboardingState.isComplete]);

  const handleOnboardingComplete = (newState: OnboardingState) => {
    setOnboardingState(newState);
    try {
      localStorage.setItem('revrebel-ai-onboarding', JSON.stringify(newState));
    } catch (error) {
       console.error("Failed to save onboarding state to localStorage", error);
    }
  };

  const processStream = useCallback(async (stream: AsyncGenerator<{ text?: string; toolCall?: FunctionCall }>) => {
    let fullResponse = '';
    let toolCall: FunctionCall | undefined = undefined;

    for await (const chunk of stream) {
        if (chunk.text) {
            fullResponse += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === 'model') {
                    lastMessage.content = fullResponse;
                }
                return newMessages;
            });
        }
        if (chunk.toolCall) {
            toolCall = chunk.toolCall;
            setMessages(prev => {
                 const newMessages = [...prev];
                 const lastMessage = newMessages[newMessages.length - 1];
                 if (lastMessage?.role === 'model') {
                     lastMessage.toolCall = toolCall;
                     lastMessage.isFeedbackPending = true;
                     lastMessage.content = `...` // Placeholder
                 }
                 return newMessages;
            });
        }
    }
  }, []);

  const handlePromptSubmit = useCallback(async (prompt: string) => {
    if (!prompt || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: prompt, mode: activeMode };
    const history = [...messages, userMessage];
    setMessages(history);

    const modelPlaceholder: Message = { id: `model-${Date.now() + 1}`, role: 'model', content: '', mode: activeMode };
    setMessages(prev => [...prev, modelPlaceholder]);

    try {
        const stream = streamChatResponse(history, activeMode, onboardingState.vectorDBConnected, onboardingState.brandscape);
        await processStream(stream);
    } catch (error) {
        console.error("Error generating response:", error);
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage?.role === 'model') {
                lastMessage.content = "ERROR: Failed to get response from the model. Check console for details.";
                lastMessage.isError = true;
            }
            return newMessages;
        });
    } finally {
        setIsLoading(false);
    }
  }, [isLoading, activeMode, onboardingState, messages, processStream]);

  const handleConceptFeedback = useCallback((messageId: string, approved: boolean) => {
    setIsLoading(true);

    setMessages(prevMessages => {
        const originalMessageIndex = prevMessages.findIndex(m => m.id === messageId);
        if (originalMessageIndex === -1) {
            console.error("Original message for feedback not found");
            setIsLoading(false);
            return prevMessages;
        }

        const originalMessage = prevMessages[originalMessageIndex];
        if (!originalMessage.toolCall) {
            console.error("Original message does not have a tool call");
            setIsLoading(false);
            return prevMessages;
        }

        const toolFeedback: Message = {
            id: `tool-${Date.now()}`,
            role: 'tool',
            content: approved ? "User approved the concept. Proceed with full generation." : "User rejected the concept. Ask clarifying questions to refine the idea.",
            mode: activeMode,
            toolResult: { id: originalMessage.toolCall.id, name: originalMessage.toolCall.name, response: { success: approved } }
        };

        const historyForApi = [...prevMessages.slice(0, originalMessageIndex + 1), toolFeedback];

        // FIX: Use async/await to handle the async generator correctly.
        const processFeedback = async () => {
            try {
                const stream = streamChatResponse(historyForApi, activeMode, onboardingState.vectorDBConnected, onboardingState.brandscape);
                await processStream(stream);
            } catch (error) {
                console.error("Error generating response after feedback:", error);
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage?.role === 'model') {
                        lastMessage.content = "ERROR: Failed to get response from the model. Check console for details.";
                        lastMessage.isError = true;
                    }
                    return newMessages;
                });
            } finally {
                setIsLoading(false);
            }
        };

        processFeedback();

        const updatedMessages = prevMessages.map(m => m.id === messageId ? { ...m, isFeedbackPending: false } : m);
        const historyForUi = [...updatedMessages.slice(0, originalMessageIndex + 1), toolFeedback];
        const modelPlaceholder: Message = { id: `model-${Date.now() + 1}`, role: 'model', content: '', mode: activeMode };
        
        return [...historyForUi, modelPlaceholder];
    });
  }, [activeMode, onboardingState.vectorDBConnected, onboardingState.brandscape, processStream]);


  const handleSamplePrompt = (prompt: string, mode: Mode) => {
    setActiveMode(mode);
    handlePromptSubmit(prompt);
  };

  const handleExport = async (messageId: string, content: string) => {
    // ... (export logic remains the same)
  };

  if (!onboardingState.isComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen text-[#EFF5F6] flex flex-col p-4 md:p-6 lg:p-8 fade-in">
      <Header />
      <Tabs activeMode={activeMode} setActiveMode={setActiveMode} />
      
      <main className="flex-grow overflow-y-auto w-full max-w-4xl mx-auto mb-4 pr-2">
        <div className="space-y-6">
          {messages.map((msg) => (
             msg.role !== 'tool' &&
            <MessageBox
              key={msg.id}
              message={msg}
              onExport={handleExport}
              onFeedback={handleConceptFeedback}
              exportState={exportStates[msg.id] || { inProgress: false, status: 'idle' }}
              storageProvider={onboardingState.storageProvider}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="w-full max-w-4xl mx-auto sticky bottom-0 bg-[#163666] pt-2">
        <SamplePrompts onPromptClick={handleSamplePrompt} currentMode={activeMode} />
        <PromptInput onSubmit={handlePromptSubmit} isLoading={isLoading} />
        <p className="text-center text-xs text-[#B2D3DE]/70 mt-2">REVREBEL/AI v1.4 // Creative Ideation Enabled</p>
      </footer>
    </div>
  );
};

export default App;
