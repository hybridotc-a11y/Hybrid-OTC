
import React, { useState, useEffect } from 'react';
import { MarketSymbol, PredictionResult, AppSettings, BrokerID, BROKER_DEFINITIONS, NeuralModelStatus, ExecutionState } from '../types';
import { Hourglass, Settings as SettingsIcon, Activity, AlertTriangle, Globe, Cpu, Fingerprint, Lock, Unlock, Clock, TrendingUp, TrendingDown, RefreshCcw, Timer, ShieldCheck, EyeOff, Zap, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PredictorDisplayProps {
  currentMarket: MarketSymbol;
  prediction: PredictionResult | null;
  neuralResults: NeuralModelStatus[];
  isScanning: boolean;
  onScan: () => void;
  onMarketChange: (market: MarketSymbol) => void;
  onBrokerChange: (broker: BrokerID) => void;
  settings: AppSettings;
  onOpenSettings: () => void;
}

const PredictorDisplay: React.FC<PredictorDisplayProps> = ({
  currentMarket,
  prediction,
  neuralResults,
  isScanning,
  onScan,
  onMarketChange,
  onBrokerChange,
  settings,
  onOpenSettings
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentState, setCurrentState] = useState<ExecutionState>('WAITING');
  
  const isLight = settings.theme === 'LIGHT';

  const EXECUTION_THEMES: Record<ExecutionState, { bg: string, text: string, accent: string, icon: any, label: string }> = {
    WAITING: { bg: isLight ? 'bg-amber-50' : 'bg-amber-600/10', text: isLight ? 'text-amber-700' : 'text-amber-500', accent: isLight ? 'border-amber-200' : 'border-amber-500/30', icon: Clock, label: 'SYNCING ALGO' },
    PRIME_WINDOW: { bg: 'bg-emerald-600', text: 'text-white', accent: 'border-emerald-400', icon: Unlock, label: 'PRIME EXECUTION' },
    VOLATILITY_EXPANSION: { bg: 'bg-orange-600', text: 'text-white', accent: 'border-orange-400', icon: Zap, label: 'SHARP MOVEMENT PERIOD' },
    DECAYING: { bg: 'bg-zinc-800', text: 'text-zinc-400', accent: 'border-zinc-700', icon: Hourglass, label: 'ALGO RESET' },
    EXPIRED: { bg: 'bg-rose-950', text: 'text-rose-200', accent: 'border-rose-900', icon: AlertTriangle, label: 'SETUP VOID' },
    BLOCKED: { bg: 'bg-rose-600', text: 'text-white', accent: 'border-rose-400', icon: Lock, label: 'STRUCTURALLY INVALID' },
    MANIPULATION_HIGH: { bg: 'bg-purple-600', text: 'text-white', accent: 'border-purple-400', icon: EyeOff, label: 'MANIPULATION DETECTED' }
  };

  const theme = EXECUTION_THEMES[currentState];

  useEffect(() => {
    if (prediction) {
      setCountdown(prediction.expectedEntryCountdown);
      setCurrentState(prediction.executionState);
    } else {
      setCurrentState('WAITING');
      setCountdown(null);
    }
  }, [prediction]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          if (prediction?.sharpMovementProbability && prediction.sharpMovementProbability > 80) {
              setCurrentState('VOLATILITY_EXPANSION');
          } else {
              setCurrentState('PRIME_WINDOW');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown, prediction]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isLight ? 'text-orange-600' : 'text-orange-500'}`} />
          <h2 className={`font-orbitron font-black text-[10px] tracking-[0.2em] ${isLight ? 'text-slate-400' : 'text-zinc-500'} uppercase`}>Volatility Forecast Engine</h2>
        </div>
        <button onClick={onOpenSettings} className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-500">
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>

      <div className={`w-full py-4 px-6 rounded-2xl flex items-center justify-between transition-all duration-500 border-l-4 shadow-xl ${theme.bg} ${theme.accent} ${theme.text}`}>
        <div className="flex items-center gap-4">
          <theme.icon className={`w-5 h-5 ${currentState === 'VOLATILITY_EXPANSION' ? 'animate-bounce' : 'animate-pulse'}`} />
          <div className="flex flex-col">
            <span className="font-orbitron font-black text-[10px] tracking-widest uppercase">{theme.label}</span>
            <span className="text-[8px] font-mono opacity-70 uppercase">
              {currentState === 'VOLATILITY_EXPANSION' ? 'High Velocity Move Inbound' : 'Decoding Liquidity Voids'}
            </span>
          </div>
        </div>
        {countdown !== null && countdown > 0 && (
          <div className="flex flex-col items-end">
             <div className="text-2xl font-orbitron font-black tabular-nums tracking-tighter">{countdown}s</div>
             <div className="text-[7px] font-black uppercase tracking-tighter opacity-70">Window Open</div>
          </div>
        )}
      </div>

      <div className={`rounded-[2.5rem] p-6 border transition-all duration-500 shadow-2xl relative overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-zinc-950/90 border-white/5'}`}>
        {isScanning && <div className="scanner-line bg-orange-500 shadow-[0_0_20px_#f59e0b]" />}
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <select value={settings.activeBroker} onChange={(e) => onBrokerChange(e.target.value as BrokerID)} className={`w-full py-3 px-4 rounded-xl font-orbitron font-bold text-[8px] tracking-widest appearance-none border outline-none ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/60 border-zinc-800 text-white'}`}>
              {Object.entries(BROKER_DEFINITIONS).map(([id, def]) => <option key={id} value={id}>{def.name}</option>)}
            </select>
            <select value={currentMarket} onChange={(e) => onMarketChange(e.target.value as MarketSymbol)} className={`w-full py-3 px-4 rounded-xl font-orbitron font-bold text-[8px] tracking-widest appearance-none border outline-none ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/60 border-zinc-800 text-white'}`}>
              {settings.enabledSymbols.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className={`rounded-[2rem] border p-6 min-h-[400px] flex flex-col relative ${isLight ? 'bg-slate-50/50' : 'bg-black/40 border-white/5'}`}>
            {prediction ? (
              <div className="w-full space-y-6">
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <div className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Bias</div>
                    <div className={`flex items-center gap-2 text-5xl font-orbitron font-black ${prediction.direction === 'CALL' ? 'text-emerald-500' : prediction.direction === 'PUT' ? 'text-rose-500' : 'text-zinc-500'}`}>
                      {prediction.direction === 'CALL' ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                      {prediction.direction}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Forecast Vol.</div>
                    <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/40 text-orange-400 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span className="text-xl font-orbitron font-black">{prediction.sharpMovementProbability}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 rounded-xl border border-white/5 bg-zinc-900/40">
                      <div className="text-[7px] font-black uppercase mb-1 text-zinc-600">Precise Entry</div>
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                        <div className="text-xs font-orbitron font-bold text-white tabular-nums">{prediction.preciseEntry.toFixed(5)}</div>
                      </div>
                   </div>
                   <div className="p-3 rounded-xl border border-white/5 bg-zinc-900/40">
                      <div className="text-[7px] font-black uppercase mb-1 text-zinc-600">Precise Exit</div>
                      <div className="flex items-center gap-2">
                        <ArrowDownRight className="w-3 h-3 text-rose-500" />
                        <div className="text-xs font-orbitron font-bold text-white tabular-nums">{prediction.preciseExit.toFixed(5)}</div>
                      </div>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-zinc-600">
                      <div className="flex items-center gap-2"><Target className="w-3 h-3 text-orange-500" /> Structural Window</div>
                      <span className="text-orange-500">{prediction.edgeHalfLife}s Rem.</span>
                   </div>
                   <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${(prediction.edgeHalfLife / 60) * 100}%` }} />
                   </div>
                </div>

                <div className="p-4 rounded-xl border border-white/5 bg-black/40 italic text-[10px] leading-relaxed text-zinc-400">
                  "Strategy: {prediction.analysis.substring(0, 120)}..."
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-6 h-full opacity-20">
                <Target className="w-16 h-16 animate-pulse text-zinc-500" />
                <div className="text-center font-orbitron text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500">Scanning Volatility Surface</div>
              </div>
            )}
          </div>

          <button onClick={onScan} disabled={isScanning} className={`w-full py-5 rounded-2xl font-orbitron font-black text-[11px] tracking-widest uppercase flex items-center justify-center gap-3 transition-all ${isScanning ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-500 shadow-2xl active:scale-[0.98]'}`}>
            {isScanning ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-5 h-5" />}
            {isScanning ? 'Mapping Liquidity...' : 'Execute Volatility Forecast'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredictorDisplay;
