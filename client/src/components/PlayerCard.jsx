import React from 'react';
import { Shield, Zap, Crosshair, UserCheck, Heart } from 'lucide-react';

export default function PlayerCard({
  player,
  role,
  isTurn,
  isYou,
  isWaiting
}) {
  const isP1 = role === 'p1';
  const roleColor = isP1 ? 'blue' : 'rose';
  const roleBorder = isP1 ? 'border-blue-500' : 'border-rose-500';
  const roleBg = isP1 ? 'bg-blue-950/40' : 'bg-rose-950/40';
  const roleText = isP1 ? 'text-blue-400' : 'text-rose-400';
  const roleGradient = isP1
    ? 'from-blue-600 to-cyan-500'
    : 'from-rose-600 to-amber-500';

  if (!player || isWaiting) {
    return (
      <div className={`p-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center min-h-[160px] text-center`}>
        <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 mb-2 animate-pulse">
          <UserCheck className="w-5 h-5" />
        </div>
        <p className="text-xs uppercase font-bold tracking-wider text-slate-400">
          {role.toUpperCase()} Slot Open
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Awaiting challenger to connect...
        </p>
      </div>
    );
  }

  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));

  return (
    <div
      className={`relative p-5 rounded-2xl border transition-all duration-300 backdrop-blur-md ${
        isTurn
          ? `${roleBorder} ${roleBg} shadow-lg ${
              isP1 ? 'shadow-blue-900/40' : 'shadow-rose-900/40'
            } ring-2 ${isP1 ? 'ring-blue-400/50' : 'ring-rose-400/50'}`
          : 'border-slate-800 bg-slate-900/80 shadow-md'
      }`}
    >
      {/* Active Turn Badge */}
      {isTurn && (
        <div
          className={`absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r ${roleGradient} shadow-sm animate-pulse`}
        >
          Active Turn
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-inner ${
              isP1
                ? 'bg-gradient-to-br from-blue-500 to-indigo-700 shadow-blue-400/30'
                : 'bg-gradient-to-br from-rose-500 to-red-700 shadow-rose-400/30'
            }`}
          >
            {role.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base tracking-tight truncate max-w-[140px]">
                {player.name}
              </h3>
              {isYou && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-cyan-950 border border-cyan-800 text-cyan-400 uppercase">
                  You
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <Crosshair className="w-3 h-3 text-slate-500" />
              <span>Grid Pos: ({player.x}, {player.y})</span>
            </div>
          </div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            Health
          </span>
          <span className="font-mono font-bold text-white">
            {player.hp} / {player.maxHp} HP
          </span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              hpPercent > 50
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : hpPercent > 20
                ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                : 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Action Points (AP) */}
      <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <Zap className="w-4 h-4 fill-amber-400" />
          <span>Action Points</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((pip) => {
            const isFilled = pip <= player.ap;
            return (
              <div
                key={pip}
                className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-black transition-all ${
                  isFilled
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/50 scale-105'
                    : 'bg-slate-800 text-slate-600 border border-slate-700'
                }`}
              >
                {pip}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
