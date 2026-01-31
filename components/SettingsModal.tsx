
import React, { useState } from 'react';
import { X, Settings, Palette, Sparkles, Volume2, LineChart, Activity, Hash, Eye, Cpu, BrainCircuit, Info } from 'lucide-react';
import { AppSettings, ALL_SYMBOLS, MarketSymbol, AppTheme, PredictionResult } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  prediction?: PredictionResult | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, prediction }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });

  if (!isOpen) return null;

  const toggleSymbol = (symbol: MarketSymbol) => {
    setLocalSettings(prev => ({
      ...prev,
      enabledSymbols: prev.enabledSymbols.includes(symbol)
        ? prev.enabledSymbols.filter(s => s !== symbol)
        : [...prev.enabledSymbols, symbol]
    }));
  };

  const toggleNeuralModel = (modelName: string) => {
    setLocalSettings(prev => ({
      ...prev,
      enabledNeuralModels: prev.enabledNeuralModels.includes(modelName)
        ? prev.enabledNeuralModels.filter(m => m !== modelName)
        : [...prev.enabledNeuralModels, modelName]
    }));
  };

  const toggleIndicator = (key: keyof AppSettings['indicators']) => {
    setLocalSettings(prev => ({
      ...prev,
      indicators: {
        ...prev.indicators,
        [key]: !prev.indicators[key]
      }
    }));
  };

  const isLight = localSettings.theme === 'LIGHT';
  const isMidnight = localSettings.theme === 'MIDNIGHT';

  const cryptoTickers = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOT', 'DOGE', 'LINK', 'MATIC', 'PEPE', 'SHIB', 'LTC', 'AVAX', 'TRX', 'UNI'];
  
  const cryptoSymbols = ALL_SYMBOLS.filter(s => 
    !s.includes('OTC') && cryptoTickers.some(t => s.startsWith(t))
  );
  
  const otcSymbols = ALL_SYMBOLS.filter(s => s.includes('OTC'));
  
  const commoditySymbols = ALL_SYMBOLS.filter(s => 
    !s.includes('OTC') && (s.startsWith('XAU') || s.startsWith('XAG'))
  );

  const forexSymbols = ALL_SYMBOLS.filter(s => 
    !s.includes('OTC') && !cryptoSymbols.includes(s) && !commoditySymbols.includes(s)
  );

  const neuralOptions = [
    { id: 'FOREST-ENSEMBLE', label: 'Forest Ensemble', desc: 'Robust random forest classifier' },
    { id: 'TF-LSTM', label: 'TF LSTM', desc: 'Long Short-Term Memory sequence model' }
  ];

  const indicatorList = [
      { key: 'rsi', label: 'RSI' },
      { key: 'macd', label: 'MACD' },
      { key: 'bollingerBands', label: 'Bollinger' },
      { key: 'ichimoku', label: 'Ichimoku' },
      { key: 'vwap', label: 'VWAP' },
      { key: 'atr', label: 'ATR' },
      { key: 'smc', label: 'SMC' },
      { key: 'vsa', label: 'VSA' },
      { key: 'liquidity', label: 'Liquidity' },
      { key: 'manipulationOverlay', label: 'Manipulation' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full max-w-2xl border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-500 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0a0a0a] border-white/10'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center transition-colors duration-500 ${
          isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-zinc-900/50'
        }`}>
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-cyan-500" />
            <h2 className={`font-orbitron text-lg font-black tracking-widest uppercase transition-colors duration-500 ${isLight ? 'text-slate-900' : 'text-white'}`}>System Configuration</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-500/10 rounded-full transition-colors">
            <X className={`w-5 h-5 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          
          <section className="space-y-4">
            <label className={`flex items-center gap-2 font-orbitron text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
              <Sparkles className="w-3 h-3 text-cyan-500" /> Intelligence Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    onClick={() => setLocalSettings(p => ({ ...p, deepThinking: !p.deepThinking }))}
                    className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all ${
                        localSettings.deepThinking ? (isLight ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-purple-500/10 border-purple-500/50 text-purple-400') : (isLight ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-black/40 border-zinc-800 text-zinc-500')
                    }`}
                >
                    <div className="flex justify-between items-center w-full">
                        <Sparkles className="w-4 h-4" />
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${localSettings.deepThinking ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${localSettings.deepThinking ? 'right-0.5' : 'left-0.5'}`} />
                        </div>
                    </div>
                    <span className="font-orbitron text-[10px] font-black uppercase">Thinking Protocol</span>
                </button>

                <button
                    onClick={() => setLocalSettings(p => ({ ...p, autoVoice: !p.autoVoice }))}
                    className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all ${
                        localSettings.autoVoice ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400') : (isLight ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-black/40 border-zinc-800 text-zinc-500')
                    }`}
                >
                    <div className="flex justify-between items-center w-full">
                        <Volume2 className="w-4 h-4" />
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${localSettings.autoVoice ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${localSettings.autoVoice ? 'right-0.5' : 'left-0.5'}`} />
                        </div>
                    </div>
                    <span className="font-orbitron text-[10px] font-black uppercase">Voice Narrator</span>
                </button>
            </div>
          </section>

          <section className="space-y-4">
            <label className={`flex items-center gap-2 font-orbitron text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
              <BrainCircuit className="w-3 h-3 text-cyan-500" /> Local Neural Core (TFJS)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {neuralOptions.map((model) => {
                const isActive = localSettings.enabledNeuralModels.includes(model.id);
                return (
                  <button
                    key={model.id}
                    onClick={() => toggleNeuralModel(model.id)}
                    className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all text-left group ${
                      isActive 
                        ? (isLight ? 'bg-cyan-50 border-cyan-400 text-cyan-700 shadow-md' : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]') 
                        : (isLight ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-black/40 border-zinc-800 text-zinc-500')
                    }`}
                  >
                    <div className="flex justify-between items-center w-full mb-1">
                      <span className="font-orbitron text-[10px] font-black uppercase tracking-wider">{model.label}</span>
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${isActive ? 'bg-cyan-500' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'right-0.5' : 'left-0.5'}`} />
                      </div>
                    </div>
                    <p className="text-[8px] font-medium opacity-60 leading-tight">{model.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <label className={`flex items-center gap-2 font-orbitron text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                <Eye className="w-3 h-3 text-cyan-500" /> Neural Lens & Indicators
              </label>
              <button 
                onClick={() => setLocalSettings(p => ({ ...p, autoIndicators: !p.autoIndicators }))}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[8px] font-black uppercase transition-all ${
                  localSettings.autoIndicators 
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' 
                  : 'bg-zinc-500/5 border-white/5 text-zinc-500'
                }`}
              >
                <Sparkles className="w-3 h-3" /> Auto-Adaptive: {localSettings.autoIndicators ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 transition-all`}>
                {indicatorList.map((item) => {
                    const isActive = localSettings.indicators[item.key as keyof AppSettings['indicators']];
                    return (
                        <button
                            key={item.key}
                            onClick={() => toggleIndicator(item.key as any)}
                            className={`flex flex-col gap-2 p-3 rounded-xl border transition-all text-left relative overflow-hidden group/item ${
                                isActive 
                                ? (isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-500') 
                                : (isLight ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-black/40 border-zinc-800 text-zinc-500')
                            }`}
                        >
                            <span className="font-orbitron text-[8px] font-black uppercase leading-tight flex items-center gap-1">
                              {item.label}
                              {localSettings.autoIndicators && (
                                <Sparkles className="w-2 h-2 opacity-50 group-hover/item:opacity-100 transition-opacity" />
                              )}
                            </span>
                            <div className={`w-6 h-3 rounded-full relative transition-colors ${isActive ? 'bg-cyan-500' : 'bg-zinc-700'}`}>
                                <div className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${isActive ? 'right-0.5' : 'left-0.5'}`} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {prediction?.indicatorReasoning && (
              <div className={`p-4 rounded-2xl border ${isLight ? 'bg-cyan-50/50 border-cyan-100' : 'bg-cyan-500/5 border-cyan-500/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-3 h-3 text-cyan-500" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-cyan-500">Neural Selection Logic</span>
                </div>
                <ul className="space-y-1">
                  {prediction.indicatorReasoning.map((reason, i) => (
                    <li key={i} className="text-[9px] text-zinc-500 italic flex gap-2">
                      <span className="text-cyan-500 opacity-50">•</span> {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <label className={`flex items-center gap-2 font-orbitron text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
              <Palette className="w-3 h-3 text-cyan-500" /> Interface Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['MIDNIGHT', 'DARK', 'LIGHT'] as AppTheme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setLocalSettings(prev => ({ ...prev, theme: t }))}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                    localSettings.theme === t 
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-500 shadow-lg' 
                      : (isLight ? 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700')
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    localSettings.theme === t ? 'scale-110 border-cyan-500' : 'border-transparent'
                  } ${t === 'MIDNIGHT' ? 'bg-black' : t === 'DARK' ? 'bg-slate-900' : 'bg-white'}`} />
                  <span className="font-orbitron text-[9px] font-black tracking-widest">{t}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <label className={`flex items-center gap-2 font-orbitron text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
              <Hash className="w-3 h-3 text-cyan-500" /> Market Watchlist
            </label>
            
            <div className="space-y-6">
              {[
                { title: 'Cryptocurrency', data: cryptoSymbols },
                { title: 'Forex Majors & Crosses', data: forexSymbols },
                { title: 'Commodities', data: commoditySymbols },
                { title: 'Synthetic OTC', data: otcSymbols }
              ].map(group => (
                <div key={group.title} className="space-y-2">
                  <h4 className={`text-[8px] font-black uppercase tracking-widest ml-1 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>{group.title}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {group.data.map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => toggleSymbol(symbol)}
                        className={`px-4 py-2.5 rounded-xl border text-[10px] font-orbitron font-bold transition-all text-center ${
                          localSettings.enabledSymbols.includes(symbol)
                            ? 'bg-cyan-50 border-cyan-400 text-black shadow-lg shadow-cyan-500/20'
                            : (isLight ? 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300' : 'bg-black/40 border-zinc-800 text-zinc-600 hover:border-zinc-700')
                        }`}
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={`p-6 border-t flex gap-4 transition-colors duration-500 ${
          isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-zinc-900/50'
        }`}>
          <button onClick={onClose} className={`flex-1 py-4 font-orbitron font-bold text-[10px] tracking-widest transition-colors ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-zinc-500 hover:text-white'}`}>CANCEL</button>
          <button onClick={() => { onSave(localSettings); onClose(); }} className="flex-[2] py-4 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-orbitron font-black text-[10px] tracking-widest text-white shadow-xl shadow-cyan-500/10 active:scale-95 transition-all">COMMIT CHANGES</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
