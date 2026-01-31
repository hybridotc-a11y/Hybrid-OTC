
import React from 'react';
import { PredictionResult, AppTheme } from '../types';
import { TrendingUp, TrendingDown, Clock, ShieldCheck, Target } from 'lucide-react';

interface PredictionHistoryProps {
  history: PredictionResult[];
  theme: AppTheme;
}

const PredictionHistory: React.FC<PredictionHistoryProps> = ({ history, theme }) => {
  const isLight = theme === 'LIGHT';

  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
        <Target className="w-8 h-8 text-zinc-500" />
        <span className="text-[9px] font-orbitron uppercase font-black tracking-[0.2em] text-zinc-500">No archived signals found</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-2 space-y-2 pb-4">
      {history.map((item, idx) => (
        <div 
          key={idx} 
          className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-white/5 group ${
            isLight ? 'bg-slate-50 border-slate-100' : 'bg-black/20 border-white/5'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${
              item.direction === 'CALL' ? 'bg-emerald-500/10 text-emerald-500' : 
              item.direction === 'PUT' ? 'bg-rose-500/10 text-rose-500' : 
              'bg-zinc-500/10 text-zinc-500'
            }`}>
              {item.direction === 'CALL' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-orbitron font-black uppercase tracking-tighter ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {item.market}
                </span>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.marketType === 'OTC' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                  {item.marketType}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-[9px] font-bold text-zinc-500 tabular-nums">{item.timestamp}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-zinc-500" />
                  <span className="text-[9px] font-bold text-zinc-500">Exp: {item.recommendedExpiry}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-sm font-orbitron font-black ${
              item.probability >= 90 ? 'text-emerald-400' : 
              item.probability >= 80 ? 'text-cyan-400' : 
              'text-amber-400'
            }`}>
              {item.probability}%
            </div>
            <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">Confidence</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PredictionHistory;
