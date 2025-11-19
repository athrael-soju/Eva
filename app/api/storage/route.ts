import { NextResponse } from 'next/server';
import { MCPClient } from '../../lib/mcp/client';
import { StorageRequestSchema, StorageErrorResponse } from '../../lib/schemas/memory';
import { ZodError } from 'zod';

const mcpClient = new MCPClient();
const GROUP_ID = process.env.MCP_GROUP_ID || 'eva-conversations';

export async function POST(request: Request) {
    try {
        // Parse and validate request body
        const body = await request.json();
        const validatedRequest = StorageRequestSchema.parse(body);

        console.log(`API/Storage: Received action ${validatedRequest.action} with payload:`, validatedRequest.payload);

        const options = validatedRequest.options || {};
        let result;

        switch (validatedRequest.action) {
            case 'query_memory':
                // Search for user information (entities like name, preferences, etc.)
                result = await mcpClient.searchNodes(
                    validatedRequest.payload,
                    [GROUP_ID],
                    options.maxResults || 10,
                    options.entityTypes
                );
                break;

            case 'save_memory':
                // Save user information to memory (creates episode with entities/relationships)
                result = await mcpClient.addMemory(
                    validatedRequest.payload,
                    GROUP_ID,
                    undefined,
                    "text",
                    "User conversation with Eva"
                );
                break;

            case 'search_facts':
                // Search for relationships and facts between entities
                result = await mcpClient.searchMemoryFacts(
                    validatedRequest.payload,
                    [GROUP_ID],
                    options.maxResults || 15,
                    options.centerNodeUuid
                );
                break;

            case 'get_episodes':
                // Retrieve stored episodes
                result = await mcpClient.getEpisodes(
                    [GROUP_ID],
                    options.maxResults || 10
                );
                break;
        }

        return NextResponse.json({ result });
    } catch (error: any) {
        // Handle Zod validation errors
        if (error instanceof ZodError) {
            console.error('API/Storage: Validation error:', error.errors);
            return NextResponse.json(
                {
                    error: 'Invalid request format',
                    details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
                } satisfies StorageErrorResponse,
                { status: 400 }
            );
        }

        // Handle other errors
        console.error('API/Storage: Error processing request:', error);
        return NextResponse.json(
            {
                error: error.message || 'Internal Server Error',
                details: error.toString()
            } satisfies StorageErrorResponse,
            { status: 500 }
        );
    }
}
