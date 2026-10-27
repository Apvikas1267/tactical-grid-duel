# Tactical Grid Duel ⚔️

A high-stakes 1v1 multiplayer Turn-Based Grid Arena Game built with a **React + Tailwind CSS** frontend, **Node.js/Express + Socket.io** backend, and **SQLite** database (`game.db` in WAL mode).

All game mechanics, turns, action points, knockback vector physics, and game states are **100% server-authoritative** to prevent cheating and state desync.

---

## 🚀 Quick Start

Run both the server (port 4000) and client (port 5173) concurrently with a single command from the project root:

```bash
cd tactical-grid-duel
npm start
```

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend API & Sockets:** [http://localhost:4000](http://localhost:4000)
- **REST Endpoints:**
  - `GET /api/leaderboard`: Top ranked warriors sorted by wins
  - `GET /api/history`: Recent match logs and outcomes
  - `GET /api/health`: System status

To run integration tests:
```bash
cd tactical-grid-duel/server
npm test
```

---

## 🎮 Game Rules & Mechanics

- **Grid Arena:** 5×5 tactical arena with coordinates (A–E, 1–5).
- **Player Spawns:** Player 1 (Blue Token) spawns at `(0, 0)`; Player 2 (Red Token) spawns at `(4, 4)`.
- **Action Points (AP):** Each player receives **3 AP** per turn.
  - **Move (1 AP):** Move 1 step to an adjacent empty square (Manhattan distance = 1).
  - **Strike (2 AP):** Attack an adjacent enemy square, dealing **2 DMG** and force-knocking them back 1 cell away (or slamming them into arena boundaries).
- **Turn Timer:** 30 seconds per turn enforced authoritatively by the server interval timer. Inaction automatically forfeits the turn and hands control to the opponent.
- **Victory Condition:** Reduce the opponent's HP from 10 to 0. All match results are transactionally saved to SQLite.

---

## 📁 Project Architecture

```
/tactical-grid-duel
  ├── package.json               # Root scripts & concurrently runner
  ├── /server
  │   ├── index.js               # Express API, authoritative game engine & Socket.io handlers
  │   ├── db.js                  # SQLite connection (WAL mode) with matches & players tables
  │   ├── game.db                # SQLite database file
  │   ├── test_game.js           # Automated integration test suite
  │   └── package.json           # Server dependencies
  └── /client
      ├── vite.config.js         # Vite configuration (port 5173)
      ├── tailwind.config.js     # Cyberpunk / arena styling theme
      ├── index.html             # HTML entry point
      ├── src/
      │   ├── App.jsx            # Main controller with 3-column game layout & state
      │   ├── main.jsx           # React DOM root
      │   ├── index.css          # Tailwind CSS styles & animations
      │   └── components/
      │       ├── Lobby.jsx            # Matchmaking & pre-game SQLite leaderboard preview
      │       ├── PlayerCard.jsx       # HP bars, AP diamonds, coordinates, and turn aura
      │       ├── GridArena.jsx        # Interactive 5x5 grid with hover actions & tokens
      │       ├── ActionControls.jsx   # Move/Strike command badges and End Turn trigger
      │       ├── MatchLogs.jsx        # Real-time scrolling combat log feed
      │       ├── LeaderboardCard.jsx  # Live rankings & match history tabs
      │       └── GameOverModal.jsx    # Victory/Defeat screen & Return to Lobby
      └── package.json           # Client dependencies
```
