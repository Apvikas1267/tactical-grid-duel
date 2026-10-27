import React, { useState } from 'react';
import { Footprints, Swords, Shield, Crosshair, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export default function GridArena({
  p1,
  p2,
  currentTurnRole,
  myRole,
  isMyTurn,
  gameStatus,
  onTileClick
}) {
  const [hoveredTile, setHoveredTile] = useState(null);

  const gridSize = 5;
  const colLabels = ['A', 'B', 'C', 'D', 'E'];
  const rowLabels = ['1', '2', '3', '4', '5'];

  const myPlayer = myRole === 'p1' ? p1 : myRole === 'p2' ? p2 : null;
  const enemyPlayer = myRole === 'p1' ? p2 : myRole === 'p2' ? p1 : null;

  // Helper to determine tile state
  const getTileState = (x, y) => {
    const isP1Here = p1 && p1.x === x && p1.y === y;
    const isP2Here = p2 && p2.x === x && p2.y === y;

    let isAdjacentToMe = false;
    let actionType = null; // 'move' | 'attack' | null

    if (myPlayer && isMyTurn && gameStatus === 'playing') {
      const manhattanDist = Math.abs(myPlayer.x - x) + Math.abs(myPlayer.y - y);
      if (manhattanDist === 1) {
        isAdjacentToMe = true;
        if (enemyPlayer && enemyPlayer.x === x && enemyPlayer.y === y) {
          actionType = 'attack';
        } else if (!isP1Here && !isP2Here) {
          actionType = 'move';
        }
      }
    }

    return {
      isP1Here,
      isP2Here,
      isAdjacentToMe,
      actionType
    };
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Grid Wrapper with Tactical Coordinates */}
      <div className="relative p-3 md:p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl">
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-cyan-500/5 to-rose-500/5 rounded-3xl pointer-events-none" />

        {/* Top Coordinate Header (A-E) */}
        <div className="grid grid-cols-5 gap-2 md:gap-3 mb-2 px-6">
          {colLabels.map((col) => (
            <div
              key={col}
              className="text-center font-mono text-xs font-bold text-slate-500"
            >
              {col}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Left Coordinate Sidebar (1-5) */}
          <div className="flex flex-col gap-2 md:gap-3 justify-around py-1">
            {rowLabels.map((row) => (
              <div
                key={row}
                className="w-4 text-center font-mono text-xs font-bold text-slate-500"
              >
                {row}
              </div>
            ))}
          </div>

          {/* 5x5 Matrix of Tiles */}
          <div className="grid grid-cols-5 gap-2 md:gap-3 p-1">
            {Array.from({ length: gridSize }).map((_, y) =>
              Array.from({ length: gridSize }).map((_, x) => {
                const { isP1Here, isP2Here, isAdjacentToMe, actionType } = getTileState(x, y);
                const isHovered = hoveredTile && hoveredTile.x === x && hoveredTile.y === y;

                // Color and border styles based on action type
                let cellStyle = 'bg-slate-950/80 border-slate-800 hover:border-slate-700';
                let cursorStyle = 'cursor-default';

                if (isAdjacentToMe) {
                  if (actionType === 'move') {
                    cellStyle =
                      'bg-emerald-950/30 border-emerald-500/60 hover:bg-emerald-900/40 hover:border-emerald-400 shadow-sm shadow-emerald-950';
                    cursorStyle = 'cursor-pointer hover:scale-105';
                  } else if (actionType === 'attack') {
                    cellStyle =
                      'bg-rose-950/40 border-rose-500/80 hover:bg-rose-900/50 hover:border-rose-400 shadow-md shadow-rose-950 ring-2 ring-rose-500/40 animate-pulse';
                    cursorStyle = 'cursor-pointer hover:scale-105';
                  }
                }

                return (
                  <button
                    key={`${x}-${y}`}
                    type="button"
                    onClick={() => {
                      if (isAdjacentToMe && actionType) {
                        onTileClick(x, y);
                      }
                    }}
                    onMouseEnter={() => setHoveredTile({ x, y, actionType })}
                    onMouseLeave={() => setHoveredTile(null)}
                    disabled={!isAdjacentToMe || !actionType}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center p-1 focus:outline-none ${cellStyle} ${cursorStyle}`}
                  >
                    {/* Background Grid Pattern Crosshair */}
                    <div className="absolute top-1 left-1 text-[8px] font-mono text-slate-700">
                      {colLabels[x]}{rowLabels[y]}
                    </div>

                    {/* Interactive Action Prompt Icons on Valid Hover */}
                    {isAdjacentToMe && !isP1Here && !isP2Here && (
                      <div className="flex flex-col items-center justify-center text-emerald-400 opacity-80 hover:opacity-100">
                        <Footprints className="w-5 h-5 mb-0.5 animate-bounce" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          1 AP
                        </span>
                      </div>
                    )}

                    {/* Player 1 Token */}
                    {isP1Here && (
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-9 h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-400 border-2 border-cyan-300 flex items-center justify-center shadow-lg shadow-blue-500/50 transition-transform ${
                            currentTurnRole === 'p1' ? 'scale-110 ring-4 ring-cyan-400/40 animate-pulse' : ''
                          }`}
                        >
                          <Shield className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow" />
                        </div>
                        <div className="mt-1 px-1.5 py-0.2 bg-blue-950/90 border border-blue-600 rounded text-[9px] font-black tracking-wider text-cyan-300 uppercase">
                          P1 {myRole === 'p1' ? '(YOU)' : ''}
                        </div>
                      </div>
                    )}

                    {/* Player 2 Token */}
                    {isP2Here && (
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-9 h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 rounded-xl bg-gradient-to-tr from-rose-700 to-amber-500 border-2 border-rose-300 flex items-center justify-center shadow-lg shadow-rose-500/50 transition-transform ${
                            currentTurnRole === 'p2' ? 'scale-110 ring-4 ring-rose-400/40 animate-pulse' : ''
                          }`}
                        >
                          <Crosshair className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow" />
                        </div>
                        <div className="mt-1 px-1.5 py-0.2 bg-rose-950/90 border border-rose-600 rounded text-[9px] font-black tracking-wider text-rose-300 uppercase">
                          P2 {myRole === 'p2' ? '(YOU)' : ''}
                        </div>
                      </div>
                    )}

                    {/* Attack Overlay on Enemy Square */}
                    {isAdjacentToMe && actionType === 'attack' && (
                      <div className="absolute inset-0 bg-rose-600/30 rounded-2xl flex items-center justify-center z-20 pointer-events-none">
                        <div className="flex flex-col items-center bg-rose-950/95 border border-rose-500 px-2 py-0.5 rounded-lg shadow-lg">
                          <Swords className="w-4 h-4 text-rose-400 animate-pulse" />
                          <span className="text-[9px] font-black text-rose-300 uppercase tracking-tight">
                            STRIKE 2 AP
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Action Guidance Footer Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Adjacent Green = Move (1 AP)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Target Red = Strike + Push (2 AP)
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            5×5 Grid (0–4 Bounds)
          </span>
        </div>
      </div>
    </div>
  );
}
