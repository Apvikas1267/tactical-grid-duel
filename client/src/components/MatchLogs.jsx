import React, { useEffect, useRef } from 'react';
import { ScrollText } from 'lucide-react';

export default function MatchLogs({ history }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col h-[280px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Matches Log (Real-Time)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {history.length} Events
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs select-text"
      >
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
            Awaiting battle engagements...
          </div>
        ) : (
          history.map((log, index) => {
            let textColor = 'text-slate-300';
            let bgGlow = 'bg-slate-950/60 border-slate-800';

            if (log.includes('struck') || log.includes('DMG')) {
              textColor = 'text-rose-300';
              bgGlow = 'bg-rose-950/30 border-rose-900/50';
            } else if (log.includes('moved')) {
              textColor = 'text-cyan-300';
              bgGlow = 'bg-cyan-950/20 border-cyan-900/40';
            } else if (log.includes('timed out') || log.includes('⏰')) {
              textColor = 'text-amber-300';
              bgGlow = 'bg-amber-950/30 border-amber-900/40';
            } else if (log.includes('victorious') || log.includes('🏆')) {
              textColor = 'text-emerald-300 font-bold';
              bgGlow = 'bg-emerald-950/40 border-emerald-700/60';
            }

            return (
              <div
                key={index}
                className={`p-2 rounded-lg border leading-relaxed break-words ${bgGlow} ${textColor}`}
              >
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
