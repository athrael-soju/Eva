export class ExecutorHelper {
    private static async callStorageAPI(action: string, payload: string): Promise<any> {
        const response = await fetch('/api/storage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload }),
        });

        if (!response.ok) {
            throw new Error(`Storage API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.result;
    }

    static async queryMemory(query: string): Promise<string> {
        console.log('ExecutorHelper: Querying memory for:', query);
        try {
            const memories = await this.callStorageAPI('query_memory', query);
            if (!memories || memories.length === 0) {
                return "No relevant memories found.";
            }
            return JSON.stringify(memories.map((m: any) => ({ content: m.content, timestamp: m.timestamp })), null, 2);
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

    static async searchKnowledge(query: string): Promise<string> {
        console.log('ExecutorHelper: Searching knowledge base for:', query);
        try {
            const knowledge = await this.callStorageAPI('search_knowledge', query);
            if (!knowledge || knowledge.length === 0) {
                return "No relevant knowledge found.";
            }
            return JSON.stringify(knowledge, null, 2);
        } catch (error) {
            console.error('Failed to search knowledge:', error);
            return "Error searching knowledge.";
        }
    }
}

export const executeTaskTool = {
    type: 'function' as const,
    name: 'execute_task',
    description: 'Execute a task (memory/knowledge) using the Executor logic.',
    parameters: {
        type: 'object' as const,
        properties: {
            action: {
                type: 'string',
                enum: ['query_memory', 'save_memory', 'search_knowledge'],
                description: 'The action to perform.',
            },
            payload: {
                type: 'string',
                description: 'The query or content for the action.',
            },
        },
        required: ['action', 'payload'],
        additionalProperties: false,
    },
    strict: true,
    invoke: async (context: any, input: string) => {
        const args = JSON.parse(input);
        let result = '';
        if (args.action === 'query_memory') {
            result = await ExecutorHelper.queryMemory(args.payload);
        } else if (args.action === 'save_memory') {
            result = await ExecutorHelper.saveMemory(args.payload);
        } else if (args.action === 'search_knowledge') {
            result = await ExecutorHelper.searchKnowledge(args.payload);
        }
        return { success: true, result: result };
    },
    needsApproval: async () => false,
};
