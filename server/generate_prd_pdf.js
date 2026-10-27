const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'Tactical_Grid_Duel_PRD.pdf');

// Create document
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Color Palette
const PRIMARY = '#0f172a';    // Slate 900
const ACCENT = '#0284c7';     // Cyan/Sky 600
const SECONDARY = '#334155';  // Slate 700
const TEXT = '#1e293b';       // Slate 800
const MUTED = '#64748b';      // Slate 500
const LIGHT_BG = '#f1f5f9';   // Slate 100
const BORDER = '#cbd5e1';     // Slate 300

// Helper functions for styling
function drawHeaderBadge(text) {
  doc.fontSize(9).font('Helvetica-Bold').fillColor(ACCENT);
  doc.text(text.toUpperCase(), { characterSpacing: 1.5 });
  doc.moveDown(0.3);
}

function drawH1(text) {
  doc.fontSize(22).font('Helvetica-Bold').fillColor(PRIMARY);
  doc.text(text);
  doc.moveDown(0.2);
  doc.strokeColor(ACCENT).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.8);
}

function drawH2(text) {
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica-Bold').fillColor(ACCENT);
  doc.text(text);
  doc.moveDown(0.2);
  doc.strokeColor(BORDER).lineWidth(0.8).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
}

function drawH3(text) {
  doc.moveDown(0.3);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(PRIMARY);
  doc.text(text);
  doc.moveDown(0.2);
}

function drawParagraph(text) {
  doc.fontSize(9.5).font('Helvetica').fillColor(TEXT).lineGap(2.5);
  doc.text(text, { align: 'justify' });
  doc.moveDown(0.5);
}

function drawBullet(title, desc) {
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(PRIMARY).text(`•  ${title}: `, { continued: true });
  doc.font('Helvetica').fillColor(TEXT).text(desc);
  doc.moveDown(0.3);
}

function drawCallout(text, title = 'NOTE') {
  const startY = doc.y;
  doc.rect(50, startY, 495, 32).fill(LIGHT_BG);
  doc.strokeColor(ACCENT).lineWidth(3).moveTo(50, startY).lineTo(50, startY + 32).stroke();
  doc.fillColor(ACCENT).fontSize(8.5).font('Helvetica-Bold').text(`  ${title}: `, 60, startY + 8, { continued: true });
  doc.fillColor(SECONDARY).font('Helvetica').text(text);
  doc.y = startY + 40;
}

function drawTable(headers, rows, colWidths) {
  const startX = 50;
  let currentY = doc.y;

  // Header background
  doc.rect(startX, currentY, 495, 20).fill(PRIMARY);
  
  let currentX = startX;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
  headers.forEach((h, i) => {
    doc.text(h, currentX + 6, currentY + 5, { width: colWidths[i] - 12, align: 'left' });
    currentX += colWidths[i];
  });

  currentY += 20;

  // Rows
  rows.forEach((row, rowIndex) => {
    // Check if new page needed
    if (currentY > 740) {
      doc.addPage();
      currentY = 50;
    }

    const rowBg = rowIndex % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(startX, currentY, 495, 20).fill(rowBg);

    currentX = startX;
    doc.font('Helvetica').fontSize(8.5).fillColor(TEXT);
    row.forEach((cell, i) => {
      doc.text(String(cell), currentX + 6, currentY + 5, { width: colWidths[i] - 12, align: 'left' });
      currentX += colWidths[i];
    });

    currentY += 20;
  });

  doc.strokeColor(BORDER).lineWidth(0.5).rect(startX, doc.y, 495, currentY - doc.y).stroke();
  doc.y = currentY + 10;
}

// ==========================================
// DOCUMENT CONTENT
// ==========================================

// --- COVER / HEADER ---
drawHeaderBadge('Product Requirements Document (PRD) — Release v1.0.0');
drawH1('Tactical Grid Duel');

doc.fontSize(11).font('Helvetica-Bold').fillColor(SECONDARY)
   .text('1v1 Turn-Based Server-Authoritative Grid Arena Game');
doc.fontSize(9).font('Helvetica').fillColor(MUTED)
   .text('Author: Lead System Architect & Engineering Team  |  Date: October 2026  |  Status: Production Ready');
doc.moveDown(0.8);

// Meta table
drawTable(
  ['Project Metadata', 'Specification Details'],
  [
    ['Application Type', 'Full-Stack Real-Time Multiplayer Web Application'],
    ['Frontend Architecture', 'React 18 + Vite + Tailwind CSS + Lucide Icons + Socket.io-Client'],
    ['Backend Architecture', 'Node.js 20+ / Express 5 + Socket.io 4 (Persistent WebSockets)'],
    ['Database Infrastructure', 'Hybrid: SQLite (WAL mode, game.db) / Supabase Cloud PostgreSQL'],
    ['Deployment Targets', 'Vercel (Client Edge Network) + Render.com (WebSocket Web Service)'],
    ['Security / Anti-Cheat', '100% Server-Authoritative Game Mechanics & Turn Validation']
  ],
  [160, 335]
);

// --- 1. EXECUTIVE SUMMARY & PRODUCT VISION ---
drawH2('1. Executive Summary & Product Vision');
drawParagraph(
  'Tactical Grid Duel is a competitive, high-stakes 1v1 turn-based grid arena game designed for instant web browser execution across mobile devices and desktop computers. Traditional browser-based games frequently suffer from client-side tampering, state desynchronization, high latency, or cumbersome onboarding. Tactical Grid Duel solves these issues through a 100% server-authoritative architecture where all movements, Action Point (AP) deductions, damage calculations, and vector knockback physics are verified by a centralized Node.js engine before broadcast.'
);
drawBullet('Core Value Proposition', 'Accessible zero-install PvP tactical arena with zero-lag WebSocket synchronization and seamless cross-device compatibility.');
drawBullet('Anti-Cheat Guarantee', 'The browser client functions purely as a dumb terminal / presentation layer; all game states and timers reside authoritatively on the server.');

// --- 2. TARGET AUDIENCE & USER PERSONAS ---
drawH2('2. Target Audience & User Personas');
drawBullet('The Competitive Strategist (Alex, 24)', 'Values quick tactical depth, calculated risk vs. reward, and zero-cheat transparency in a competitive environment.');
drawBullet('The Casual Browser Duelist (Sam, 19)', 'Seeks instant 3-minute battles against friends across mobile and desktop without account creation friction.');

// --- 3. CORE GAME MECHANICS SPECIFICATION ---
doc.addPage();
drawH2('3. Core Game Mechanics & Rules Engine');
drawParagraph(
  'The game environment consists of a discrete 5x5 matrix (coordinates X: 0-4, Y: 0-4). Two commanders are deployed in diagonally opposing corners and compete to eliminate the opponent.'
);

drawTable(
  ['Metric / Rule', 'Specification', 'Server-Side Rule Enforcement'],
  [
    ['Arena Bounds', '5x5 Grid (Tiles A1 to E5)', 'Coordinate clamp 0 <= X <= 4 and 0 <= Y <= 4.'],
    ['Starting Positions', 'P1: (0, 0) | P2: (4, 4)', 'Auto-assigned upon room initialization.'],
    ['Health Points (HP)', '10 Max HP per player', 'Target HP <= 0 triggers terminal win condition.'],
    ['Action Points (AP)', '3 AP replenished per turn', 'Non-accumulative; unspent AP expires at turn end.'],
    ['Movement Cost', '1 AP per step', 'Validates Manhattan Distance (|dx| + |dy| == 1).'],
    ['Strike Attack Cost', '2 AP per strike', 'Deals 2 DMG + calculates vector knockback.'],
    ['Knockback Vector', 'Delta direction: (tx - x, ty - y)', 'Pushes target 1 cell away or wall-slams.'],
    ['Turn Time Limit', '30 Seconds strict', 'Server interval auto-switches turn on timeout.']
  ],
  [120, 160, 215]
);

drawCallout(
  'Knockback Physics Formula: When Actor A at (x1, y1) attacks Actor B at (x2, y2), the knockback destination is calculated as: target = (x2 + (x2 - x1), y2 + (y2 - y1)). If target is outside the 5x5 grid, the knockback slams into the wall without displacement.',
  'VECTOR KNOCKBACK SPECIFICATION'
);

// --- 4. FUNCTIONAL REQUIREMENTS (FR) ---
drawH2('4. Functional Requirements');

drawH3('FR-1: Matchmaking & Room Management');
drawParagraph('Users can initiate a Quick Match or enter a custom Room Code. The server maintains in-memory room objects with a strict 2-player capacity limit. The duel commences automatically upon the arrival of the second player.');

drawH3('FR-2: Server-Authoritative Movement & AP Consumption');
drawParagraph('Upon receiving a move request, the server verifies active turn status, AP balance (>= 1 AP), and adjacent cell legality. If valid, the position is updated, AP is decremented, and the updated state is broadcast to the room.');

drawH3('FR-3: Combat & Lethal Damage Calculation');
drawParagraph('Adjacent enemy targeting triggers an attack. The server deducts 2 AP, subtracts 2 HP from the victim, and computes the directional knockback. If enemy HP reaches 0, the game transitions to "ended" and awards the victory.');

drawH3('FR-4: Disconnection & Forfeiture Handling');
drawParagraph('If an active player abruptly disconnects during gameplay, the server automatically declares the remaining player the winner by forfeit and commits the outcome to the persistent database.');

drawH3('FR-5: Real-Time Combat Feed');
drawParagraph('Every verified action generates an immutable event log entry (movement, strike, timeout, knockback) broadcast to all room participants and rendered in a real-time terminal feed.');

// --- 5. SYSTEM ARCHITECTURE & NETWORK TOPOLOGY ---
doc.addPage();
drawH2('5. System Architecture & Network Topology');

drawTable(
  ['Layer / Tier', 'Technology', 'Hosting / Runtime', 'Operational Purpose'],
  [
    ['Client (UI)', 'React 18 + Vite', 'Vercel Edge Network', 'Reactive UI, tactical grid rendering, sound/animations.'],
    ['Network Protocol', 'Socket.io 4 + HTTP', 'TLS / WSS over port 443', 'Bi-directional duplex messaging under 50ms latency.'],
    ['Application Tier', 'Node.js + Express 5', 'Render.com (Web Service)', 'Authoritative game state machine, timers, room memory.'],
    ['Persistence Tier', 'Supabase Cloud (PostgreSQL)', 'AWS Cloud Managed', 'Global ranking tables, historical match storage.'],
    ['Local Fallback', 'SQLite (WAL Mode)', 'Local Disk (game.db)', 'Zero-network local development and offline testing.']
  ],
  [95, 120, 130, 150]
);

drawH3('Real-Time Socket Event Protocol Specification');
drawTable(
  ['Event Name', 'Direction', 'Payload Signature', 'Description'],
  [
    ['join_game', 'Client -> Server', '{ username, roomId }', 'Requests placement into an arena room.'],
    ['assigned_role', 'Server -> Client', '{ role: "p1"|"p2", roomId }', 'Confirms role assignment to user socket.'],
    ['game_state', 'Server -> Client', '{ players, turn, turnTimeLeft, ... }', 'Authoritative state broadcast to all room peers.'],
    ['make_move', 'Client -> Server', '{ targetX, targetY }', 'Dispatches move or strike action to server.'],
    ['end_turn', 'Client -> Server', 'void', 'Manually concludes turn and resets AP.'],
    ['timer_tick', 'Server -> Client', '{ turnTimeLeft, turn }', 'Synchronizes 1-second authoritative timer.'],
    ['game_error', 'Server -> Client', '{ message: string }', 'Emitted when an invalid/illegal move is attempted.'],
    ['game_over', 'Server -> Client', '{ winner, loser, turns, reason }', 'Terminates match and shows victory modal.']
  ],
  [85, 95, 155, 160]
);

// --- 6. DATA MODEL & SCHEMA SPECIFICATION ---
drawH2('6. Data Model & Database Schema Specification');
drawParagraph('The database supports dual engines: Cloud PostgreSQL (via Supabase) for live production and SQLite (via better-sqlite3 / sql.js) for local development.');

drawH3('Table: players');
drawTable(
  ['Field Name', 'Data Type', 'Constraints', 'Description'],
  [
    ['id', 'BIGSERIAL / INTEGER', 'PRIMARY KEY', 'Unique player surrogate identifier.'],
    ['username', 'TEXT / VARCHAR', 'UNIQUE NOT NULL', 'Unique commander callsign.'],
    ['wins', 'INTEGER', 'DEFAULT 0', 'Total cumulative victories.'],
    ['losses', 'INTEGER', 'DEFAULT 0', 'Total cumulative defeats.']
  ],
  [90, 110, 110, 185]
);

drawH3('Table: matches');
drawTable(
  ['Field Name', 'Data Type', 'Constraints', 'Description'],
  [
    ['id', 'BIGSERIAL / INTEGER', 'PRIMARY KEY', 'Unique match record identifier.'],
    ['winner', 'TEXT', 'NOT NULL', 'Username of winning commander.'],
    ['loser', 'TEXT', 'NOT NULL', 'Username of defeated commander.'],
    ['turns', 'INTEGER', 'NOT NULL', 'Total turns elapsed before match conclusion.'],
    ['played_at', 'TIMESTAMP / DATETIME', 'DEFAULT NOW()', 'Exact timestamp of match completion.']
  ],
  [90, 110, 110, 185]
);

// --- 7. NON-FUNCTIONAL REQUIREMENTS ---
doc.addPage();
drawH2('7. Non-Functional Requirements (NFR)');

drawBullet('NFR-1: Latency & Response Budget', 'Round-trip time for validated moves must not exceed 60ms over standard broadband or 4G LTE connections.');
drawBullet('NFR-2: Security & Zero-Trust Client Model', 'No game parameter (HP, AP, position, timer) can be mutated via client payload. Server performs 100% parameter validation.');
drawBullet('NFR-3: Cross-Device Responsiveness', 'Fully responsive viewports across standard mobile smartphones (375px+), tablets, and widescreen desktop monitors (1920x1080).');
drawBullet('NFR-4: Fault Tolerance & Reconnection', 'Graceful room cleanup upon socket dropouts; automatic database retry with exponential backoff on network blips.');

// --- 8. UI/UX DESIGN & INTERACTION SPECIFICATIONS ---
drawH2('8. UI/UX Design & Layout Architecture');
drawParagraph('The client follows a high-contrast Cyber-Tactical dark aesthetic utilizing Tailwind CSS color palettes:');

drawBullet('Lobby Interface', 'Minimalist deployment panel with Commander Name input, optional Room Code field, Quick Match button, rules cheat sheet, and live SQLite/Supabase leaderboard preview.');
drawBullet('Left Panel (Status & Controls)', 'Player 1 and Player 2 cards displaying animated HP bars, 3 AP diamond indicators, coordinates, turn-active glowing halos, and manual End Turn button.');
drawBullet('Center Panel (5x5 Arena Grid)', 'Tactical grid with alphanumeric coordinates (A-E, 1-5). Dynamic tile colorization: Emerald green hover for legal movement (1 AP), Rose red hover for adjacent enemy strike (2 AP). Top bar features big countdown timer and copyable room code.');
drawBullet('Right Panel (Telemetry & Rankings)', 'Real-time combat history feed with color-coded events (movement, attacks, knockbacks, timeouts) and searchable live database leaderboard.');
drawBullet('Game Over Modal', 'Full-screen backdrop blur modal rendering Victory Trophy or Defeat Skull, match statistics, and one-click "Play Again" or "Return to Lobby" triggers.');

// --- 9. FUTURE PRODUCT ROADMAP ---
drawH2('9. Product Evolution & Future Roadmap');
drawTable(
  ['Version Milestone', 'Target Capabilities', 'Status / Release Target'],
  [
    ['v1.0.0 (Current)', 'Core 1v1 Arena, Server-Authoritative Engine, Supabase/SQLite Hybrid, Vercel/Render Deploy.', 'Production Released'],
    ['v1.1.0', 'Destructible terrain cover, randomized obstacle walls, and energy hazards on grid.', 'Planned Q1 2027'],
    ['v1.2.0', 'Solo AI Commander mode using Minimax with Alpha-Beta pruning for offline play.', 'Planned Q2 2027'],
    ['v1.3.0', 'Web Audio API procedural sound effects, haptic vibration on mobile, and particle trails.', 'Planned Q2 2027'],
    ['v2.0.0', 'Ranked ELO competitive matchmaking ladder, commander classes, and custom abilities.', 'Planned Q3 2027']
  ],
  [100, 260, 135]
);

drawCallout(
  'Tactical Grid Duel is verified and released for production deployment across Vercel (Client) and Render (Server) with active Supabase cloud persistence.',
  'VERIFICATION & DEPLOYMENT STATUS'
);

// --- FOOTER & PAGE NUMBERS ---
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fontSize(8).font('Helvetica').fillColor(MUTED);
  doc.text(
    'Tactical Grid Duel — Product Requirements Document (PRD)',
    50,
    792 - 35,
    { align: 'left', width: 250 }
  );
  doc.text(
    `Page ${i + 1} of ${range.count}`,
    545 - 100,
    792 - 35,
    { align: 'right', width: 100 }
  );
}

// Finalize
doc.end();

stream.on('finish', () => {
  console.log(`PRD PDF generated successfully at: ${outputPath}`);
});
