# Eva - Your AI Companion

Eva is a warm, thoughtful AI companion with persistent memory, inspired by Samantha from the movie "Her." Built with Next.js and OpenAI's Realtime API, Eva engages in natural voice conversations while remembering your preferences, interests, and shared history through a sophisticated knowledge graph memory system.

## Features

- **Voice Conversations**: Real-time voice interaction using OpenAI's Realtime API with WebRTC
- **Persistent Memory**: Knowledge graph-based memory system that stores entities (people, places, things) and relationships
- **Natural Personality**: Eva has genuine emotional intelligence, forming meaningful connections with contextual awareness
- **Session Management**: Clean session handling with graceful connection/disconnection
- **3D Animation**: Interactive loading animation built with Three.js

## Tech Stack

- **Framework**: Next.js 16 with React 19
- **AI**: OpenAI Realtime API (@openai/agents)
- **Memory**: Knowledge graph storage with entity-relationship modeling
- **Styling**: Tailwind CSS 4
- **3D Graphics**: Three.js
- **Type Safety**: TypeScript
- **UI Components**: Radix UI primitives

## Prerequisites

- Node.js 20 or higher
- OpenAI API key with Realtime API access
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/athrael-soju/eva.git
cd eva
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click on the loading animation to initiate a voice conversation with Eva
2. Speak naturally - Eva will remember details about you across sessions
3. Eva automatically saves important information (preferences, goals, interests) to her memory
4. Say goodbye when you're done, and Eva will gracefully end the session

## Project Structure

```
eva/
├── app/
│   ├── api/
│   │   ├── session/       # Session token generation
│   │   └── storage/       # Memory storage API
│   ├── components/
│   │   └── LoadingAnimation.tsx  # 3D interactive animation
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── chat.ts    # Eva's personality and configuration
│   │   │   └── executor.ts # Memory tools (query, save, search)
│   │   ├── mcp/           # Model Context Protocol client
│   │   └── schemas/       # Memory data schemas
│   ├── layout.tsx         # Root layout and metadata
│   └── page.tsx           # Main application page
├── public/
│   └── eva-icon.png       # Application icon
└── package.json
```

## Memory System

Eva uses a knowledge graph memory system with three main operations:

- **query_memory**: Retrieve entities (people, places, preferences, events)
- **search_facts**: Understand relationships and connections between entities
- **save_memory**: Store new information automatically extracted as entities and relationships

Memory is scoped to personalization - understanding who you are, what matters to you, and your shared history with Eva.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `OPENAI_REALTIME_MODEL` | Model to use for realtime conversations | Yes |

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and not currently licensed for public use.

## Acknowledgments

- Inspired by the movie "Her" and the character Samantha
- Built with OpenAI's Realtime API
- Uses the Model Context Protocol for memory management
