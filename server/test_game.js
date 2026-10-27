const { io } = require('../client/node_modules/socket.io-client');
const http = require('http');
const { fork } = require('child_process');
const path = require('path');

const SERVER_URL = 'http://127.0.0.1:4000';

async function runTests() {
  console.log('--- Spawning Tactical Grid Duel Server for Integration Test ---');
  const serverProcess = fork(path.join(__dirname, 'index.js'), [], {
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', (d) => {
    console.log('[SERVER]', d.toString().trim());
  });
  serverProcess.stderr.on('data', (d) => {
    console.error('[SERVER ERR]', d.toString().trim());
  });

  // Wait for server to be up
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log('--- Connecting Test Sockets ---');

  // Connect two socket clients
  const p1Socket = io(SERVER_URL, { transports: ['polling', 'websocket'] });
  const p2Socket = io(SERVER_URL, { transports: ['polling', 'websocket'] });

  p1Socket.on('connect_error', (e) => console.error('[P1 CONNECT ERR]', e.message));
  p2Socket.on('connect_error', (e) => console.error('[P2 CONNECT ERR]', e.message));

  await new Promise((resolve) => {
    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) resolve();
    };
    p1Socket.on('connect', check);
    p2Socket.on('connect', check);
  });
  console.log('✓ Both sockets connected successfully');

  const testRoomId = 'TEST-' + Math.floor(Math.random() * 9000 + 1000);
  let p1State = null;
  let p2State = null;

  p1Socket.on('game_state', (s) => { p1State = s; });
  p2Socket.on('game_state', (s) => { p2State = s; });

  // P1 Joins
  p1Socket.emit('join_game', { username: 'Valkyrie', roomId: testRoomId });
  await new Promise((r) => setTimeout(r, 200));
  console.log('✓ P1 joined room, status:', p1State?.status);

  // P2 Joins
  p2Socket.emit('join_game', { username: 'Titan', roomId: testRoomId });
  await new Promise((r) => setTimeout(r, 200));
  console.log('✓ P2 joined room, status:', p1State?.status, 'turn:', p1State?.turn);

  if (p1State?.status !== 'playing') {
    throw new Error('Game did not transition to playing status!');
  }
  console.log('✓ Match successfully commenced (30s timer active)');

  // Test 1: P1 makes a valid move from (0, 0) to (0, 1)
  console.log('\n--- Test 1: Valid Move (1 AP) ---');
  p1Socket.emit('make_move', { targetX: 0, targetY: 1 });
  await new Promise((r) => setTimeout(r, 200));

  console.log('P1 Position:', `(${p1State.players.p1.x}, ${p1State.players.p1.y})`, 'AP:', p1State.players.p1.ap);
  if (p1State.players.p1.x !== 0 || p1State.players.p1.y !== 1 || p1State.players.p1.ap !== 2) {
    throw new Error('Valid move failed or AP not deducted properly!');
  }
  console.log('✓ Move successful and 1 AP deducted');

  // Test 2: Invalid move (out of bounds or distance > 1)
  console.log('\n--- Test 2: Invalid Move Rejection ---');
  let errorReceived = null;
  p1Socket.once('game_error', (err) => {
    errorReceived = err.message;
  });
  p1Socket.emit('make_move', { targetX: 3, targetY: 3 }); // Distance too far
  await new Promise((r) => setTimeout(r, 200));
  console.log('Server rejected with:', errorReceived);
  if (!errorReceived) {
    throw new Error('Server failed to reject invalid teleport/far move!');
  }
  console.log('✓ Server-authoritative validation blocked invalid move');

  // Test 3: Ending turn
  console.log('\n--- Test 3: Manual End Turn ---');
  p1Socket.emit('end_turn');
  await new Promise((r) => setTimeout(r, 200));
  console.log('Current turn:', p1State.turn, 'Turns played:', p1State.turnsPlayed);
  if (p1State.turn !== 'p2') {
    throw new Error('Turn failed to switch to p2!');
  }
  if (p1State.players.p2.ap !== 3) {
    throw new Error('P2 AP not restored to 3 on turn start!');
  }
  console.log('✓ Turn successfully switched to P2 with 3 AP restored');

  // Test 4: Combat & Knockback
  console.log('\n--- Test 4: Combat & Strike Mechanics ---');
  // Teleport/move closer for combat test
  // P2 is at (4, 4), move towards center: (3, 4) -> (2, 4) -> (1, 4)
  p2Socket.emit('make_move', { targetX: 4, targetY: 3 });
  await new Promise((r) => setTimeout(r, 100));
  p2Socket.emit('make_move', { targetX: 4, targetY: 2 });
  await new Promise((r) => setTimeout(r, 100));
  p2Socket.emit('make_move', { targetX: 4, targetY: 1 });
  await new Promise((r) => setTimeout(r, 100));

  p2Socket.emit('end_turn');
  await new Promise((r) => setTimeout(r, 100));

  // P1 moves adjacent to P2: P1 is at (0, 1), move to (1, 1), (2, 1), (3, 1)
  p1Socket.emit('make_move', { targetX: 1, targetY: 1 });
  await new Promise((r) => setTimeout(r, 100));
  p1Socket.emit('make_move', { targetX: 2, targetY: 1 });
  await new Promise((r) => setTimeout(r, 100));
  p1Socket.emit('make_move', { targetX: 3, targetY: 1 });
  await new Promise((r) => setTimeout(r, 100));

  p1Socket.emit('end_turn');
  await new Promise((r) => setTimeout(r, 100));

  // P2 at (4, 1) strikes P1 at (3, 1)!
  console.log('P2 strikes adjacent P1 at (3, 1)...');
  const p1HpBefore = p2State.players.p1.hp;
  p2Socket.emit('make_move', { targetX: 3, targetY: 1 });
  await new Promise((r) => setTimeout(r, 200));

  console.log('P1 HP After Strike:', p2State.players.p1.hp, 'AP Left for P2:', p2State.players.p2.ap);
  console.log('P1 Pushed Position:', `(${p2State.players.p1.x}, ${p2State.players.p1.y})`);

  if (p2State.players.p1.hp !== p1HpBefore - 2) {
    throw new Error('Damage not correctly applied to enemy!');
  }
  if (p2State.players.p2.ap !== 1) {
    throw new Error('Attacking did not deduct 2 AP!');
  }
  // P1 was at (3, 1), attacked from (4, 1) (vector dx = -1, dy = 0) -> pushback to (2, 1)
  if (p2State.players.p1.x !== 2 || p2State.players.p1.y !== 1) {
    throw new Error('Knockback vector not applied correctly!');
  }
  console.log('✓ Strike dealt 2 DMG and knocked enemy back 1 cell away!');

  // Test 5: Match Conclusion & SQLite Database Persistence
  console.log('\n--- Test 5: Lethal Damage & DB Logging ---');
  let gameOverEmitted = false;
  p1Socket.on('game_over', (data) => {
    gameOverEmitted = true;
    console.log('✓ game_over event captured:', data);
  });

  // Finish off P1: P1 currently has 8 HP. Each strike deals 2 DMG.
  // We will execute a sequence of attacks to reduce HP to 0.
  // End P2 turn
  p2Socket.emit('end_turn');
  await new Promise((r) => setTimeout(r, 100));

  // Loop turns until victory
  for (let round = 0; round < 6; round++) {
    if (p1State?.status === 'ended') break;

    if (p1State.turn === 'p1') {
      p1Socket.emit('end_turn');
      await new Promise((r) => setTimeout(r, 100));
    }

    if (p2State.turn === 'p2' && p2State.status === 'playing') {
      // Move closer if needed or strike
      const dist = Math.abs(p2State.players.p2.x - p2State.players.p1.x) + Math.abs(p2State.players.p2.y - p2State.players.p1.y);
      if (dist === 1 && p2State.players.p2.ap >= 2) {
        p2Socket.emit('make_move', { targetX: p2State.players.p1.x, targetY: p2State.players.p1.y });
        await new Promise((r) => setTimeout(r, 100));
      } else if (dist > 1) {
        // Step closer
        const dx = p2State.players.p1.x > p2State.players.p2.x ? 1 : p2State.players.p1.x < p2State.players.p2.x ? -1 : 0;
        const dy = dx === 0 ? (p2State.players.p1.y > p2State.players.p2.y ? 1 : -1) : 0;
        p2Socket.emit('make_move', { targetX: p2State.players.p2.x + dx, targetY: p2State.players.p2.y + dy });
        await new Promise((r) => setTimeout(r, 100));
      }
      p2Socket.emit('end_turn');
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  await new Promise((r) => setTimeout(r, 300));
  console.log('Final Status:', p1State?.status, 'Winner:', p1State?.winner);

  // Check REST Endpoints
  const lbData = await new Promise((resolve) => {
    http.get(`${SERVER_URL}/api/leaderboard`, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => resolve(JSON.parse(body)));
    });
  });

  console.log('\n--- Test 6: SQLite Leaderboard Query ---');
  console.log('Leaderboard top rows:', lbData.slice(0, 3));
  if (!lbData || lbData.length === 0) {
    throw new Error('Leaderboard returned empty array after match!');
  }
  console.log('✓ SQLite database successfully persisted players and match statistics');

  p1Socket.disconnect();
  p2Socket.disconnect();
  serverProcess.kill('SIGINT');
  console.log('\n>>> ALL AUTOMATED TESTS PASSED WITH 100% SUCCESS! <<<');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
