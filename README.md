# Chessperiment

An opensource web-based custom chess variant sandbox platform. Create custom boards, design unique pieces with a visual Blockly-based logic editor, define custom rules, and play online against friends or Stockfish AI.

## Contributing
Feel free to contribute, you can take a look at the [canban board](https://github.com/users/ItzMassel/projects/1/views/1) for inspiration. You should also [join the Discord!](https://discord.gg/ZNVHKZpnGh)

## Features

- **Board Editor** — Design custom boards with configurable dimensions, square or hex topologies, and active/inactive squares.
- **Piece Editor** — Create custom pieces with a Scratch-like visual programming editor (Blockly). Define triggers (`on-move`, `on-capture`, `on-threat`, `on-turn-start`) and actions (`kill`, `transform`, `explode`, `win`, `prevent`, etc.).
- **Custom Game Engine** — Supports standard chess, custom movement rules, hex grids, piece state variables (cooldown, charge, mode), multi-cell pieces, square logic, and a full effect system.
- **Online Multiplayer** — Real-time gameplay via Socket.IO with room-based matchmaking, chat, and spectator support.
- **AI Opponent** — Play against Stockfish 17 at configurable difficulty levels (runs both server-side and client-side via WASM).
- **Marketplace** — Community hub for sharing and discovering custom boards, pieces, and game sets.
- **Authentication** — Sign in with Google or email/password via Firebase Auth.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (React 19, App Router), TypeScript |
| Styling | Tailwind CSS v4, Radix UI, Framer Motion |
| Backend | Express 5 + Socket.IO 4 (Node.js) |
| Database/Auth | Firebase (Firestore, Auth) |
| Chess Engine | Stockfish 17 (WASM + Node.js pool) |
| Visual Editor | Google Blockly |
| AI | OpenAI SDK, DeepSeek API |
| I18n | next-intl (English, German) |

## Project Structure

```
client/          -- Next.js 16 frontend
  src/
    app/         -- App Router pages
    engine/      -- Custom chess engine (TypeScript)
    components/  -- React components
    context/     -- Socket, Auth, AI contexts
    lib/         -- Utilities (socket, firebase, grid)
    i18n/        -- Internationalization
    messages/    -- Translation files (en.json, de.json)
server/          -- Express + Socket.IO backend
  new_server.js  -- Main server entry
  engine/        -- Server-side chess engine (mirrors client)
```

## Getting Started

### Prerequisites

- Node.js
- Redis (optional, for matchmaking persistence)

### Development

Run the dev launcher from the root:

```
Dev Chessperiment.bat
```

This starts both servers in separate windows:
- **Backend** on port 3002 (`server`)
- **Frontend** on port 3000 (`client`)

#### Individual Scripts

**Frontend** (from `client/`):
- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run lint` — Run ESLint

**Backend** (from `server/`):
- `npm run dev` — Start with nodemon (auto-reload)
- `npm start` — Start production server

**Redis** (optional):
```
docker run -d -p 6379:6379 redis
```
## Links
[Website](https://chessperiment.app)
[Discord](https://discord.gg/ZNVHKZpnGh)

## License

See [LICENSE.md](LICENSE.md).
