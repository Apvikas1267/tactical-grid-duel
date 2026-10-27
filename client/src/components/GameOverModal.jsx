import React from 'react';
import { Trophy, Skull, RotateCcw, Home, Award } from 'lucide-react';

export default function GameOverModal({
  winner,
  loser,
  turns,
  reason,
  myUsername,
  onReturnToLobby,
  onPlayAgain
}) {
  const isWinner = winner && myUsername && winner.toLowerCase() === myUsername.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden">
        {/* Glow backdrop */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            isWinner ? 'bg-amber-500/20' : 'bg-rose-500/20'
          }`}
        />

        {/* Icon */}
        <div className="relative mb-5 flex justify-center">
          {isWinner ? (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-yellow-200 flex items-center justify-center shadow-xl shadow-amber-500/40 animate-bounce">
              <Trophy className="w-10 h-10 text-slate-950" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-700 to-red-500 border-2 border-red-300 flex items-center justify-center shadow-xl shadow-rose-500/40">
              <Skull className="w-10 h-10 text-white" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black tracking-tight text-white mb-2">
          {isWinner ? (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
              VICTORY ACHIEVED!
            </span>
          ) : (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-500">
              DEFEAT
            </span>
          )}
        </h2>

        <p className="text-sm text-slate-400 mb-6">
          {reason === 'forfeit'
            ? `${loser} disconnected. ${winner} claims victory by forfeit!`
            : isWinner
            ? `You dominated the tactical arena and eliminated ${loser}!`
            : `${winner} outmaneuvered you and claimed arena supremacy.`}
        </p>

        {/* Match Statistics Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3 text-left">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Winner
            </div>
            <div className="font-bold text-emerald-400 text-sm truncate flex items-center gap-1.5 mt-0.5">
              <Award className="w-4 h-4 shrink-0 text-amber-400" />
              {winner}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Total Turns
            </div>
            <div className="font-bold text-cyan-400 font-mono text-sm mt-0.5">
              {turns} Turns
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            type="button"
            onClick={onReturnToLobby}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-3 px-4 rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
}
