import React, { useState } from 'react';
import { Swords, Shield, Zap, Trophy, Play, Users, Sparkles, AlertCircle } from 'lucide-react';

export default function Lobby({
  username,
  setUsername,
  roomCode,
  setRoomCode,
  onJoinGame,
  leaderboard,
  historyMatches,
  loadingLeaderboard,
  onRefreshLeaderboard
}) {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [validationError, setValidationError] = useState('');

  const handleStart = (customRoom) => {
    if (!username.trim()) {
      setValidationError('Please enter your warrior callsign/name first!');
      return;
    }
    setValidationError('');
    onJoinGame(username.trim(), customRoom ? roomCode.trim() : '');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
          Server-Authoritative Anti-Cheat 1v1 Arena
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
          TACTICAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">GRID DUEL</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
          Outmaneuver and destroy your opponent on a 5x5 combat grid. Manage Action Points, execute precision strikes, and force-push enemies into walls.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Matchmaking Card */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Swords className="w-5 h-5 text-cyan-400" />
              Arena Deployment
            </h2>

            {validationError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                  Commander Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder="Enter your callsign (e.g. Phoenix)"
                    maxLength={16}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  />
                  <div className="absolute right-3 top-3 text-xs text-slate-500">
                    {username.length}/16
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                  Room Code (Optional)
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Leave blank for Quick Match or enter code"
                  maxLength={12}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition uppercase tracking-widest font-mono"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => handleStart(false)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 px-6 rounded-xl transition duration-200 shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
                  <span>Quick Match</span>
                </button>

                {roomCode.trim() && (
                  <button
                    type="button"
                    onClick={() => handleStart(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold py-3.5 px-6 rounded-xl border border-cyan-800/60 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Users className="w-5 h-5" />
                    <span>Join Room</span>
                  </button>
                )}
              </div>
            </div>

            {/* Combat Mechanics Cheat Sheet */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Arena Rules & Protocol
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="font-semibold text-cyan-400 flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> 3 AP / Turn
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Moving costs 1 AP. Striking costs 2 AP. Resets every turn.
                  </p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="font-semibold text-rose-400 flex items-center gap-1.5 mb-1">
                    <Swords className="w-3.5 h-3.5 text-rose-400" /> Strike & Push
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Adjacent strikes deal 2 DMG and force-knockback the target!
                  </p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" /> 10 Max HP
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    First commander to reduce enemy HP to 0 claims glory.
                  </p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                    <span className="text-amber-400">⏱️</span> 30s Turn Limit
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Server enforces strict countdown. Inaction forfeits remaining AP.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live SQLite Leaderboard & History */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Database Rankings</h2>
              </div>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    activeTab === 'leaderboard'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Leaderboard
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Recent Matches
                </button>
              </div>
            </div>

            {loadingLeaderboard ? (
              <div className="py-12 text-center text-slate-500 text-sm animate-pulse">
                Syncing SQLite database records...
              </div>
            ) : activeTab === 'leaderboard' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Warrior</th>
                      <th className="py-2.5 px-3 text-center">Wins</th>
                      <th className="py-2.5 px-3 text-center">Losses</th>
                      <th className="py-2.5 px-3 text-right">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {leaderboard && leaderboard.length > 0 ? (
                      leaderboard.map((player, idx) => (
                        <tr
                          key={player.id || idx}
                          className="hover:bg-slate-800/40 transition"
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-200">
                            {player.username}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                            {player.wins}
                          </td>
                          <td className="py-2.5 px-3 text-center text-rose-400">
                            {player.losses}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-cyan-400">
                            {player.win_rate != null ? `${player.win_rate}%` : '0%'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No matches recorded yet. Be the first to win!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">Winner</th>
                      <th className="py-2.5 px-3">Loser</th>
                      <th className="py-2.5 px-3 text-center">Turns</th>
                      <th className="py-2.5 px-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {historyMatches && historyMatches.length > 0 ? (
                      historyMatches.map((m, idx) => (
                        <tr key={m.id || idx} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 font-semibold text-emerald-400 flex items-center gap-1.5">
                            <span className="text-xs">🏆</span> {m.winner}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {m.loser}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-cyan-400">
                            {m.turns}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px]">
                            {m.played_at ? new Date(m.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          No recent matches in history database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
              <span>Backed by better-sqlite3 in WAL mode</span>
              <button
                type="button"
                onClick={onRefreshLeaderboard}
                className="text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
