import React, { useState } from 'react';
import { Trophy, RefreshCw, History } from 'lucide-react';

export default function LeaderboardCard({
  leaderboard,
  historyMatches,
  loading,
  onRefresh
}) {
  const [tab, setTab] = useState('rankings');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col h-[280px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            SQLite Scoreboard
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setTab('rankings')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                tab === 'rankings'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ranks
            </button>
            <button
              type="button"
              onClick={() => setTab('matches')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                tab === 'matches'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recent
            </button>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh database records"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 animate-pulse">
            Querying SQLite database...
          </div>
        ) : tab === 'rankings' ? (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase border-b border-slate-800/80">
                <th className="py-1 px-1">#</th>
                <th className="py-1 px-1">Player</th>
                <th className="py-1 px-1 text-center">W/L</th>
                <th className="py-1 px-1 text-right">Win%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.slice(0, 8).map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-800/30">
                    <td className="py-1.5 px-1 font-mono text-[11px] text-slate-500">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="py-1.5 px-1 font-semibold text-slate-200 truncate max-w-[80px]">
                      {p.username}
                    </td>
                    <td className="py-1.5 px-1 text-center font-mono text-[11px]">
                      <span className="text-emerald-400">{p.wins}</span>/
                      <span className="text-rose-400">{p.losses}</span>
                    </td>
                    <td className="py-1.5 px-1 text-right font-mono text-cyan-400 text-[11px]">
                      {p.win_rate != null ? `${p.win_rate}%` : '0%'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500 text-xs italic">
                    No ranks logged yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase border-b border-slate-800/80">
                <th className="py-1 px-1">Winner</th>
                <th className="py-1 px-1">Loser</th>
                <th className="py-1 px-1 text-right">Turns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {historyMatches && historyMatches.length > 0 ? (
                historyMatches.map((m, idx) => (
                  <tr key={m.id || idx} className="hover:bg-slate-800/30">
                    <td className="py-1.5 px-1 font-semibold text-emerald-400 truncate max-w-[80px]">
                      {m.winner}
                    </td>
                    <td className="py-1.5 px-1 text-slate-400 truncate max-w-[80px]">
                      {m.loser}
                    </td>
                    <td className="py-1.5 px-1 text-right font-mono text-cyan-400 text-[11px]">
                      {m.turns}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-500 text-xs italic">
                    No match records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
