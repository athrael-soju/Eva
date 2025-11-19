export class FormatterHelper {
    static format(content: string): string {
        console.log('FormatterHelper: Formatting content');

        // Basic heuristic to detect if content is JSON-like or list-like
        // In a real app, this might use an LLM to determine the best format

        let formatted = content;

        // If content looks like a JSON array, format as a markdown table or list
        if (content.trim().startsWith('[') && content.trim().endsWith(']')) {
            try {
                const data = JSON.parse(content);
                if (Array.isArray(data) && data.length > 0) {
                    const firstItem = data[0];
                    if (typeof firstItem === 'object' && firstItem !== null) {
                        // Create Markdown Table
                        const headers = Object.keys(firstItem);
                        const headerRow = `| ${headers.join(' | ')} |`;
                        const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
                        const rows = data.map((item: any) =>
                            `| ${headers.map(h => item[h] !== undefined ? item[h] : '').join(' | ')} |`
                        ).join('\n');
                        formatted = `${headerRow}\n${separatorRow}\n${rows}`;
                    } else {
                        // Simple list for primitives
                        formatted = data.map((item: any) => `- ${item}`).join('\n');
                    }
                }
            } catch (e) {
                // Not valid JSON, ignore
            }
        }

        // Wrap in a nice block
        return `
### Formatted Response
---
${formatted}
---
`;
    }
}

export const formatResponseTool = {
    type: 'function' as const,
    name: 'format_response',
    description: 'Format the response using the Formatter logic.',
    parameters: {
        type: 'object' as const,
        properties: {
            content: {
                type: 'string',
                description: 'The content to format.',
            },
        },
        required: ['content'],
        additionalProperties: false,
    },
    strict: true,
    invoke: async (context: any, input: string) => {
        const args = JSON.parse(input);
        const result = FormatterHelper.format(args.content);
        return { success: true, formatted_content: result };
    },
    needsApproval: async () => false,
};
