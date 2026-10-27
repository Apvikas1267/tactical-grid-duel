const { getTopLeaderboard, getRecentMatches, initPromise } = require('./db');

async function viewDatabase() {
  if (initPromise) {
    await initPromise;
  }

  console.log('\n========================================');
  console.log('       TACTICAL GRID DUEL DATABASE      ');
  console.log('========================================\n');

  console.log('--- 🏆 PLAYERS LEADERBOARD TABLE ---');
  const players = await getTopLeaderboard(20);
  if (players.length === 0) {
    console.log('No players recorded yet.');
  } else {
    console.table(players);
  }

  console.log('\n--- ⚔️ MATCHES HISTORY TABLE ---');
  const matches = await getRecentMatches(20);
  if (matches.length === 0) {
    console.log('No matches played yet.');
  } else {
    console.table(matches);
  }

  console.log('========================================\n');
  process.exit(0);
}

viewDatabase().catch(console.error);
