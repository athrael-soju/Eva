import { mcpClient } from '../client';
import { EntityTypes } from '../memory';

export const createAddEpisodeTool = (sessionId: string) => ({
    type: 'function' as const,
    name: 'add_episode',
    description: 'Save a new memory to the knowledge graph. Use ONLY for genuinely new information: user preferences, important facts, decisions, or context needed for future conversations. Before saving, check if this information already exists using search_nodes or search_facts to avoid duplicates.',
    parameters: {
        type: 'object' as const,
        properties: {
            name: { 
                type: 'string', 
                description: 'A short title for the memory/episode' 
            },
            description: { 
                type: 'string', 
                description: 'A summary of the conversation or fact to store. This is the main content of the memory.' 
            },
            source: { 
                type: 'string', 
                enum: ['message', 'json', 'text'], 
                description: 'The source type. Use "message" for conversation interactions.' 
            },
            source_description: { 
                type: 'string', 
                description: 'Context about where this information came from (e.g., "User chat")' 
            },
            group_id: { 
                type: 'string', 
                description: 'The user ID or group ID to namespace the data. Use "user_default" if not sure.' 
            }
        },
        required: ['name', 'description', 'source', 'group_id'],
        additionalProperties: false
    },
    invoke: async (_context: any, input: string) => {
        try {
            const args = JSON.parse(input);
            
            console.log('Executing add_episode:', args);
            
            // Append session context to ensure linkage to the Session Event
            const contextSuffix = `\n\n[Context: This interaction occurred during the session event '${sessionId}']`;
            const enhancedDescription = args.description + contextSuffix;

            // Map to MCP expected parameters (add_memory)
            const mcpArgs = {
                name: args.name,
                episode_body: enhancedDescription,
                source: args.source,
                source_description: args.source_description,
                group_id: args.group_id
            };
            
            const result = await mcpClient.callTool('add_memory', mcpArgs);
            return JSON.stringify(result);
        } catch (error: any) {
            console.error('Error in add_episode tool:', error);
            return JSON.stringify({ error: error.message });
        }
    },
    strict: false,
    needsApproval: async () => false,
});

export const searchNodesTool = {
    type: 'function' as const,
    name: 'search_nodes',
    description: 'Search for specific entities in memory using semantic search. Use this to find: user preferences, personal details, topics of interest, locations, requirements, etc. Returns structured entities extracted from past conversations. Use this to CHECK if information already exists before saving new episodes.',
    parameters: {
        type: 'object' as const,
        properties: {
            query: { 
                type: 'string', 
                description: 'The search query to find relevant entities' 
            },
            group_id: { 
                type: 'string', 
                description: 'The user ID or group ID to search within' 
            },
            entity_types: {
                type: 'array',
                items: { type: 'string', enum: EntityTypes },
                description: 'Filter by specific entity types (e.g., Preference, Location, etc.)'
            }
        },
        required: ['query', 'group_id'],
        additionalProperties: false
    },
    invoke: async (_context: any, input: string) => {
        console.log('Tool invoked: search_nodes with input:', input);
        try {
            const args = JSON.parse(input);
            console.log('Executing search_nodes:', args);
            
            // Map to MCP expected parameters
            const mcpArgs = {
                query: args.query,
                group_ids: args.group_id ? [args.group_id] : undefined,
                entity_types: args.entity_types
            };
            
            const result = await mcpClient.callTool('search_nodes', mcpArgs);
            return JSON.stringify(result);
        } catch (error: any) {
            console.error('Error in search_nodes tool:', error);
            return JSON.stringify({ error: error.message });
        }
    },
    strict: false,
    needsApproval: async () => false,
};

export const searchFactsTool = {
    type: 'function' as const,
    name: 'search_facts',
    description: 'Search for relationships and connections between entities using semantic search. Use this to find: how entities relate to each other, historical facts, past decisions, and contextual connections. Returns relationship edges (e.g., "User prefers X", "User works at Y"). Complements search_nodes by showing how things connect.',
    parameters: {
        type: 'object' as const,
        properties: {
            query: { 
                type: 'string', 
                description: 'The search query to find relevant facts' 
            },
            group_id: { 
                type: 'string', 
                description: 'The user ID or group ID to search within' 
            }
        },
        required: ['query', 'group_id'],
        additionalProperties: false
    },
    invoke: async (_context: any, input: string) => {
        try {
            const args = JSON.parse(input);
            console.log('Executing search_facts:', args);
            
            // Map to MCP expected parameters (search_memory_facts)
            const mcpArgs = {
                query: args.query,
                group_ids: args.group_id ? [args.group_id] : undefined
            };
            
            const result = await mcpClient.callTool('search_memory_facts', mcpArgs);
            return JSON.stringify(result);
        } catch (error: any) {
            console.error('Error in search_facts tool:', error);
            return JSON.stringify({ error: error.message });
        }
    },
    strict: false,
    needsApproval: async () => false,
};

export const deleteEpisodeTool = {
    type: 'function' as const,
    name: 'delete_episode',
    description: 'Delete a specific episode (memory) from the graph by its UUID.',
    parameters: {
        type: 'object' as const,
        properties: {
            uuid: { 
                type: 'string', 
                description: 'The UUID of the episode to delete' 
            }
        },
        required: ['uuid'],
        additionalProperties: false
    },
    invoke: async (_context: any, input: string) => {
        try {
            const args = JSON.parse(input);
            console.log('Executing delete_episode:', args);
            const result = await mcpClient.callTool('delete_episode', args);
            return JSON.stringify(result);
        } catch (error: any) {
            console.error('Error in delete_episode tool:', error);
            return JSON.stringify({ error: error.message });
        }
    },
    strict: false,
    needsApproval: async () => false,
};

export const deleteEntityEdgeTool = {
    type: 'function' as const,
    name: 'delete_entity_edge',
    description: 'Delete a specific fact/relationship (entity edge) from the graph by its UUID.',
    parameters: {
        type: 'object' as const,
        properties: {
            uuid: { 
                type: 'string', 
                description: 'The UUID of the entity edge to delete' 
            }
        },
        required: ['uuid'],
        additionalProperties: false
    },
    invoke: async (_context: any, input: string) => {
        try {
            const args = JSON.parse(input);
            console.log('Executing delete_entity_edge:', args);
            const result = await mcpClient.callTool('delete_entity_edge', args);
            return JSON.stringify(result);
        } catch (error: any) {
            console.error('Error in delete_entity_edge tool:', error);
            return JSON.stringify({ error: error.message });
        }
    },
    strict: false,
    needsApproval: async () => false,
};

export const getEpisodesTool = {
    type: 'function' as const,
    name: 'get_episodes',
    description: 'Retrieve recent episodes chronologically (most recent first). Use this at startup to understand "what happened recently" and get temporal context. Unlike search_nodes/search_facts which do semantic search, this returns episodes in time order. Use max_episodes to control how many to retrieve (default: 10, recommend: 15-20 for startup).',
    parameters: {
        type: 'object' as const,
        properties: {
            group_id: { 
                type: 'string', 
                description: 'The user ID or group ID to retrieve episodes for' 
            },
            max_episodes: { 
                type: 'number', 
                description: 'Maximum number of episodes to return (default: 10)' 
            }
        },
        required: ['group_id'],
        additionalProperties: false
    },
    invoke: async (_context: any, input: string) => {
        console.log('Tool invoked: get_episodes with input:', input);
        try {
            const args = JSON.parse(input);
            console.log('Executing get_episodes:', args);
            
            const mcpArgs = {
                group_ids: args.group_id ? [args.group_id] : undefined,
                max_episodes: args.max_episodes
            };
            
            const result = await mcpClient.callTool('get_episodes', mcpArgs);
            return JSON.stringify(result);
        } catch (error: any) {
            console.error('Error in get_episodes tool:', error);
            return JSON.stringify({ error: error.message });
        }
    },
    strict: false,
    needsApproval: async () => false,
};
