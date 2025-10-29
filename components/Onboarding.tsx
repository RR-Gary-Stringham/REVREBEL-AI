
import React, { useState } from 'react';
import type { OnboardingState, StorageProvider, Brandscape } from '../types';
import { OnboardingProgress } from './OnboardingProgress';

interface OnboardingProps {
    onComplete: (state: OnboardingState) => void;
}

const TerminalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="4 17 10 11 4 5"></polyline>
        <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
);

const OnboardingInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className="w-full bg-[#2E2E2E]/50 border-2 border-[#575757] p-2 text-[#EFF5F6] placeholder-[#B2D3DE]/60 focus:outline-none focus:border-[#FACA78] transition-colors"
    />
);

const OnboardingTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
     <textarea
        {...props}
        className="w-full bg-[#2E2E2E]/50 border-2 border-[#575757] p-2 text-[#EFF5F6] placeholder-[#B2D3DE]/60 focus:outline-none focus:border-[#FACA78] transition-colors resize-y min-h-[80px]"
    />
);


export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [vectorDBConnected, setVectorDBConnected] = useState(false);
    const [storageProvider, setStorageProvider] = useState<StorageProvider | null>(null);
    const [brandscape, setBrandscape] = useState<Brandscape>({
        fiveWords: '',
        inspirations: '',
        voiceDescription: ''
    });

    const handleConnectVectorDB = () => {
        // Simulate API call and connection
        setVectorDBConnected(true);
        setTimeout(() => setStep(3), 1000);
    };
    
    const handleFinish = () => {
        if (!storageProvider) return;
        onComplete({
            isComplete: true,
            storageProvider,
            vectorDBConnected,
            brandscape: brandscape.fiveWords.trim() ? brandscape : null,
        });
    };

    const isBrandscapeValid = brandscape.fiveWords.trim() !== '' && brandscape.inspirations.trim() !== '' && brandscape.voiceDescription.trim() !== '';
    
    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <div className="text-left">
                        <h2 className="font-headline text-3xl text-[#71C9C5] text-glow mb-4">Welcome to REVREBEL/AI</h2>
                        <p className="text-[#B2D3DE] mb-8">Let's configure your AI Brand Ambassador. This one-time setup will connect your brand intelligence and workflow tools.</p>
                        <button onClick={() => setStep(2)} className="bg-[#FACA78] text-[#163666] font-bold py-2 px-6 font-headline tracking-wider hover:bg-[#FAFAFA] transition-all duration-200">
                            Begin Setup
                        </button>
                    </div>
                );
            case 2:
                return (
                     <div className="text-left w-full max-w-lg">
                        <h2 className="font-headline text-2xl text-[#71C9C5] text-glow mb-2">Connect Brand Intelligence</h2>
                        <p className="text-[#B2D3DE] mb-6">Connect your internal knowledge base (e.g., a vector database) to provide the AI with deep, contextual understanding of your brand, case studies, and voice.</p>
                        <button onClick={handleConnectVectorDB} disabled={vectorDBConnected} className="w-full flex items-center justify-center bg-[#047C97] text-white font-bold py-3 px-6 font-headline tracking-wider hover:bg-[#00A6B6] transition-all duration-200 disabled:bg-[#575757] disabled:cursor-not-allowed">
                            {vectorDBConnected ? 'Connected Successfully' : 'Connect to Vector Database (Simulated)'}
                        </button>
                         <p className="text-xs text-center mt-2 text-[#B2D3DE]/70">// This enables Retrieval-Augmented Generation (RAG).</p>
                    </div>
                );
            case 3:
                return (
                    <div className="text-left w-full max-w-lg">
                        <h2 className="font-headline text-2xl text-[#71C9C5] text-glow mb-2">Define Your Brand Persona</h2>
                        <p className="text-[#B2D3DE] mb-6">Define the personality of your brand. This context will shape the AI's tone, style, and voice. The more specific, the better.</p>
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="font-bold text-sm text-[#B2D3DE] block mb-1">Five defining words</label>
                                <OnboardingInput placeholder="e.g., Strategic, Irreverent, Savvy" value={brandscape.fiveWords} onChange={e => setBrandscape({...brandscape, fiveWords: e.target.value})} />
                            </div>
                             <div>
                                <label className="font-bold text-sm text-[#B2D3DE] block mb-1">Inspirations (Movies, Brands, Music)</label>
                                <OnboardingInput placeholder="e.g., Ocean's Eleven, ThinkGeek, Daft Punk" value={brandscape.inspirations} onChange={e => setBrandscape({...brandscape, inspirations: e.target.value})} />
                            </div>
                             <div>
                                <label className="font-bold text-sm text-[#B2D3DE] block mb-1">Briefly describe your brand voice</label>
                                <OnboardingTextarea placeholder="e.g., Confident and clever with a dry, intellectual humor..." value={brandscape.voiceDescription} onChange={e => setBrandscape({...brandscape, voiceDescription: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <button onClick={() => setStep(4)} className="text-sm text-[#B2D3DE] hover:text-white">Skip for now</button>
                            <button onClick={() => setStep(4)} disabled={!isBrandscapeValid} className="bg-[#047C97] text-white font-bold py-2 px-6 font-headline tracking-wider hover:bg-[#00A6B6] transition-all duration-200 disabled:bg-[#575757] disabled:cursor-not-allowed">
                                Next
                            </button>
                        </div>
                    </div>
                );
            case 4:
                 return (
                     <div className="text-left w-full max-w-lg">
                        <h2 className="font-headline text-2xl text-[#71C9C5] text-glow mb-2">Configure Workflows</h2>
                        <p className="text-[#B2D3DE] mb-6">Where would you like to save content generated by the AI? Select your preferred platform.</p>
                        <div className="space-y-3 mb-8">
                            {(['google', 'notion', 'sharepoint'] as StorageProvider[]).map(provider => (
                                <button key={provider} onClick={() => setStorageProvider(provider)} className={`w-full text-left p-4 border-2 transition-colors ${storageProvider === provider ? 'border-[#FACA78] bg-[#FACA78]/10' : 'border-[#575757] bg-[#2E2E2E]/50 hover:border-[#71C9C5]'}`}>
                                    <span className="font-bold font-headline tracking-wide text-lg capitalize text-white">{provider === 'google' ? 'Google Workspace' : provider}</span>
                                    <p className="text-sm text-[#B2D3DE]">{provider === 'google' ? 'Save content as Docs & Sheets.' : provider === 'notion' ? 'Save content to Notion pages.' : 'Save content to SharePoint lists.'}</p>
                                </button>
                            ))}
                        </div>
                        <button onClick={handleFinish} disabled={!storageProvider} className="w-full bg-[#FACA78] text-[#163666] font-bold py-3 px-6 font-headline tracking-wider hover:bg-[#FAFAFA] transition-all duration-200 disabled:bg-[#575757] disabled:cursor-not-allowed">
                            Complete Setup
                        </button>
                    </div>
                 );
            default:
                return null;
        }
    }

    return (
        <div className="min-h-screen text-[#EFF5F6] flex flex-col items-center justify-center p-4 fade-in">
             <header className="absolute top-8 left-8 flex items-center">
                <TerminalIcon className="w-5 h-5 mr-3 text-[#71C9C5]"/>
                <h1 className="font-headline text-2xl font-bold text-[#71C9C5] text-glow tracking-wider">
                  REVREBEL/AI_
                </h1>
            </header>
            <main className="w-full max-w-5xl mx-auto flex-grow flex items-center justify-center">
                 <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 w-full p-4">
                    <OnboardingProgress currentStep={step} />
                    <div className="w-full max-w-lg mt-8 md:mt-0">
                        {renderStep()}
                    </div>
                </div>
            </main>
        </div>
    );
};
