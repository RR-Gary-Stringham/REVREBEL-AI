
import React from 'react';
import type { FunctionCall } from '@google/genai';

interface CreativeConceptBoxProps {
    toolCall: FunctionCall;
    onFeedback: (approved: boolean) => void;
}

export const CreativeConceptBox: React.FC<CreativeConceptBoxProps> = ({ toolCall, onFeedback }) => {
    const { conceptName, description, palette } = toolCall.args;

    return (
        <div className="border-2 border-dashed border-[#FACA78]/50 p-4 bg-[#2E2E2E]/30 my-2">
            {/* FIX: Add 'as string' to cast unknown to string for rendering */}
            <h4 className="font-headline text-lg font-bold text-[#FACA78] text-glow mb-2">CONCEPT: {conceptName as string}</h4>
            {/* FIX: Add 'as string' to cast unknown to string for rendering */}
            <p className="text-sm text-[#B2D3DE] mb-4">{description as string}</p>
            
            {palette && Array.isArray(palette) && (
                <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#B2D3DE]/80 mb-2">Color Palette:</p>
                    <div className="flex gap-2">
                        {palette.map((color: string, index: number) => (
                            <div key={`${color}-${index}`} className="flex-1 h-12 border-2 border-white/10" style={{ backgroundColor: color }} title={color}></div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-4">
                 <p className="text-sm text-[#B2D3DE] mr-auto">Does this align with your vision?</p>
                <button 
                    onClick={() => onFeedback(false)}
                    className="px-4 py-2 text-2xl bg-transparent border-2 border-[#E05047]/50 text-[#E05047] hover:bg-[#E05047]/20 transition-colors"
                    title="Reject Concept"
                >
                    👎
                </button>
                <button 
                    onClick={() => onFeedback(true)}
                    className="px-4 py-2 text-2xl bg-transparent border-2 border-[#71C9C5]/50 text-[#71C9C5] hover:bg-[#71C9C5]/20 transition-colors"
                    title="Approve Concept"
                >
                    👍
                </button>
            </div>
        </div>
    );
};
