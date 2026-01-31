import React from 'react';
import { GlobalMarketStatus, AppTheme } from '../types';
import { Globe, Clock, ShieldAlert, Zap } from 'lucide-react';

interface MarketSessionsProps {
  status: GlobalMarketStatus;
  theme: AppTheme;
}

const MarketSessions: React.FC<MarketSessionsProps> = ({ status, theme }) => {
  const now = new Date();
  const day = now.getUTCDay();
  const isWeekend = day === 0 || day === 6;

  const isLight = theme === 'LIGHT';
  const isMidnight = theme === 'MIDNIGHT';

  return (
    <div className={`w-full border rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row items-center gap-4 lg:gap-8 justify-between relative transition-all duration-700 ${
      isMidnight ? 'bg-zinc-950/80 border-white/5' :
      isLight ? 'bg-white border-slate-200 shadow-sm' : 
      'bg-slate-900/40 border-slate-800'
    }`}>
      <div className="flex items-center gap-3 shrink-0">
        <div className={`p-2 rounded-lg transition-colors duration-500 ${isLight ? 'bg-cyan-50' : 'bg-cyan-500/10'}`}>
          <Globe className="w-4 h-4 text-cyan-500" />
        </div>
        <div>
          <h3 className={`font-orbitron text-[9px] font-black uppercase tracking-widest leading-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Market Network</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className={`w-3 h-3 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
            <span className={`text-[10px] font-bold tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>UTC {now.getUTCHours()}:00</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-wrap justify-center gap-4">
        {status.sessions.map((session) => (
          <div key={session.name} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500 ${
            isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-black/40'
          } ${session.status === 'CLOSED' ? 'opacity-30 grayscale' : ''}`}>
             <div className={`w-1.5 h-1.5 rounded-full ${session.status === 'OPEN' ? session.color + ' animate-pulse shadow-[0_0_10px_rgba(0,255,255,0.5)]' : isLight ? 'bg-slate-300' : 'bg-zinc-800'}`}></div>
             <span className={`text-[9px] font-black uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>{session.name}</span>
             <span className={`text-[9px] font-bold ${session.status === 'OPEN' ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-300' : 'text-zinc-700')}`}>{session.status}</span>
          </div>
        ))}
      </div>

      <div className={`flex items-center gap-4 shrink-0 p-2 rounded-xl border transition-all duration-500 ${
        isLight ? 'bg-slate-50 border-slate-100' : 'bg-black/20 border-white/5'
      }`}>
        <div className="flex flex-col items-end">
           <span className={`text-[8px] font-black uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>Session Bias</span>
           <div className={`text-[10px] font-black uppercase flex items-center gap-1.5 ${
             status.currentVolatilityBias === 'HIGH' ? 'text-rose-500' : 
             status.currentVolatilityBias === 'MEDIUM' ? 'text-amber-500' : 
             'text-cyan-500'
           }`}>
              <Zap className="w-3 h-3" /> {status.currentVolatilityBias} VOL
           </div>
        </div>
        <div className={`h-8 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-zinc-800'}`}></div>
        <p className={`text-[10px] leading-tight italic max-w-[220px] ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
          "{status.recommendation}"
        </p>
      </div>

      {isWeekend && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-1 bg-amber-500 text-black rounded-full font-orbitron font-black text-[8px] tracking-[0.2em] shadow-lg shadow-amber-500/20">
          <ShieldAlert className="w-3 h-3" /> WEEKEND PROTOCOL
        </div>
      )}
    </div>
  );
};

export default MarketSessions;