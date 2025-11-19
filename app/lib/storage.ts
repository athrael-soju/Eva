import fs from 'fs/promises';
import path from 'path';

export interface MemoryItem {
    id: string;
    content: string;
    timestamp: string;
    tags?: string[];
}

export interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    tags?: string[];
}

const DATA_DIR = path.join(process.cwd(), 'app', 'lib', 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');
const KNOWLEDGE_FILE = path.join(DATA_DIR, 'knowledge.json');

export class StorageHelper {
    private static async ensureDataDir() {
        try {
            await fs.access(DATA_DIR);
        } catch {
            await fs.mkdir(DATA_DIR, { recursive: true });
        }
    }

    private static async readJson<T>(filePath: string): Promise<T[]> {
        await this.ensureDataDir();
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    private static async writeJson<T>(filePath: string, data: T[]) {
        await this.ensureDataDir();
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    static async getMemory(): Promise<MemoryItem[]> {
        return this.readJson<MemoryItem>(MEMORY_FILE);
    }

    static async saveMemory(content: string): Promise<MemoryItem> {
        const memories = await this.getMemory();
        const newMemory: MemoryItem = {
            id: crypto.randomUUID(),
            content,
            timestamp: new Date().toISOString(),
        };
        memories.push(newMemory);
        await this.writeJson(MEMORY_FILE, memories);
        return newMemory;
    }

    static async searchMemory(query: string): Promise<MemoryItem[]> {
        const memories = await this.getMemory();
        const lowerQuery = query.toLowerCase();
        return memories.filter(m =>
            m.content.toLowerCase().includes(lowerQuery) ||
            m.tags?.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }

    static async getKnowledge(): Promise<KnowledgeItem[]> {
        return this.readJson<KnowledgeItem>(KNOWLEDGE_FILE);
    }

    static async searchKnowledge(query: string): Promise<KnowledgeItem[]> {
        const knowledge = await this.getKnowledge();
        const lowerQuery = query.toLowerCase();
        return knowledge.filter(k =>
            k.title.toLowerCase().includes(lowerQuery) ||
            k.content.toLowerCase().includes(lowerQuery) ||
            k.tags?.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }
}
