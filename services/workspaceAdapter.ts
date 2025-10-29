
// This file acts as an adapter to route requests to the correct workspace service.
// This makes the system extensible, as new providers can be added here without
// changing the core application logic.

import type { StorageProvider } from '../types';
import * as google from './workspaceService';
import * as notion from './notionService';
import * as sharepoint from './sharepointService';

interface ExportParams {
    provider: StorageProvider;
    title: string;
    content: string;
    isStructured: boolean; // Indicates if content is table-like
}

interface ExportResult {
    success: boolean;
    url: string;
}

/**
 * Exports content to the specified provider.
 * @param params The export parameters.
 * @returns A promise that resolves with the result of the export.
 */
export const exportContent = async (params: ExportParams): Promise<ExportResult> => {
    const { provider, title, content, isStructured } = params;

    switch (provider) {
        case 'google':
            if (isStructured) {
                return google.saveToGoogleSheet(title, content);
            }
            return google.saveToGoogleDoc(title, content);
        
        case 'notion':
            // Notion doesn't have a direct sheet equivalent in this simulation
            return notion.saveToNotionPage(title, content);

        case 'sharepoint':
             if (isStructured) {
                return sharepoint.saveToSharepointList(title, content);
            }
            // For this demo, let's assume non-structured content can also be saved.
            // In a real scenario, this might create a document in a library.
            return sharepoint.saveToSharepointList(title, content);

        default:
            throw new Error(`Unknown storage provider: ${provider}`);
    }
};