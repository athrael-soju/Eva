import OpenAI from 'openai';

export class OptimizerHelper {
    static async optimize(prompt: string): Promise<string> {
        console.log('OptimizerHelper: Optimizing prompt:', prompt);

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            dangerouslyAllowBrowser: true // Note: In a real app, this should be server-side
        });

        try {
            // @ts-ignore - The responses API might be in beta or not fully typed in the current environment
            const response = await openai.responses.create({
                model: process.env.OPENAI_MODEL || 'gpt-5-nano',
                modalities: ['text'],
                instructions: 'You are an expert prompt engineer. Your goal is to rewrite the following prompt to be more precise, clear, and effective for an AI agent. Return ONLY the optimized prompt, no explanations.',
                input: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            } as any);

            console.log('OptimizerHelper: Raw response:', JSON.stringify(response, null, 2));

            let optimizedPrompt = prompt;

            // The Response object has an output_text helper or output array
            // We cast to any because the types in the installed version might be outdated
            const r = response as any;

            if (r.output_text) {
                optimizedPrompt = r.output_text;
            } else if (r.output && Array.isArray(r.output)) {
                const textItem = r.output.find((item: any) => item.type === 'message' || item.content);
                if (textItem && textItem.content) {
                    if (Array.isArray(textItem.content)) {
                        optimizedPrompt = textItem.content.map((c: any) => c.text || '').join('');
                    } else {
                        optimizedPrompt = textItem.content;
                    }
                }
            }

            console.log('OptimizerHelper: Result:', optimizedPrompt);
            return optimizedPrompt;

        } catch (error) {
            console.error('OptimizerHelper: Error optimizing prompt:', error);
            return prompt; // Fallback to original prompt on error
        }
    }
}

export const optimizePromptTool = {
    type: 'function' as const,
    name: 'optimize_prompt',
    description: 'Refine and optimize the prompt using the Optimizer logic.',
    parameters: {
        type: 'object' as const,
        properties: {
            prompt: {
                type: 'string',
                description: 'The prompt to optimize.',
            },
        },
        required: ['prompt'],
        additionalProperties: false,
    },
    strict: true,
    invoke: async (context: any, input: string) => {
        const args = JSON.parse(input);
        const result = await OptimizerHelper.optimize(args.prompt);
        return { success: true, optimized_prompt: result };
    },
    needsApproval: async () => false,
};
