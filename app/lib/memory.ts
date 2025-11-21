import { z } from 'zod';

export const EntityTypes = [
  'Preference',
  'Requirement',
  'Procedure',
  'Location',
  'Event',
  'Organization',
  'Document',
  'Topic',
  'Object'
] as const;

export type EntityType = typeof EntityTypes[number];

export const EpisodeSchema = z.object({
  name: z.string().describe('A short name for the episode'),
  episode_body: z.string().describe('The content or summary of the episode'),
  source: z.enum(['message', 'json', 'text']).describe('The source type of the episode'),
  source_description: z.string().optional().describe('Description of the source'),
  group_id: z.string().optional().describe('The group ID (e.g. user ID) to namespace the data'),
});

export type Episode = z.infer<typeof EpisodeSchema>;

export const SearchNodesSchema = z.object({
  query: z.string().describe('The search query for entities'),
  group_ids: z.array(z.string()).optional().describe('The group IDs to search within'),
  entity_types: z.array(z.enum(EntityTypes)).optional().describe('Filter by entity types'),
  max_nodes: z.number().optional().describe('Maximum number of nodes to return'),
});

export type SearchNodes = z.infer<typeof SearchNodesSchema>;

export const SearchFactsSchema = z.object({
  query: z.string().describe('The search query for facts/relationships'),
  group_ids: z.array(z.string()).optional().describe('The group IDs to search within'),
  max_facts: z.number().optional().describe('Maximum number of facts to return'),
});

export type SearchFacts = z.infer<typeof SearchFactsSchema>;

// Response types
export interface GraphitiNode {
  uuid: string;
  name: string;
  summary: string;
  created_at: string;
  labels: string[];
}

export interface GraphitiEdge {
  uuid: string;
  source_node_uuid: string;
  target_node_uuid: string;
  name: string; // Relation type
  fact: string;
  created_at: string;
}

export interface SearchResult {
  nodes: GraphitiNode[];
  edges: GraphitiEdge[];
}
