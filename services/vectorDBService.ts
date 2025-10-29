
// This file simulates calls to a vector database.
// In a real application, this would involve a client library (e.g., Pinecone, Weaviate)
// to query an actual database for relevant context.

interface Document {
    id: string;
    content: string;
    keywords: string[];
}

const knowledgeBase: Document[] = [
    {
        id: 'voice-001',
        content: `REVREBEL Voice Guidelines:
        - Tone should be confident, clever, and strategically rebellious.
        - Use dry, intellectual humor. Avoid slapstick.
        - Reference geek culture subtly (Star Wars, classic CLI, 80s arcade).
        - No emojis, no casual slang like 'lol'.
        - Structure is paramount. Be precise and plain-spoken.
        - Target Audience: Hotel GMs, Revenue Managers, Marketing Directors. Assume high level of intelligence and industry knowledge.
        - Example of 'good': "Our platform unifies your tech stack, turning data chaos into a clear signal."
        - Example of 'bad': "Hey guys! Let's totally crush your revenue goals with our awesome new tool! lol"`,
        keywords: ['voice', 'tone', 'copywriting', 'brand', 'style', 'cheeky', 'on-brand'],
    },
    {
        id: 'case-study-001',
        content: `Case Study: Project Phoenix for The Grand Metropolitan Hotel.
        - Problem: The hotel's legacy booking engine was slow, causing a 40% cart abandonment rate.
        - Solution: Implemented our 'Velocity' booking engine with a 2-step checkout process. We also rewrote all confirmation and pre-arrival emails to match their luxury brand voice.
        - Results: Reduced abandonment to 12%, increased direct bookings by 22% in Q1. The new pre-arrival emails achieved a 75% open rate.
        - Key takeaway: A seamless user experience combined with on-brand communication is critical for maximizing direct revenue.`,
        keywords: ['case study', 'project phoenix', 'booking engine', 'velocity', 'abandonment', 'direct bookings', 'email'],
    },
    {
        id: 'visual-001',
        content: `REVREBEL Visual Principles:
        - Aesthetic: Modern "retro tech". Think vintage arcade meets SaaS UI.
        - Colors: Use strategic inverse pairings for high contrast and impact (e.g., Dark Blue #163666 with Light Blue #B2D3DE). The accent color is Yellow #FACA78.
        - Typography: Headlines use 'Khand' (uppercase). Body copy uses 'IBM Plex Mono' for a technical feel.
        - Layout: Clarity-first hierarchy. Use grids. Embrace negative space.`,
        keywords: ['visual', 'design', 'color', 'typography', 'layout', 'retro', 'ui', 'khant', 'plex mono'],
    },
    {
        id: 'persona-001',
        content: `REVREBEL Core Persona (BRANDSCAPE):
        - FIVE WORDS: Strategic. Irreverent Geeky. Savvy. Built-to-win. Performance-Obsessed.
        - MAGAZINE: FAST COMPANY (for innovation with edge), WIRED (in the early 2000s, when it still felt underground and ahead), EDGE (the retro British video game magazine — smart, pixel-precise).
        - MOVIE: OCEAN’S ELEVEN (the Clooney one — confident, stylish, expertly executed, and one step ahead)
        - MUSIC/ARTIST: Daft Punk (hardwired precision meets analog soul), LCD Soundsystem (data-driven indie anthems with glitchy heart).
        - RETAIL BRAND: THINKGEEK meets AESOP — elegant functionality, with a dash of irony and source code in the footer.
        - CARD ARCHETYPE: The HACKER (breaking systems and rebuilding them stronger) + The MAGICIAN (transformation, skill, and pulling off the impossible with finesse).
        - DRINK: A perfect Negroni or a cold brew with tonic and citrus — sharp, unexpected, unforgettable.`,
        keywords: ['persona', 'brandscape', 'personality', 'archetype', 'revrebel ai', 'who are you', 'your voice'],
    }
];

/**
 * Simulates querying a vector DB for relevant context.
 * It performs a simple keyword match for this demo.
 * @param prompt The user's prompt.
 * @returns A string containing the content of relevant documents.
 */
export const query = async (prompt: string): Promise<string> => {
    console.log(`SIMULATING: VectorDB query for prompt: "${prompt}"`);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network latency

    const promptWords = prompt.toLowerCase().split(/\s+/);
    const relevantDocs = new Set<Document>();

    knowledgeBase.forEach(doc => {
        for (const keyword of doc.keywords) {
            if (prompt.toLowerCase().includes(keyword)) {
                relevantDocs.add(doc);
                break;
            }
        }
    });

    if (relevantDocs.size === 0) {
        console.log("SIMULATION: No relevant context found in VectorDB.");
        return '';
    }

    const context = Array.from(relevantDocs)
        .map(doc => `--- Document ID: ${doc.id} ---\n${doc.content}`)
        .join('\n\n');
    
    console.log(`SIMULATION: Found ${relevantDocs.size} relevant document(s).`);
    return context;
};
