import { z } from 'zod';

/**
 * Schema for storage API requests
 */
export const StorageRequestSchema = z.object({
    action: z.enum([
        'query_memory',        // Search for entities (nodes)
        'save_memory',         // Save new episode
        'search_facts',        // Search for relationships/facts
        'get_episodes',        // Retrieve stored episodes
    ]),
    payload: z.string().min(1, 'Payload cannot be empty'),
    // Optional parameters for enhanced queries
    options: z.object({
        maxResults: z.number().optional(),
        entityTypes: z.array(z.string()).optional(),
        centerNodeUuid: z.string().optional(),
    }).optional(),
});

export type StorageRequest = z.infer<typeof StorageRequestSchema>;

/**
 * Schema for memory nodes returned from Graphiti
 */
export const MemoryNodeSchema = z.object({
    uuid: z.string(),
    name: z.string(),
    summary: z.string().optional(),
    created_at: z.string(),
    group_id: z.string(),
    // Add other node properties as needed
}).passthrough(); // Allow additional properties from Graphiti

export type MemoryNode = z.infer<typeof MemoryNodeSchema>;

/**
 * Schema for query memory response from Graphiti
 */
export const QueryMemoryResponseSchema = z.object({
    message: z.string().optional(),
    nodes: z.array(MemoryNodeSchema),
});

export type QueryMemoryResponse = z.infer<typeof QueryMemoryResponseSchema>;

/**
 * Schema for MCP tool response structure
 * Made flexible to handle various response formats from different MCP tools
 */
export const MCPToolResponseSchema = z.object({
    content: z.array(z.object({
        type: z.string(),
        text: z.string().optional(),
    }).passthrough()).optional(),
    structuredContent: z.object({
        result: z.any(), // Can be QueryMemoryResponse or other structures
    }).optional(),
    isError: z.boolean(),
}).passthrough(); // Allow additional fields

export type MCPToolResponse = z.infer<typeof MCPToolResponseSchema>;

/**
 * Schema for save memory response (same structure as query response from MCP)
 */
export const SaveMemoryResponseSchema = MCPToolResponseSchema;

export type SaveMemoryResponse = z.infer<typeof SaveMemoryResponseSchema>;

/**
 * Schema for storage API response
 * Both query and save return the same MCP tool response structure
 */
export const StorageResponseSchema = z.object({
    result: MCPToolResponseSchema,
});

export type StorageResponse = z.infer<typeof StorageResponseSchema>;

/**
 * Schema for storage API error response
 */
export const StorageErrorResponseSchema = z.object({
    error: z.string(),
    details: z.string().optional(),
});

export type StorageErrorResponse = z.infer<typeof StorageErrorResponseSchema>;
