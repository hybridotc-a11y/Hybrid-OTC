
import React, { useState, useEffect } from 'react';
import PredictorDisplay from './components/PredictorDisplay';
import MarketChart from './components/MarketChart';
import SettingsModal from './components/SettingsModal';
import MarketSessions from './components/MarketSessions';
import PredictionHistory from './components/PredictionHistory';
import BacktestPanel from './components/BacktestPanel';
import { getMarketProbability, speakMarketNarrative, analyzeMarketVisual } from './services/geminiService';
import { fetchMarketHistory, computeMarketPhysics, getBrokerProfile } from './services/marketDataService';
import { getGlobalMarketStatus } from './services/marketTimeService';
import { initializeErrorService, reportSystemError, reportSystemEvent } from './services/errorService';
import { calculateNeuralMetrics } from './services/neuralEngine';
import { runQuantitativeBacktest } from './services/backtestService';
import { MarketSymbol, PredictionResult, MarketDataPoint, AppSettings, GlobalMarketStatus, TimeFrame, BrokerID, NeuralModelStatus, MarketPhysics, BacktestResult } from './types';
import { Activity, History as HistoryIcon, Terminal, BarChart4 } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  confidenceThreshold: 80, 
  enabledSymbols: [
    'BTC/USD', 'ETH/USD', 'EUR/USD', 
    'EUR/USD (OTC)', 'GBP/USD (OTC)', 'USD/JPY (OTC)', 
    'BTC/USD (OTC)', 'SOL/USD (OTC)', 'XAU/USD (OTC)'
  ],
  theme: 'MIDNIGHT',
  activeBroker: 'INSTITUTIONAL',
  deepThinking: true,
  searchGrounding: false,
  autoVoice: true,
  autoScan: false,
  autoIndicators: true,
  enabledNeuralModels: ['FOREST-ENSEMBLE', 'TF-LSTM'],
  indicators: { rsi: true, macd: true, bollingerBands: true, ichimoku: false, smc: true, vsa: true, liquidity: true, multiHtf: true, neuralCrossCheck: true, vwap: true, atr: true, manipulationOverlay: true }
};

const App: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketSymbol>('BTC/USD');
  const [activeTimeframe, setActiveTimeframe] = useState<TimeFrame>('1min');
  const [marketHistory, setMarketHistory] = useState<MarketDataPoint[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionResult[]>(() => {
    const saved = localStorage.getItem('binary-ai-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [neuralResults, setNeuralResults] = useState<NeuralModelStatus[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>(["Core node active.", "Awaiting physics sync..."]);
  const [activeTab, setActiveTab] = useState<'LOGS' | 'HISTORY' | 'BACKTEST'>('LOGS');
  const [marketStatus, setMarketStatus] = useState<GlobalMarketStatus>(getGlobalMarketStatus());
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('binary-ai-v4');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('binary-ai-v4', JSON.stringify(newSettings));
  };

  useEffect(() => {
    localStorage.setItem('binary-ai-history', JSON.stringify(predictionHistory.slice(0, 50)));
  }, [predictionHistory]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const addToHistory = (res: PredictionResult) => {
    setPredictionHistory(prev => [res, ...prev].slice(0, 50));
  };

  const clearHistory = () => {
    setPredictionHistory([]);
    localStorage.removeItem('binary-ai-history');
  };

  useEffect(() => {
    initializeErrorService(addLog);
    setPrediction(null);
    setNeuralResults([]);
    setBacktestResult(null);
    loadData(selectedMarket, activeTimeframe);
  }, [selectedMarket, activeTimeframe]);

  const loadData = async (symbol: MarketSymbol, tf: TimeFrame) => {
    try {
      const data = await fetchMarketHistory(symbol, tf);
      setMarketHistory(data);
    } catch (err) {
      reportSystemError(err as Error, "DATA_FEED");
    }
  };

  const getRecommendedIndicators = (symbol: MarketSymbol, physics: MarketPhysics) => {
    const isOTC = symbol.includes('(OTC)');
    const reasoning: string[] = [];
    
    const recommendations: AppSettings['indicators'] = {
      rsi: true,
      bollingerBands: true,
      vsa: !isOTC && physics.volatility > 0,
      neuralCrossCheck: true,
      atr: true,
      macd: false,
      ichimoku: false,
      smc: !isOTC,
      liquidity: !isOTC,
      vwap: !isOTC,
      multiHtf: true,
      manipulationOverlay: false
    };

    if (physics.noiseFloor > 0.00015) {
      recommendations.manipulationOverlay = true;
      recommendations.bollingerBands = true;
      reasoning.push(`HIGH NOISE [${(physics.noiseFloor * 10000).toFixed(2)}]: Broker-side algorithmic jitter detected. Activating wick-filtering and expansion bands.`);
    } else {
      reasoning.push("LOW NOISE: Structural stability confirmed. Suppressing manipulation filters for raw price analysis.");
    }

    if (physics.momentumDirection !== 'FLAT') {
      recommendations.macd = true;
      recommendations.ichimoku = !isOTC;
      const strength = Math.abs(physics.velocity * 1000).toFixed(2);
      reasoning.push(`STRUCTURAL MOMENTUM: Strong ${physics.momentumDirection} bias (Velocity: ${strength}). Activating trend-stability layers.`);
    } else {
      recommendations.bollingerBands = true;
      reasoning.push("NEUTRAL BIAS: Equilibrium detected. Prioritizing mean-reversion (BB/RSI) for oscillating range play.");
    }

    if (isOTC) {
      recommendations.smc = physics.volatility > 0.0005;
      recommendations.vsa = false; 
      reasoning.push("OTC CONTEXT: Synthetic liquidity detected. Disabling VSA to prevent false-volume signals.");
      
      if (physics.noiseFloor > 0.0003) {
        reasoning.push("ALGO SIGNATURE: 'Staircase' pattern likely. Expansion target probability increased.");
      }
    } else {
      recommendations.smc = true;
      recommendations.liquidity = true;
      reasoning.push("INSTITUTIONAL CONTEXT: Real-world liquidity pools identified. Enabling SMC/Flow layers.");
    }

    if (physics.volatility > 0.001) {
      recommendations.atr = true;
      reasoning.push("VOLATILITY SURGE: Expansion phase active. Calibrating ATR for high-velocity exit targets.");
    }

    return { recommendations, reasoning };
  };

  const handleScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setPrediction(null);
    setNeuralResults([]);
    
    try {
      const history = await fetchMarketHistory(selectedMarket, '1min');
      const physics = computeMarketPhysics(history);
      const broker = getBrokerProfile(selectedMarket, physics, settings.activeBroker);
      
      const { recommendations, reasoning } = getRecommendedIndicators(selectedMarket, physics);
      
      addLog(`Physics Sync: ${physics.momentumDirection} Bias | Noise: ${(physics.noiseFloor * 10000).toFixed(2)}`);

      if (settings.autoIndicators) {
        updateSettings({ ...settings, indicators: recommendations });
        addLog(`Neural Core: Auto-calibrating ${Object.values(recommendations).filter(v => v).length} indicators.`);
      }
      
      const [result, neuralMetrics] = await Promise.all([
        getMarketProbability(selectedMarket, history, physics, broker, settings.deepThinking),
        calculateNeuralMetrics(history)
      ]);
      
      const enrichedResult = {
        ...result,
        indicatorReasoning: reasoning
      };

      setPrediction(enrichedResult);
      setNeuralResults(neuralMetrics);
      addToHistory(enrichedResult);

      if (settings.autoVoice) speakMarketNarrative(result.analysis);
      reportSystemEvent(`Signal Capture: ${result.direction} (${result.probability}%)`, "CORE");
    } catch (err) {
      reportSystemError(err as Error, "SCAN_PIPELINE");
    } finally {
      setIsScanning(false);
    }
  };

  const handleInitiateBacktest = async () => {
    if (isBacktesting || marketHistory.length < 50) return;
    setIsBacktesting(true);
    addLog(`Initiating Quantum Backtest for ${selectedMarket}...`);
    
    try {
      const result = await runQuantitativeBacktest(selectedMarket, activeTimeframe, marketHistory);
      setBacktestResult(result);
      addLog(`Backtest Complete: ${result.winRate.toFixed(1)}% WR over ${result.totalTrades} signals.`);
    } catch (err) {
      reportSystemError(err as Error, "BACKTEST_ENGINE_FAULT");
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleDirectNeuralScan = async (base64: string) => {
    if (isScanning) return;
    setIsScanning(true);
    addLog("Initiating Direct Neural Hybrid Scan...");
    
    try {
      const history = await fetchMarketHistory(selectedMarket, '1min');
      const physics = computeMarketPhysics(history);
      const broker = getBrokerProfile(selectedMarket, physics, settings.activeBroker);
      
      const { recommendations, reasoning } = getRecommendedIndicators(selectedMarket, physics);
      if (settings.autoIndicators) {
        updateSettings({ ...settings, indicators: recommendations });
      }

      const [result, neuralMetrics] = await Promise.all([
        analyzeMarketVisual(base64, selectedMarket, broker, history, physics),
        calculateNeuralMetrics(history)
      ]);
      
      const enrichedResult = {
        ...result,
        indicatorReasoning: reasoning
      };

      setPrediction(enrichedResult);
      setNeuralResults(neuralMetrics);
      addToHistory(enrichedResult);

      addLog(`Vision Sync: ${result.patternMatch?.type} Identified (${result.patternMatch?.confidence}% Conf.)`);
      if (settings.autoVoice) speakMarketNarrative(result.analysis);
    } catch (err) {
      reportSystemError(err as Error, "VISION_ENGINE");
    } finally {
      setIsScanning(false);
    }
  };

  const getBackgroundClass = () => {
    const isOTC = selectedMarket.includes('(OTC)');
    const isLight = settings.theme === 'LIGHT';
    if (isLight) return isOTC ? 'bg-purple-50' : 'bg-slate-50';
    if (settings.theme === 'MIDNIGHT') return isOTC ? 'bg-[#0a0510]' : 'bg-black';
    return isOTC ? 'bg-[#1a1025]' : 'bg-slate-900';
  };

  return (
    <div className={`min-h-screen transition-all duration-700 p-4 md:p-6 flex flex-col gap-6 ${getBackgroundClass()}`}>
      <MarketSessions status={marketStatus} theme={settings.theme} />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        <div className="lg:col-span-4 xl:col-span-3">
          <PredictorDisplay 
            currentMarket={selectedMarket} 
            prediction={prediction} 
            neuralResults={neuralResults}
            isScanning={isScanning} 
            onScan={handleScan}
            onMarketChange={setSelectedMarket} 
            onBrokerChange={(id) => updateSettings({ ...settings, activeBroker: id })}
            settings={settings} 
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>

        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          <div className={`${settings.theme === 'LIGHT' ? 'bg-white' : 'bg-black/40'} border ${settings.theme === 'LIGHT' ? 'border-slate-200' : 'border-white/5'} rounded-[2.5rem] p-6 h-[500px]`}>
            <MarketChart 
              data={marketHistory} color={selectedMarket.includes('(OTC)') ? '#a855f7' : '#06b6d4'} 
              symbol={selectedMarket} theme={settings.theme} indicators={settings.indicators} 
              activeTimeframe={activeTimeframe} onTimeframeChange={setActiveTimeframe}
              onDirectNeuralScan={handleDirectNeuralScan}
              onAnalyzeView={() => handleScan()} 
              isAnalyzing={isScanning}
              regime={prediction?.regime || 'RANGING'}
            />
          </div>
          
          <div className={`${settings.theme === 'LIGHT' ? 'bg-white' : 'bg-black/60'} border ${settings.theme === 'LIGHT' ? 'border-slate-200' : 'border-white/5'} rounded-[2rem] p-6 flex-1 flex flex-col`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-4">
                <button onClick={() => setActiveTab('LOGS')} className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${activeTab === 'LOGS' ? 'bg-cyan-500/10 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="font-orbitron text-[10px] font-black uppercase tracking-widest">Telemetry</span>
                </button>
                <button onClick={() => setActiveTab('HISTORY')} className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${activeTab === 'HISTORY' ? 'bg-purple-500/10 text-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <HistoryIcon className="w-3.5 h-3.5" />
                  <span className="font-orbitron text-[10px] font-black uppercase tracking-widest">Archive</span>
                </button>
                <button onClick={() => setActiveTab('BACKTEST')} className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${activeTab === 'BACKTEST' ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <BarChart4 className="w-3.5 h-3.5" />
                  <span className="font-orbitron text-[10px] font-black uppercase tracking-widest">Backtest</span>
                </button>
              </div>
              {activeTab === 'HISTORY' && (
                <button onClick={clearHistory} className="text-[9px] font-black text-zinc-600 hover:text-rose-500 transition-colors uppercase tracking-widest">Clear</button>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === 'LOGS' ? (
                <div className="space-y-2 overflow-y-auto h-full font-mono text-[9px] custom-scrollbar">
                  {logs.map((log, i) => (
                    <div key={i} className={i === 0 ? "text-cyan-400" : "text-zinc-600"}>{log}</div>
                  ))}
                </div>
              ) : activeTab === 'HISTORY' ? (
                <PredictionHistory history={predictionHistory} theme={settings.theme} />
              ) : (
                <BacktestPanel 
                  result={backtestResult} 
                  isProcessing={isBacktesting} 
                  onInitiate={handleInitiateBacktest} 
                  theme={settings.theme} 
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={updateSettings} prediction={prediction} />
    </div>
  );
};

export default App;
