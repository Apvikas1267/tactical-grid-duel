const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { recordMatchOutcome, getTopLeaderboard, getRecentMatches, initPromise } = require('./db');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;

// REST API Endpoints
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await getTopLeaderboard(10);
    res.json(leaderboard);
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const history = await getRecentMatches(5);
    res.json(history);
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch match history' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Rooms memory store
 * Structure:
 * rooms[roomId] = {
 *   roomId: string,
 *   players: {
 *     p1: { id, name, x: 0, y: 0, hp: 10, maxHp: 10, ap: 3 },
 *     p2: { id, name, x: 4, y: 4, hp: 10, maxHp: 10, ap: 3 }
 *   },
 *   turn: 'p1' | 'p2',
 *   turnTimeLeft: 30,
 *   history: [],
 *   turnsPlayed: 1,
 *   status: 'waiting' | 'playing' | 'ended',
 *   winner: null,
 *   loser: null,
 *   intervalId: Timer
 * }
 */
const rooms = {};

// Helper to sanitize room data for broadcasting (stripping intervalId)
const serializeRoom = (room) => {
  if (!room) return null;
  return {
    roomId: room.roomId,
    players: room.players,
    turn: room.turn,
    turnTimeLeft: room.turnTimeLeft,
    history: room.history,
    turnsPlayed: room.turnsPlayed,
    status: room.status,
    winner: room.winner,
    loser: room.loser
  };
};

const stopRoomTimer = (room) => {
  if (room && room.intervalId) {
    clearInterval(room.intervalId);
    room.intervalId = null;
  }
};

const startTurnTimer = (roomId) => {
  const room = rooms[roomId];
  if (!room) return;

  stopRoomTimer(room);

  room.intervalId = setInterval(() => {
    if (!rooms[roomId] || rooms[roomId].status !== 'playing') {
      stopRoomTimer(rooms[roomId]);
      return;
    }

    const currentRoom = rooms[roomId];
    currentRoom.turnTimeLeft -= 1;

    if (currentRoom.turnTimeLeft <= 0) {
      // Timeout switch turn
      const prevTurn = currentRoom.turn;
      const nextTurn = prevTurn === 'p1' ? 'p2' : 'p1';
      currentRoom.turn = nextTurn;
      currentRoom.turnTimeLeft = 30;
      currentRoom.turnsPlayed += 1;

      // Reset next player's AP
      if (currentRoom.players[nextTurn]) {
        currentRoom.players[nextTurn].ap = 3;
      }

      const prevName = currentRoom.players[prevTurn]?.name || 'Player';
      const nextName = currentRoom.players[nextTurn]?.name || 'Player';
      currentRoom.history.push(`⏰ ${prevName}'s turn timed out! It is now ${nextName}'s turn.`);

      io.to(roomId).emit('game_state', serializeRoom(currentRoom));
    } else {
      // Broadcast timer tick to keep clients synced
      io.to(roomId).emit('timer_tick', {
        turnTimeLeft: currentRoom.turnTimeLeft,
        turn: currentRoom.turn
      });
    }
  }, 1000);
};

// Generate room code
const generateRoomId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'ARENA-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Handle joining game
  socket.on('join_game', ({ username, roomId }) => {
    const cleanUsername = (username || '').trim() || `Warrior_${socket.id.substring(0, 4)}`;
    let targetRoomId = (roomId || '').trim().toUpperCase();

    if (!targetRoomId) {
      // Find an open room waiting for a second player, or create new
      const openRoomId = Object.keys(rooms).find(
        (id) => rooms[id].status === 'waiting' && (!rooms[id].players.p1 || !rooms[id].players.p2)
      );
      targetRoomId = openRoomId || generateRoomId();
    }

    if (!rooms[targetRoomId]) {
      rooms[targetRoomId] = {
        roomId: targetRoomId,
        players: {
          p1: null,
          p2: null
        },
        turn: 'p1',
        turnTimeLeft: 30,
        history: [],
        turnsPlayed: 1,
        status: 'waiting',
        winner: null,
        loser: null,
        intervalId: null
      };
    }

    const room = rooms[targetRoomId];

    // Assign role
    let role = null;
    if (!room.players.p1) {
      role = 'p1';
      room.players.p1 = {
        id: socket.id,
        name: cleanUsername,
        x: 0,
        y: 0,
        hp: 10,
        maxHp: 10,
        ap: 3
      };
    } else if (!room.players.p2) {
      role = 'p2';
      room.players.p2 = {
        id: socket.id,
        name: cleanUsername,
        x: 4,
        y: 4,
        hp: 10,
        maxHp: 10,
        ap: 3
      };
    } else {
      socket.emit('game_error', { message: 'Room is already full.' });
      return;
    }

    socket.roomId = targetRoomId;
    socket.playerRole = role;
    socket.join(targetRoomId);

    room.history.push(`⚔️ ${cleanUsername} entered the arena as ${role.toUpperCase()}.`);

    // Check if room is now ready to start
    if (room.players.p1 && room.players.p2) {
      room.status = 'playing';
      room.turn = 'p1';
      room.turnTimeLeft = 30;
      room.players.p1.ap = 3;
      room.players.p2.ap = 3;
      room.history.push(`🔥 Duel started! ${room.players.p1.name} (P1) vs ${room.players.p2.name} (P2).`);
      startTurnTimer(targetRoomId);
    }

    // Send assignment to this socket
    socket.emit('assigned_role', { role, roomId: targetRoomId });

    // Broadcast full updated room state to room members
    io.to(targetRoomId).emit('game_state', serializeRoom(room));
  });

  // Handle moves and attacks
  socket.on('make_move', ({ targetX, targetY }) => {
    const roomId = socket.roomId;
    const role = socket.playerRole;
    const room = rooms[roomId];

    if (!room) {
      socket.emit('game_error', { message: 'Game room not found.' });
      return;
    }

    if (room.status !== 'playing') {
      socket.emit('game_error', { message: 'Game is not active.' });
      return;
    }

    if (room.turn !== role) {
      socket.emit('game_error', { message: "It is not your turn!" });
      return;
    }

    const tx = Number(targetX);
    const ty = Number(targetY);

    if (isNaN(tx) || isNaN(ty) || tx < 0 || tx > 4 || ty < 0 || ty > 4) {
      socket.emit('game_error', { message: 'Target coordinates are out of bounds (0-4).' });
      return;
    }

    const currentActor = room.players[role];
    const enemyRole = role === 'p1' ? 'p2' : 'p1';
    const enemyActor = room.players[enemyRole];

    if (!currentActor || !enemyActor) {
      socket.emit('game_error', { message: 'Players not properly initialized.' });
      return;
    }

    // Manhattan distance check: must be adjacent (|dx| + |dy| === 1)
    const manhattanDist = Math.abs(currentActor.x - tx) + Math.abs(currentActor.y - ty);
    if (manhattanDist !== 1) {
      socket.emit('game_error', { message: 'Can only move or attack adjacent squares (Manhattan distance = 1).' });
      return;
    }

    // Check if target square is occupied by the enemy
    const isEnemyTarget = enemyActor.x === tx && enemyActor.y === ty;

    if (isEnemyTarget) {
      // Attack action: requires 2 AP, deals 2 damage, force pushes back
      if (currentActor.ap < 2) {
        socket.emit('game_error', { message: 'Not enough Action Points! Attacking requires 2 AP.' });
        return;
      }

      currentActor.ap -= 2;
      const damageDealt = 2;
      enemyActor.hp = Math.max(0, enemyActor.hp - damageDealt);

      // Push back calculation: vector from attacker to target
      const pushDx = tx - currentActor.x;
      const pushDy = ty - currentActor.y;
      const newPushX = enemyActor.x + pushDx;
      const newPushY = enemyActor.y + pushDy;

      let pushMessage = '';
      if (newPushX >= 0 && newPushX <= 4 && newPushY >= 0 && newPushY <= 4) {
        enemyActor.x = newPushX;
        enemyActor.y = newPushY;
        pushMessage = ` and knocked back to (${newPushX}, ${newPushY})!`;
      } else {
        pushMessage = ` (knockback slammed into arena wall)!`;
      }

      room.history.push(
        `💥 ${currentActor.name} struck ${enemyActor.name} for ${damageDealt} DMG${pushMessage} [${enemyActor.hp}/${enemyActor.maxHp} HP left]`
      );

      // Check for win condition
      if (enemyActor.hp <= 0) {
        room.status = 'ended';
        room.winner = currentActor.name;
        room.loser = enemyActor.name;
        stopRoomTimer(room);

        room.history.push(`🏆 ${currentActor.name} has emerged victorious in ${room.turnsPlayed} turns!`);

        try {
          recordMatchOutcome(room.winner, room.loser, room.turnsPlayed);
        } catch (dbErr) {
          console.error('Error recording match outcome:', dbErr);
        }

        io.to(roomId).emit('game_over', {
          winner: room.winner,
          loser: room.loser,
          turns: room.turnsPlayed
        });
      }
    } else {
      // Move action: requires 1 AP
      if (currentActor.ap < 1) {
        socket.emit('game_error', { message: 'Not enough Action Points! Moving requires 1 AP.' });
        return;
      }

      currentActor.ap -= 1;
      const prevX = currentActor.x;
      const prevY = currentActor.y;
      currentActor.x = tx;
      currentActor.y = ty;

      room.history.push(
        `🏃 ${currentActor.name} moved from (${prevX}, ${prevY}) to (${tx}, ${ty}). [${currentActor.ap} AP remaining]`
      );
    }

    io.to(roomId).emit('game_state', serializeRoom(room));
  });

  // Handle ending turn manually
  socket.on('end_turn', () => {
    const roomId = socket.roomId;
    const role = socket.playerRole;
    const room = rooms[roomId];

    if (!room || room.status !== 'playing') {
      return;
    }

    if (room.turn !== role) {
      socket.emit('game_error', { message: "It's not your turn to end." });
      return;
    }

    const currentActor = room.players[role];
    const nextRole = role === 'p1' ? 'p2' : 'p1';
    const nextActor = room.players[nextRole];

    // Switch turn
    room.turn = nextRole;
    room.turnTimeLeft = 30;
    room.turnsPlayed += 1;

    // Reset next player's AP to 3
    if (nextActor) {
      nextActor.ap = 3;
    }
    // Also reset current player AP so when their turn comes they have fresh AP
    if (currentActor) {
      currentActor.ap = 3;
    }

    room.history.push(`🔄 ${currentActor.name} ended turn. Turn ${room.turnsPlayed}: ${nextActor.name}'s turn.`);

    io.to(roomId).emit('game_state', serializeRoom(room));
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const roomId = socket.roomId;
    const role = socket.playerRole;
    const room = rooms[roomId];

    if (!room) return;

    if (room.status === 'playing') {
      room.status = 'ended';
      stopRoomTimer(room);

      const winnerRole = role === 'p1' ? 'p2' : 'p1';
      const winnerPlayer = room.players[winnerRole];
      const loserPlayer = room.players[role];

      room.winner = winnerPlayer ? winnerPlayer.name : 'Unknown';
      room.loser = loserPlayer ? loserPlayer.name : 'Unknown';

      room.history.push(`🚪 ${loserPlayer ? loserPlayer.name : 'A player'} disconnected. ${room.winner} wins by forfeit!`);

      try {
        recordMatchOutcome(room.winner, room.loser, room.turnsPlayed);
      } catch (dbErr) {
        console.error('Error recording disconnect outcome:', dbErr);
      }

      io.to(roomId).emit('game_over', {
        winner: room.winner,
        loser: room.loser,
        turns: room.turnsPlayed,
        reason: 'forfeit'
      });

      io.to(roomId).emit('game_state', serializeRoom(room));
    } else if (room.status === 'waiting') {
      // If waiting and player leaves, clean up
      if (room.players[role]) {
        room.history.push(`🚪 ${room.players[role].name} left the room.`);
        room.players[role] = null;
      }
      io.to(roomId).emit('game_state', serializeRoom(room));
    }

    // If both players are gone, remove room from memory
    const p1Gone = !room.players.p1 || room.players.p1.id === socket.id;
    const p2Gone = !room.players.p2 || room.players.p2.id === socket.id;
    if (p1Gone && p2Gone) {
      stopRoomTimer(room);
      delete rooms[roomId];
    }
  });
});

const startServer = () => {
  server.listen(PORT, () => {
    console.log(`Tactical Grid Duel server listening on port ${PORT}`);
  });
};

if (initPromise) {
  initPromise.then(startServer);
} else {
  startServer();
}
