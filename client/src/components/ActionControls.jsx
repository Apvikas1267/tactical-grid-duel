import React from 'react';
import { RotateCcw, Zap, Swords, Footprints } from 'lucide-react';

export default function ActionControls({
  isMyTurn,
  currentAp,
  gameStatus,
  onEndTurn
}) {
  const canEndTurn = isMyTurn && gameStatus === 'playing';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
        <span>Action Command</span>
        <span className="text-amber-400 font-mono flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 fill-amber-400" />
          {currentAp} AP Available
        </span>
      </h3>

      <div className="space-y-3">
        {/* Action Quick Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div
            className={`p-2.5 rounded-xl border transition ${
              isMyTurn && currentAp >= 1
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Footprints className="w-4 h-4" /> Move (1 AP)
            </div>
            <p className="text-[11px] leading-tight text-slate-400">
              Click adjacent open green tile
            </p>
          </div>

          <div
            className={`p-2.5 rounded-xl border transition ${
              isMyTurn && currentAp >= 2
                ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Swords className="w-4 h-4" /> Strike (2 AP)
            </div>
            <p className="text-[11px] leading-tight text-slate-400">
              Click adjacent enemy red tile
            </p>
          </div>
        </div>

        {/* End Turn Button */}
        <button
          type="button"
          onClick={onEndTurn}
          disabled={!canEndTurn}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            canEndTurn
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-lg shadow-amber-950/50 hover:shadow-amber-500/20 active:scale-[0.98]'
              : 'bg-slate-800 text-slate-600 border border-slate-700/60 cursor-not-allowed opacity-60'
          }`}
        >
          <RotateCcw className={`w-4 h-4 ${canEndTurn ? 'animate-spin-slow' : ''}`} />
          <span>{canEndTurn ? 'End Turn' : "Opponent's Turn"}</span>
        </button>
      </div>
    </div>
  );
}
