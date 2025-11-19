import { RealtimeAgent } from '@openai/agents/realtime';
import type { RealtimeSession } from '@openai/agents/realtime';
import { optimizePromptTool } from './optimizer';
import { executeTaskTool } from './executor';
import { formatResponseTool } from './formatter';

export const createChatAgent = (
    onDisconnect: () => void,
    getSession: () => RealtimeSession | null
) => {
    return new RealtimeAgent({
        name: 'Chat Agent',
        voice: 'marin',
        instructions:
            'You are the Chat Agent, a helpful and capable AI assistant. Your goal is to assist the user with their requests directly. \n\n' +
            '- If the user\'s request is vague or needs refinement, use `optimize_prompt`.\n' +
            '- If the request requires external data, memory access, or specific actions, use `execute_task`.\n' +
            '- If the response needs to be formatted in a specific way (e.g., a table, markdown report), use `format_response`.\n' +
            '- Always answer the user directly after performing the necessary tasks.\n\n' +
            'If the user indicates they want to end the conversation or says goodbye, use the `end_session` tool.',
        tools: [
            optimizePromptTool,
            executeTaskTool,
            formatResponseTool,
            {
                type: 'function',
                name: 'end_session',
                description: 'Ends the current conversation session and disconnects the AI assistant.',
                parameters: {
                    type: 'object',
                    properties: {
                        farewell_message: {
                            type: 'string',
                            description: 'A farewell message to say to the user before disconnecting',
                        },
                    },
                    required: ['farewell_message'],
                    additionalProperties: false,
                },
                strict: false,
                invoke: async (_context, input: string) => {
                    const args = JSON.parse(input);
                    console.log('Ending session with farewell:', args.farewell_message);

                    const session = getSession();
                    if (session) {
                        let agentDone = false;
                        let audioDone = false;
                        let disconnected = false;

                        const checkAndDisconnect = () => {
                            if ((agentDone && audioDone) && !disconnected) {
                                disconnected = true;
                                setTimeout(() => {
                                    session.off('agent_end', onAgentEnd);
                                    session.off('audio_stopped', onAudioStopped);
                                    onDisconnect();
                                }, 1000);
                            }
                        };

                        const onAgentEnd = () => {
                            console.log('Agent response completed');
                            agentDone = true;
                            checkAndDisconnect();
                        };

                        const onAudioStopped = () => {
                            console.log('Audio playback stopped');
                            audioDone = true;
                            checkAndDisconnect();
                        };

                        session.on('agent_end', onAgentEnd);
                        session.on('audio_stopped', onAudioStopped);

                        setTimeout(() => {
                            if (!disconnected) {
                                console.log('Disconnect timeout reached, forcing disconnect');
                                session.off('agent_end', onAgentEnd);
                                session.off('audio_stopped', onAudioStopped);
                                disconnected = true;
                                onDisconnect();
                            }
                        }, 10000);
                    } else {
                        setTimeout(() => {
                            onDisconnect();
                        }, 500);
                    }

                    return JSON.stringify({ success: true, message: 'Session ended successfully' });
                },
                needsApproval: async () => false,
            },
        ],
    });
};
