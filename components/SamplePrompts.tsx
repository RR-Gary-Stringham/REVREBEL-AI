import React from 'react';
import type { Mode } from '../types';

interface SamplePromptsProps {
  onPromptClick: (prompt: string, mode: Mode) => void;
  currentMode: Mode;
}

const promptsByMode: Record<Mode, { label: string; prompt: string }[]> = {
  COPYWRITING: [
    { label: "Cheeky confirmation message", prompt: "Write a cheeky, on-brand confirmation message for a client who just signed a contract." },
    { label: "Refine a legal disclaimer", prompt: "Refine this legal disclaimer so it’s clear and human, without losing its punch: 'All services are provided as-is without warranty.'" },
    { label: "Fun form field intro", prompt: "Turn this plain form field intro into something fun, nerdy, and brand-aligned: 'Enter your email address below.'" },
  ],
  VISUAL_QA: [
    { label: "Retro service layout", prompt: "Critique a retro-themed visual layout concept for three service categories. The main colors are dark purple, neon green, and bright orange. The font is a pixelated one. How can I improve it?" },
    { label: "Color pairing advice", prompt: "I'm designing a button with a background of #FF00A0 (magenta). According to REVREBEL principles, what would be a good, high-contrast text color? White, or a light grey?" },
    { label: "Typography check", prompt: "I'm using 'Press Start 2P' for headlines and 'Roboto Mono' for body copy on a website. Does this fit the 'retro tech meets modern UX' aesthetic?" },
  ],
  STRATEGY: [
    { label: "Blog category descriptions", prompt: "Generate 3 blog category descriptions in the REVREBEL voice with SEO and content hooks. The categories are: 'Brand Strategy', 'Hotel Tech', and 'Creative Ops'." },
    { label: "Structure a service page", prompt: "Outline the key sections for a new service page called 'Revenue Intelligence Dashboard'. What's the strategic flow of information?" },
    { label: "Summarize a Google Doc", prompt: "Please read this document and give me a summary of the key takeaways: [PASTE A PUBLIC GOOGLE DOC LINK HERE]" },
  ],
  CREATIVE_IDEATION: [
    { label: "Color palette for a brand", prompt: "Propose a color palette concept for a luxury hotel brand that feels both modern and timeless." },
    { label: "Mood board for a campaign", prompt: "I need a mood board concept for a marketing campaign targeting tech-savvy travelers. The theme is 'Digital Nomadism in the City'." },
    { label: "Concept for a logo", prompt: "Generate a concept for a logo for a new coffee shop called 'The Byte Bar'. It should feel retro-tech and welcoming." },
  ]
};

export const SamplePrompts: React.FC<SamplePromptsProps> = ({ onPromptClick, currentMode }) => {
  const currentPrompts = promptsByMode[currentMode];

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {currentPrompts.map(({ label, prompt }) => (
        <button
          key={label}
          onClick={() => onPromptClick(prompt, currentMode)}
          className="px-3 py-1 text-xs bg-[#2E2E2E] text-[#B2D3DE] border border-[#575757] hover:bg-[#575757] hover:text-[#FAFAFA] transition-colors"
        >
          {label}
        </button>
      ))}
    </div>
  );
};