import { NextResponse } from 'next/server';
import { StorageHelper } from '@/app/lib/storage';

export async function POST(request: Request) {
    try {
        const { action, payload } = await request.json();

        let result;
        switch (action) {
            case 'query_memory':
                result = await StorageHelper.searchMemory(payload);
                break;
            case 'save_memory':
                result = await StorageHelper.saveMemory(payload);
                break;
            case 'search_knowledge':
                result = await StorageHelper.searchKnowledge(payload);
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Storage API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
