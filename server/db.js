const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const dbPath = path.join(__dirname, 'game.db');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let mode = 'sqlite';
let supabase = null;
let dbInstance = null;
let sqlJsDb = null;
let initPromise = null;

if (supabaseUrl && supabaseKey) {
  mode = 'supabase';
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[DB] Connected to Supabase Cloud PostgreSQL database.');
} else {
  // Try better-sqlite3 first
  try {
    const Database = require('better-sqlite3');
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        winner TEXT NOT NULL,
        loser TEXT NOT NULL,
        turns INTEGER NOT NULL,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[DB] Connected to SQLite via better-sqlite3 (WAL mode enabled).');
  } catch (err) {
    mode = 'sql.js';
    console.log('[DB] Initializing sql.js SQLite engine for game.db...');
    const initSqlJs = require('sql.js');
    initPromise = initSqlJs().then((SQL) => {
      let filebuffer = null;
      if (fs.existsSync(dbPath)) {
        filebuffer = fs.readFileSync(dbPath);
      }
      sqlJsDb = new SQL.Database(filebuffer);
      sqlJsDb.run('PRAGMA journal_mode = WAL;');
      sqlJsDb.run(`
        CREATE TABLE IF NOT EXISTS players (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          wins INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          winner TEXT NOT NULL,
          loser TEXT NOT NULL,
          turns INTEGER NOT NULL,
          played_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      saveSqlJsToDisk();
      console.log('[DB] Connected to SQLite via sql.js (game.db initialized).');
    });
  }
}

function saveSqlJsToDisk() {
  if (sqlJsDb) {
    try {
      const data = sqlJsDb.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    } catch (e) {
      console.error('[DB] Failed to save database to disk:', e);
    }
  }
}

// Transactional record match outcome
const recordMatchOutcome = async (winner, loser, totalTurns) => {
  if (!winner || !loser) return;

  if (mode === 'supabase' && supabase) {
    try {
      // 1. Insert match
      await supabase.from('matches').insert([{
        winner,
        loser,
        turns: totalTurns
      }]);

      // 2. Upsert winner
      const { data: winnerData } = await supabase.from('players').select('*').eq('username', winner).maybeSingle();
      if (winnerData) {
        await supabase.from('players').update({ wins: (winnerData.wins || 0) + 1 }).eq('username', winner);
      } else {
        await supabase.from('players').insert([{ username: winner, wins: 1, losses: 0 }]);
      }

      // 3. Upsert loser
      const { data: loserData } = await supabase.from('players').select('*').eq('username', loser).maybeSingle();
      if (loserData) {
        await supabase.from('players').update({ losses: (loserData.losses || 0) + 1 }).eq('username', loser);
      } else {
        await supabase.from('players').insert([{ username: loser, wins: 0, losses: 1 }]);
      }
    } catch (err) {
      console.error('[DB] Supabase recordMatchOutcome error:', err);
    }
    return;
  }

  if (dbInstance) {
    const insertMatch = dbInstance.prepare(`
      INSERT INTO matches (winner, loser, turns)
      VALUES (?, ?, ?)
    `);

    const upsertWinner = dbInstance.prepare(`
      INSERT INTO players (username, wins, losses)
      VALUES (?, 1, 0)
      ON CONFLICT(username) DO UPDATE SET wins = wins + 1
    `);

    const upsertLoser = dbInstance.prepare(`
      INSERT INTO players (username, wins, losses)
      VALUES (?, 0, 1)
      ON CONFLICT(username) DO UPDATE SET losses = losses + 1
    `);

    const transaction = dbInstance.transaction(() => {
      insertMatch.run(winner, loser, totalTurns);
      upsertWinner.run(winner);
      upsertLoser.run(loser);
    });

    transaction();
  } else if (sqlJsDb) {
    sqlJsDb.run('BEGIN TRANSACTION;');
    try {
      sqlJsDb.run('INSERT INTO matches (winner, loser, turns) VALUES (?, ?, ?);', [winner, loser, totalTurns]);
      
      const checkWinner = sqlJsDb.exec('SELECT id, wins FROM players WHERE username = ?', [winner]);
      if (checkWinner.length > 0 && checkWinner[0].values.length > 0) {
        sqlJsDb.run('UPDATE players SET wins = wins + 1 WHERE username = ?;', [winner]);
      } else {
        sqlJsDb.run('INSERT INTO players (username, wins, losses) VALUES (?, 1, 0);', [winner]);
      }

      const checkLoser = sqlJsDb.exec('SELECT id, losses FROM players WHERE username = ?', [loser]);
      if (checkLoser.length > 0 && checkLoser[0].values.length > 0) {
        sqlJsDb.run('UPDATE players SET losses = losses + 1 WHERE username = ?;', [loser]);
      } else {
        sqlJsDb.run('INSERT INTO players (username, wins, losses) VALUES (?, 0, 1);', [loser]);
      }

      sqlJsDb.run('COMMIT;');
      saveSqlJsToDisk();
    } catch (e) {
      sqlJsDb.run('ROLLBACK;');
      console.error('[DB] Transaction error in recordMatchOutcome:', e);
    }
  }
};

const getTopLeaderboard = async (limit = 10) => {
  if (mode === 'supabase' && supabase) {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('wins', { ascending: false })
        .order('losses', { ascending: true })
        .limit(Number(limit) || 10);

      if (error) throw error;
      return (data || []).map((p) => {
        const total = (p.wins || 0) + (p.losses || 0);
        const win_rate = total > 0 ? Number(((p.wins * 100.0) / total).toFixed(1)) : 0;
        return {
          id: p.id,
          username: p.username,
          wins: p.wins || 0,
          losses: p.losses || 0,
          win_rate
        };
      });
    } catch (err) {
      console.error('[DB] Supabase leaderboard error:', err);
      return [];
    }
  }

  if (dbInstance) {
    return dbInstance.prepare(`
      SELECT id, username, wins, losses,
             ROUND(CASE WHEN (wins + losses) > 0 THEN (wins * 100.0 / (wins + losses)) ELSE 0 END, 1) as win_rate
      FROM players
      ORDER BY wins DESC, losses ASC
      LIMIT ?
    `).all(limit);
  } else if (sqlJsDb) {
    const res = sqlJsDb.exec(`
      SELECT id, username, wins, losses,
             ROUND(CASE WHEN (wins + losses) > 0 THEN (wins * 100.0 / (wins + losses)) ELSE 0 END, 1) as win_rate
      FROM players
      ORDER BY wins DESC, losses ASC
      LIMIT ${Number(limit) || 10};
    `);

    if (res.length === 0) return [];
    const columns = res[0].columns;
    return res[0].values.map((row) => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  }
  return [];
};

const getRecentMatches = async (limit = 5) => {
  if (mode === 'supabase' && supabase) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('played_at', { ascending: false })
        .limit(Number(limit) || 5);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[DB] Supabase matches history error:', err);
      return [];
    }
  }

  if (dbInstance) {
    return dbInstance.prepare(`
      SELECT id, winner, loser, turns, played_at
      FROM matches
      ORDER BY played_at DESC, id DESC
      LIMIT ?
    `).all(limit);
  } else if (sqlJsDb) {
    const res = sqlJsDb.exec(`
      SELECT id, winner, loser, turns, played_at
      FROM matches
      ORDER BY played_at DESC, id DESC
      LIMIT ${Number(limit) || 5};
    `);

    if (res.length === 0) return [];
    const columns = res[0].columns;
    return res[0].values.map((row) => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  }
  return [];
};

module.exports = {
  recordMatchOutcome,
  getTopLeaderboard,
  getRecentMatches,
  initPromise
};
