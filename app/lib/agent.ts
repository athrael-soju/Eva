import { RealtimeAgent } from '@openai/agents/realtime';
import type { RealtimeSession } from '@openai/agents/realtime';
import { createChatAgent } from './agents/chat';

// Function to create the agent with a disconnect callback
export function createConversationalAgent(
  onDisconnect: () => void,
  getSession: () => RealtimeSession | null
) {
  // Create core agents
  const chatAgent = createChatAgent(onDisconnect, getSession);

  // Return the entry point agent
  console.log('Chat Agent Tools:', JSON.stringify(chatAgent.tools, null, 2));
  return chatAgent;
}
