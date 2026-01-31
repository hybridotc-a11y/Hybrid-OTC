
import React from 'react';
import { BacktestResult, AppTheme } from '../types';
import { Play, BarChart4, TrendingUp, TrendingDown, Target, ShieldCheck, Activity, RotateCcw } from 'lucide-react';

interface BacktestPanelProps {
  result: BacktestResult | null;
  isProcessing: boolean;
  onInitiate: () => void;
  theme: AppTheme;
}

const BacktestPanel: React.FC<BacktestPanelProps> = ({ result, isProcessing, onInitiate, theme }) => {
  const isLight = theme === 'LIGHT';

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart4 className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
          <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-zinc-500">Backtest Engine</span>
        </div>
        <button 
          onClick={onInitiate}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-orbitron text-[9px] font-black uppercase transition-all ${
            isProcessing 
            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
            : 'bg-cyan-600 text-white hover:bg-cyan-500 active:scale-95 shadow-lg shadow-cyan-600/20'
          }`}
        >
          {isProcessing ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
          {isProcessing ? 'CALCULATING...' : 'INITIATE QUANT BACKTEST'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        {result ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className={`grid grid-cols-2 gap-3 p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-black/40 border-white/5'}`}>
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase text-zinc-600">Win Rate</span>
                <div className={`text-2xl font-orbitron font-black ${result.winRate >= 60 ? 'text-emerald-500' : result.winRate >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {result.winRate.toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[8px] font-black uppercase text-zinc-600">Sim. P/L</span>
                <div className={`text-2xl font-orbitron font-black ${result.profitSimulation >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {result.profitSimulation > 0 ? '+' : ''}${result.profitSimulation.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total Trades', value: result.totalTrades, icon: Activity, color: 'text-cyan-500' },
                { label: 'Wins', value: result.wins, icon: TrendingUp, color: 'text-emerald-500' },
                { label: 'Losses', value: result.losses, icon: TrendingDown, color: 'text-rose-500' }
              ].map((stat, i) => (
                <div key={i} className={`p-3 rounded-xl border flex flex-col gap-1 ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-black/20 border-white/5'}`}>
                  <stat.icon className={`w-3 h-3 ${stat.color}`} />
                  <div className={`text-xs font-orbitron font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{stat.value}</div>
                  <div className="text-[7px] font-black uppercase text-zinc-600">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className={`p-4 rounded-xl border space-y-3 ${isLight ? 'bg-white border-slate-100' : 'bg-black/20 border-white/5'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3 text-amber-500" />
                  <span className="text-[8px] font-black uppercase text-zinc-500">Max Drawdown</span>
                </div>
                <span className="text-[9px] font-orbitron font-bold text-rose-400">{result.drawdown.toFixed(2)}%</span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, result.drawdown * 2)}%` }} />
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span className="text-[8px] font-black uppercase text-zinc-500">Best Streak</span>
                </div>
                <span className="text-[9px] font-orbitron font-bold text-emerald-400">{result.consecutiveWins} WINS</span>
              </div>
            </div>

            <div className={`p-3 rounded-lg text-[8px] italic leading-tight text-center border ${isLight ? 'bg-blue-50/50 border-blue-100 text-blue-800' : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400'}`}>
              "Backtest evaluated over {result.period} using the Neural Core Ensemble. Past performance does not guarantee broker behavior in real-time execution."
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3 py-10">
            <BarChart4 className="w-10 h-10 text-zinc-500" />
            <div className="text-center space-y-1">
              <span className="text-[9px] font-orbitron uppercase font-black tracking-[0.2em] text-zinc-500 block">Neural Simulation Offline</span>
              <p className="text-[8px] text-zinc-600 max-w-[200px] font-medium uppercase tracking-tight">Initiate to evaluate the core's structural win rate on {result?.symbol || 'current market'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BacktestPanel;
