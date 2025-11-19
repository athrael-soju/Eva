import {
    StorageRequest,
    StorageResponseSchema,
    StorageErrorResponseSchema,
    MCPToolResponse,
    QueryMemoryResponse
} from '../schemas/memory';

export class ExecutorHelper {
    private static async callStorageAPI(action: StorageRequest['action'], payload: string): Promise<any> {
        const requestBody: StorageRequest = { action, payload };

        const response = await fetch('/api/storage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
            // Validate error response
            const errorResponse = StorageErrorResponseSchema.safeParse(data);
            if (errorResponse.success) {
                throw new Error(`Storage API error: ${errorResponse.data.error}. ${errorResponse.data.details || ''}`);
            }
            throw new Error(`Storage API error: ${response.statusText}`);
        }

        // Validate success response
        const validatedResponse = StorageResponseSchema.safeParse(data);
        if (validatedResponse.success) {
            return validatedResponse.data.result;
        }

        // If validation fails, return raw data but log warning
        console.warn('Storage API response does not match expected schema:', data);
        return data.result;
    }

    static async queryMemory(query: string): Promise<string> {
        console.log('ExecutorHelper: Querying memory for:', query);
        try {
            const result = await this.callStorageAPI('query_memory', query);
            console.log('ExecutorHelper: Query result:', JSON.stringify(result, null, 2));

            // Check if we have structured content with nodes
            if (result?.structuredContent?.result) {
                const structuredResult = result.structuredContent.result;

                // Check if no nodes were found
                if (structuredResult.nodes && Array.isArray(structuredResult.nodes)) {
                    if (structuredResult.nodes.length === 0) {
                        return "No previous information found. This appears to be your first meeting.";
                    }

                    // Format nodes in a natural, narrative way
                    const nodeDescriptions = structuredResult.nodes.map((node: any) => {
                        const parts = [];
                        if (node.name) parts.push(`Name: ${node.name}`);
                        if (node.summary) parts.push(`Details: ${node.summary}`);
                        return parts.join('. ');
                    }).filter((desc: string) => desc.length > 0);

                    return nodeDescriptions.join('\n');
                }
            }

            // Fallback to checking content array
            if (result && result.content) {
                const content = result.content;
                if (Array.isArray(content) && content.length > 0) {
                    // Try to parse text content
                    const textContent = content.find((item: any) => item.type === 'text');
                    if (textContent && textContent.text) {
                        try {
                            const parsed = JSON.parse(textContent.text);
                            if (parsed.nodes && Array.isArray(parsed.nodes)) {
                                if (parsed.nodes.length === 0) {
                                    return "No previous information found. This appears to be your first meeting.";
                                }
                                // Format parsed nodes naturally
                                const nodeDescriptions = parsed.nodes.map((node: any) => {
                                    const parts = [];
                                    if (node.name) parts.push(`Name: ${node.name}`);
                                    if (node.summary) parts.push(`Details: ${node.summary}`);
                                    return parts.join('. ');
                                }).filter((desc: string) => desc.length > 0);
                                return nodeDescriptions.join('\n');
                            }
                        } catch (e) {
                            // If parsing fails, return the text content as is
                            return textContent.text;
                        }
                    }
                    return content.map((item: any) => item.text || '').filter((t: string) => t).join('\n');
                } else if (Array.isArray(content)) {
                    return "No previous information found. This appears to be your first meeting.";
                }
            }

            return JSON.stringify(result, null, 2);
        } catch (error) {
            console.error('Failed to query memory:', error);
            return "Error querying memory.";
        }
    }

    static async saveMemory(content: string): Promise<string> {
        console.log('ExecutorHelper: Saving to memory:', content);
        try {
            await this.callStorageAPI('save_memory', content);
            return 'Memory saved successfully';
        } catch (error) {
            console.error('Failed to save memory:', error);
            return 'Error saving memory.';
        }
    }

    /**
     * Automatically save a conversation turn (user + agent exchange) to memory
     * This runs in the background and doesn't block the conversation
     */
    static async saveConversationTurn(userMessage: string, agentResponse: string): Promise<void> {
        try {
            const conversationContent = `User: ${userMessage}\nEva: ${agentResponse}`;
            console.log('ExecutorHelper: Auto-saving conversation turn');
            await this.callStorageAPI('save_memory', conversationContent);
        } catch (error) {
            console.error('Failed to auto-save conversation turn:', error);
            // Don't throw - we don't want to interrupt the conversation if auto-save fails
        }
    }

    static async searchFacts(query: string, centerNodeUuid?: string): Promise<string> {
        console.log('ExecutorHelper: Searching facts for:', query, centerNodeUuid ? `(centered on ${centerNodeUuid})` : '');
        try {
            const requestBody = {
                action: 'search_facts' as const,
                payload: query,
                options: centerNodeUuid ? { centerNodeUuid } : undefined,
            };

            const response = await fetch('/api/storage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorResponse = StorageErrorResponseSchema.safeParse(data);
                if (errorResponse.success) {
                    throw new Error(`Storage API error: ${errorResponse.data.error}. ${errorResponse.data.details || ''}`);
                }
                throw new Error(`Storage API error: ${response.statusText}`);
            }

            const validatedResponse = StorageResponseSchema.safeParse(data);
            if (validatedResponse.success) {
                const result = validatedResponse.data.result;
                console.log('ExecutorHelper: Facts result:', JSON.stringify(result, null, 2));
                return JSON.stringify(result, null, 2);
            }

            console.warn('Storage API response does not match expected schema:', data);
            return JSON.stringify(data.result, null, 2);
        } catch (error) {
            console.error('Failed to search facts:', error);
            return "Error searching facts.";
        }
    }

}

export const queryMemoryTool = {
    type: 'function' as const,
    name: 'query_memory',
    description: 'Search for information about the USER to personalize the conversation. Use this to find the user\'s name, preferences, interests, past conversations, or any personal facts they\'ve shared. This is ONLY for user personalization, not for general knowledge or factual information.',
    parameters: {
        type: 'object' as const,
        properties: {
            query: {
                type: 'string',
                description: 'The query to search for in memory.',
            },
        },
        required: ['query'],
        additionalProperties: false,
    },
    strict: true,
    invoke: async (context: any, input: string) => {
        const args = JSON.parse(input);
        const result = await ExecutorHelper.queryMemory(args.query);
        return { success: true, result: result };
    },
    needsApproval: async () => false,
};

export const saveMemoryTool = {
    type: 'function' as const,
    name: 'save_memory',
    description: 'Save information about the USER to long-term memory for future personalization. Use this whenever the user shares personal information like their name, preferences, interests, hobbies, goals, or any facts about themselves or their life. This is ONLY for user information, not for general facts or knowledge.',
    parameters: {
        type: 'object' as const,
        properties: {
            content: {
                type: 'string',
                description: 'The content to save to memory.',
            },
        },
        required: ['content'],
        additionalProperties: false,
    },
    strict: true,
    invoke: async (context: any, input: string) => {
        const args = JSON.parse(input);
        const result = await ExecutorHelper.saveMemory(args.content);
        return { success: true, result: result };
    },
    needsApproval: async () => false,
};

export const searchFactsTool = {
    type: 'function' as const,
    name: 'search_facts',
    description: 'Search for RELATIONSHIPS and CONNECTIONS between entities in memory. Use this to understand how things relate to each other (e.g., "What are the user\'s relationships?", "Find connections between their interests", "What facts are related to their work?"). This searches the graph for facts/edges, not just entities.',
    parameters: {
        type: 'object' as const,
        properties: {
            query: {
                type: 'string',
                description: 'The relationship or connection to search for (e.g., "user work relationships", "interests connected to hobbies").',
            },
            centerNodeUuid: {
                type: 'string',
                description: 'Optional: UUID of an entity to center the search around. Results will be prioritized by proximity to this entity.',
            },
        },
        required: ['query'],
        additionalProperties: false,
    },
    strict: false,
    invoke: async (context: any, input: string) => {
        const args = JSON.parse(input);
        const result = await ExecutorHelper.searchFacts(args.query, args.centerNodeUuid);
        return { success: true, result: result };
    },
    needsApproval: async () => false,
};

