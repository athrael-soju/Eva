import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";

// Schema for MCP tool call arguments
const AddMemoryArgsSchema = z.object({
    name: z.string(),
    episode_body: z.string(),
    source: z.string(),
    group_id: z.string().optional(),
    source_description: z.string().optional(),
    uuid: z.string().optional(),
});

const SearchNodesArgsSchema = z.object({
    query: z.string(),
    group_ids: z.array(z.string()).optional(), // Note: plural, array
    max_nodes: z.number().optional(),
    entity_types: z.array(z.string()).optional(),
});

const SearchFactsArgsSchema = z.object({
    query: z.string(),
    group_ids: z.array(z.string()).optional(),
    max_facts: z.number().optional(),
    center_node_uuid: z.string().optional(),
});

const GetEpisodesArgsSchema = z.object({
    group_ids: z.array(z.string()).optional(), // Note: plural, array
    max_episodes: z.number().optional(),
});

export class MCPClient {
    private client: Client;
    private transport: StreamableHTTPClientTransport;
    private isConnected: boolean = false;

    constructor() {
        // Use environment variable or default to localhost (no trailing slash)
        const mcpUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL || "http://localhost:8000/mcp";
        this.transport = new StreamableHTTPClientTransport(new URL(mcpUrl));
        this.client = new Client({
            name: "Eva",
            version: "1.0.0",
        }, {
            capabilities: {
                sampling: {},
            },
        });
    }

    async connect() {
        if (this.isConnected) return;

        try {
            await this.client.connect(this.transport);
            this.isConnected = true;
            console.log("Connected to MCP Server");
        } catch (error) {
            console.error("Failed to connect to MCP Server:", error);
            throw error;
        }
    }

    async callTool(name: string, args: any) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const result = await this.client.callTool({
                name: name,
                arguments: args,
            });
            return result;
        } catch (error) {
            console.error(`Failed to call tool ${name}:`, error);
            throw error;
        }
    }

    async listTools() {
        if (!this.isConnected) {
            await this.connect();
        }
        return await this.client.listTools();
    }

    async addMemory(
        content: string,
        groupId?: string,
        name?: string,
        source: string = "text",
        sourceDescription?: string
    ) {
        const args = AddMemoryArgsSchema.parse({
            name: name || `Memory ${new Date().toISOString()}`,
            episode_body: content,
            source: source,
            group_id: groupId,
            source_description: sourceDescription,
        });
        return this.callTool("add_memory", args);
    }

    async searchNodes(
        query: string,
        groupIds?: string[],
        maxNodes?: number,
        entityTypes?: string[]
    ) {
        const args = SearchNodesArgsSchema.parse({
            query,
            group_ids: groupIds,
            max_nodes: maxNodes,
            entity_types: entityTypes,
        });
        return this.callTool("search_nodes", args);
    }

    async searchMemoryFacts(
        query: string,
        groupIds?: string[],
        maxFacts?: number,
        centerNodeUuid?: string
    ) {
        const args = SearchFactsArgsSchema.parse({
            query,
            group_ids: groupIds,
            max_facts: maxFacts,
            center_node_uuid: centerNodeUuid,
        });
        return this.callTool("search_memory_facts", args);
    }

    async getEpisodes(groupIds?: string[], maxEpisodes?: number) {
        const args = GetEpisodesArgsSchema.parse({
            group_ids: groupIds,
            max_episodes: maxEpisodes,
        });
        return this.callTool("get_episodes", args);
    }

    async getEntityEdge(uuid: string) {
        return this.callTool("get_entity_edge", { uuid });
    }

    async deleteEntityEdge(uuid: string) {
        return this.callTool("delete_entity_edge", { uuid });
    }

    async deleteEpisode(uuid: string) {
        return this.callTool("delete_episode", { uuid });
    }

    async clearGraph(groupIds?: string[]) {
        return this.callTool("clear_graph", { group_ids: groupIds });
    }

    async getStatus() {
        return this.callTool("get_status", {});
    }
}
