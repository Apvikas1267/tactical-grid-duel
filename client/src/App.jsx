import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Copy, Check, Clock, AlertTriangle, LogOut, Shield, Swords } from 'lucide-react';
import Lobby from './components/Lobby';
import PlayerCard from './components/PlayerCard';
import GridArena from './components/GridArena';
import ActionControls from './components/ActionControls';
import MatchLogs from './components/MatchLogs';
import LeaderboardCard from './components/LeaderboardCard';
import GameOverModal from './components/GameOverModal';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('arena_username') || '');
  const [roomCode, setRoomCode] = useState('');
  const [inGame, setInGame] = useState(false);
  const [assignedRole, setAssignedRole] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [historyMatches, setHistoryMatches] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [gameOverData, setGameOverData] = useState(null);

  const socketRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  // Save username to local storage
  useEffect(() => {
    if (username) {
      localStorage.setItem('arena_username', username);
    }
  }, [username]);

  // Fetch SQLite leaderboard and history from server REST API
  const fetchLeaderboardAndHistory = async () => {
    setLoadingLeaderboard(true);
    try {
      const [lbRes, histRes] = await Promise.all([
        fetch(`${SERVER_URL}/api/leaderboard`),
        fetch(`${SERVER_URL}/api/history`)
      ]);
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        setLeaderboard(lbData);
      }
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistoryMatches(histData);
      }
    } catch (err) {
      console.warn('Could not fetch leaderboard data:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardAndHistory();
  }, []);

  const triggerErrorToast = (msg) => {
    setErrorMessage(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMessage(null);
    }, 3500);
  };

  // Join Game handler
  const handleJoinGame = (name, targetRoom) => {
    if (!socketRef.current || !socketRef.current.connected) {
      const socket = io(SERVER_URL, {
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('Connected to game server:', socket.id);
        socket.emit('join_game', { username: name, roomId: targetRoom });
      });

      socket.on('assigned_role', ({ role, roomId }) => {
        setAssignedRole(role);
        setInGame(true);
      });

      socket.on('game_state', (state) => {
        setGameState(state);
        if (state.status === 'ended' && state.winner) {
          setGameOverData({
            winner: state.winner,
            loser: state.loser,
            turns: state.turnsPlayed,
            reason: state.reason || 'elimination'
          });
          fetchLeaderboardAndHistory();
        }
      });

      socket.on('timer_tick', ({ turnTimeLeft, turn }) => {
        setGameState((prev) => (prev ? { ...prev, turnTimeLeft, turn } : prev));
      });

      socket.on('game_error', ({ message }) => {
        triggerErrorToast(message);
      });

      socket.on('game_over', (data) => {
        setGameOverData(data);
        fetchLeaderboardAndHistory();
      });

      socketRef.current = socket;
    } else {
      socketRef.current.emit('join_game', { username: name, roomId: targetRoom });
    }
  };

  // Tile click handler (Move / Strike)
  const handleTileClick = (targetX, targetY) => {
    if (!socketRef.current || !gameState || gameState.status !== 'playing') return;
    if (gameState.turn !== assignedRole) {
      triggerErrorToast("Wait for your turn!");
      return;
    }
    socketRef.current.emit('make_move', { targetX, targetY });
  };

  // End turn handler
  const handleEndTurn = () => {
    if (!socketRef.current || !gameState || gameState.status !== 'playing') return;
    if (gameState.turn !== assignedRole) {
      triggerErrorToast("It is not your turn!");
      return;
    }
    socketRef.current.emit('end_turn');
  };

  // Return to lobby
  const handleReturnToLobby = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setInGame(false);
    setAssignedRole(null);
    setGameState(null);
    setGameOverData(null);
    fetchLeaderboardAndHistory();
  };

  // Play Again
  const handlePlayAgain = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setGameState(null);
    setGameOverData(null);
    handleJoinGame(username, '');
  };

  const copyRoomCode = () => {
    if (!gameState?.roomId) return;
    navigator.clipboard.writeText(gameState.roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isMyTurn = gameState && gameState.turn === assignedRole;
  const myPlayer = gameState?.players?.[assignedRole];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {errorMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-rose-950/95 border-2 border-rose-500 text-rose-200 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md animate-shake text-xs md:text-sm font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {!inGame ? (
          <Lobby
            username={username}
            setUsername={setUsername}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            onJoinGame={handleJoinGame}
            leaderboard={leaderboard}
            historyMatches={historyMatches}
            loadingLeaderboard={loadingLeaderboard}
            onRefreshLeaderboard={fetchLeaderboardAndHistory}
          />
        ) : (
          <div className="max-w-7xl w-full mx-auto px-4 py-4 md:py-6 flex flex-col flex-1">
            {/* Top Tactical Status Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
              {/* Room Code Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Room:
                </span>
                <button
                  type="button"
                  onClick={copyRoomCode}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-700 hover:border-cyan-400 rounded-xl font-mono text-xs font-bold text-cyan-300 transition cursor-pointer"
                >
                  <span>{gameState?.roomId || 'Connecting...'}</span>
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Center Turn & Countdown Timer */}
              <div className="flex items-center gap-4">
                {gameState?.status === 'waiting' ? (
                  <div className="flex items-center gap-2 text-amber-400 text-xs md:text-sm font-bold animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    Waiting for opponent to connect...
                  </div>
                ) : (
                  <>
                    <div
                      className={`px-4 py-1.5 rounded-xl font-black text-xs md:text-sm tracking-wider uppercase flex items-center gap-2 shadow-md ${
                        isMyTurn
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-cyan-900/50 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isMyTurn ? (
                        <>
                          <Swords className="w-4 h-4 fill-white animate-bounce" />
                          <span>YOUR TURN</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>OPPONENT'S TURN</span>
                        </>
                      )}
                    </div>

                    {/* Autoritative Timer */}
                    <div
                      className={`flex items-center gap-1.5 font-mono text-sm md:text-base font-black px-3 py-1 rounded-xl border ${
                        (gameState?.turnTimeLeft ?? 30) <= 8
                          ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                          : 'bg-slate-950 border-slate-700 text-amber-400'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>{gameState?.turnTimeLeft ?? 30}s</span>
                    </div>

                    <div className="hidden sm:block text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      Turn #{gameState?.turnsPlayed || 1}
                    </div>
                  </>
                )}
              </div>

              {/* Leave Room Button */}
              <button
                type="button"
                onClick={handleReturnToLobby}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Duel</span>
              </button>
            </div>

            {/* Three-Column Arena Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
              {/* Left Column: Player Cards & Action Commands (3 cols) */}
              <div className="lg:col-span-3 space-y-4">
                <PlayerCard
                  player={gameState?.players?.p1}
                  role="p1"
                  isTurn={gameState?.turn === 'p1'}
                  isYou={assignedRole === 'p1'}
                  isWaiting={!gameState?.players?.p1}
                />

                <PlayerCard
                  player={gameState?.players?.p2}
                  role="p2"
                  isTurn={gameState?.turn === 'p2'}
                  isYou={assignedRole === 'p2'}
                  isWaiting={!gameState?.players?.p2}
                />

                <ActionControls
                  isMyTurn={isMyTurn}
                  currentAp={myPlayer?.ap || 0}
                  gameStatus={gameState?.status || 'waiting'}
                  onEndTurn={handleEndTurn}
                />
              </div>

              {/* Center Column: 5x5 Interactive Arena Grid (6 cols) */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center">
                <GridArena
                  p1={gameState?.players?.p1}
                  p2={gameState?.players?.p2}
                  currentTurnRole={gameState?.turn}
                  myRole={assignedRole}
                  isMyTurn={isMyTurn}
                  gameStatus={gameState?.status || 'waiting'}
                  onTileClick={handleTileClick}
                />
              </div>

              {/* Right Column: Real-time Matches Log & Live SQLite Leaderboard (3 cols) */}
              <div className="lg:col-span-3 space-y-4">
                <MatchLogs history={gameState?.history || []} />
                <LeaderboardCard
                  leaderboard={leaderboard}
                  historyMatches={historyMatches}
                  loading={loadingLeaderboard}
                  onRefresh={fetchLeaderboardAndHistory}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Game Over Modal Overlay */}
      {gameOverData && (
        <GameOverModal
          winner={gameOverData.winner}
          loser={gameOverData.loser}
          turns={gameOverData.turns}
          reason={gameOverData.reason}
          myUsername={username}
          onReturnToLobby={handleReturnToLobby}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
