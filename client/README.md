# ♟️ chessperiment.app
### The Ultimate Sandbox for Custom Chess Variants

**[chessperiment.app](https://chessperiment.app)** is a web-based chess engine designed for total customization. Unlike standard chess platforms, Chessperiment features a **Scratch-inspired logic editor** that allows you to define unique behaviors for every piece and board.

---

## 🚀 Key Features
* **Custom Piece Creator:** Design pieces with advanced logic. Create "Invincible" pieces that insta-kill attackers or "Cursed" pieces that die the moment they are threatened.
* **Visual Logic Editor:** Built with a custom drag-and-drop system powered by `dnd-kit`. No coding required—just drag triggers and effects.
* **Dynamic Board Shapes:** Go beyond the 8x8 grid with highly customizable board topologies.
* **Play Anywhere:** Challenge a specialized **Stockfish** integration or play against real users in real-time.

## 🛠️ Tech Stack
* **Frontend:** [Next.js](https://nextjs.org/) (React)
* **Backend:** [Express.js](https://expressjs.com/) (Node.js) for real-time multiplayer and engine integration.
* **Database:** Google Firebase Firestore (optional — supports offline-only mode without Firebase)
* **UI/Interaction:** `dnd-kit` for the visual logic builder.
* **Engine:** Stockfish integration for AI gameplay.

## 🧠 How the Logic Engine Works
Chessperiment uses a trigger-effect architecture. Every piece can have unique event listeners:
- **Triggers:** `onThreatened`, `onCapture`, `onMove`, `onGameStart`.
- **Effects:** `killAttacker`, `spawnPiece`, `changeVariable`, `instantlyDie`.

This specific structure allows for variants that are impossible on other platforms.

## 🏠 Self-Hosting (Offline Mode)

You can run Chessperiment completely offline — no accounts, no database, no internet.

### Quick Start (Offline)

```bash
# 1. Install dependencies
npm install

# 2. Copy and edit the example env (leave Firebase fields empty for offline)
cp .env.example .env.local

# 3. Start the dev server
npm run dev
```

That's it. Open http://localhost:3000 and you can:
- Play standard chess vs AI (Stockfish) or local hotseat 2-player
- Create custom boards and pieces (saved to localStorage)
- Use the visual logic editor

### What Works Without Firebase

| Feature | Offline | Firebase Required |
|---|---|---|
| Play vs AI (Stockfish) | ✅ | |
| Local hotseat (2-player) | ✅ | |
| Board & piece editor | ✅ (localStorage) | |
| Visual logic editor | ✅ | |
| Save/load projects | ✅ (localStorage) | |
| Play custom variants vs AI | ✅ | |
| Accounts & sign-up | | ✅ |
| Online multiplayer | | ✅ |
| Cloud saves (sync across devices) | | ✅ |
| Marketplace | | ✅ |
| Email/password auth | | ✅ |
| Google OAuth | | ✅ |

### Full Experience (with Firebase)

To enable accounts, online multiplayer, and the marketplace, create a Firebase project and fill in all `FIREBASE_*` and `AUTH_GOOGLE_*` variables in `.env.local`. See `.env.example` for the full list.

### Optional: Backend Server + Redis

The backend server (Express + Socket.IO) is only needed for online multiplayer matchmaking.
Run it alongside the frontend:

```bash
cd ../server
npm install
npm start
# Optionally: docker run -d -p 6379:6379 redis
```

## 🤝 Contributing & Community
I am currently the sole developer of this project! 
* **Goal:** Building a community of variant creators and enthusiasts.
* **Feedback:** If you find a bug or have a logic trigger suggestion, please open an Issue.
* **Community:** Join the discussion on our [Subreddit](YOUR_REDDIT_LINK) or follow development on [Twitter/GitHub](YOUR_LINK).

## 📜 License
See LICENSE.md