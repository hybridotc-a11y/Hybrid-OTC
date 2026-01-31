
import React, { useEffect, useRef, useMemo } from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, Bar, ReferenceArea } from 'recharts';
import { MarketDataPoint, MarketSymbol, TimeFrame, AppSettings, MarketZone, MarketRegime } from '../types';
import { LayoutGrid, LineChart, Eye, Sparkles, Zap, Cpu, Layers } from 'lucide-react';
import html2canvas from 'html2canvas';

interface MarketChartProps {
  data: MarketDataPoint[];
  color: string;
  symbol: MarketSymbol;
  theme?: string;
  indicators?: AppSettings['indicators'];
  onAnalyzeView?: (timeframe: TimeFrame) => void;
  onDirectNeuralScan?: (base64Image: string, timeframe: TimeFrame) => void;
  isAnalyzing?: boolean;
  keyLevels?: string[];
  smartZones?: MarketZone[];
  regime?: MarketRegime;
  activeTimeframe: TimeFrame;
  onTimeframeChange: (tf: TimeFrame) => void;
}

// Fixed missing SYNTHETIC_STAIRCASE property
const REGIME_COLORS: Record<MarketRegime, string> = {
  TRENDING: '#10b981',      
  RANGING: '#64748b',       
  EXPANSION: '#f43f5e',     
  CONTRACTION: '#06b6d4',   
  LIQUIDITY_GRAB: '#a855f7',
  DISTRIBUTION: '#f59e0b',  
  ACCUMULATION: '#6366f1',  
  OTC_RANGE: '#7c3aed',     
  OTC_DRIFT: '#8b5cf6',     
  OTC_FAKE_OUT: '#db2777',  
  SYNTHETIC_STAIRCASE: '#4f46e5',
};

const MarketChart: React.FC<MarketChartProps> = ({ 
  data, 
  color: propColor, 
  symbol, 
  theme = 'MIDNIGHT', 
  indicators,
  onAnalyzeView,
  onDirectNeuralScan,
  isAnalyzing = false,
  keyLevels = [],
  smartZones = [],
  regime = 'RANGING',
  activeTimeframe,
  onTimeframeChange
}) => {
  const [chartType, setChartType] = React.useState<'QUANTUM' | 'TRADINGVIEW'>('QUANTUM');
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'LIGHT';
  const isMidnight = theme === 'MIDNIGHT';
  const timeframes: TimeFrame[] = ['1min', '5min', '15min', '1h', '4h'];

  const dynamicColor = REGIME_COLORS[regime] || propColor;

  const parsedLevels = useMemo(() => {
    return keyLevels.map(lvl => parseFloat(lvl.replace(/[^0-9.]/g, ''))).filter(n => !isNaN(n));
  }, [keyLevels]);

  const handleDirectSync = async () => {
    if (!chartWrapperRef.current || isAnalyzing) return;
    
    try {
      const canvas = await html2canvas(chartWrapperRef.current, {
        backgroundColor: isLight ? '#f8fafc' : isMidnight ? '#000000' : '#0f172a',
        scale: 2, 
        logging: false,
        useCORS: true
      });
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      onDirectNeuralScan?.(base64, activeTimeframe);
    } catch (err) {
      console.error("Direct Sync Capture Failed:", err);
    }
  };

  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    
    const results = data.map(d => ({...d}));
    const BB_PERIOD = 20;
    const BB_STD = 2;
    const RSI_PERIOD = 14;
    const MACD_FAST = 12;
    const MACD_SLOW = 26;
    const TENKAN_PERIOD = 9;
    const KIJUN_PERIOD = 26;
    const ATR_PERIOD = 14;

    const prices = data.map(d => d.price);
    const highs = data.map(d => d.high || d.price);
    const lows = data.map(d => d.low || d.price);
    const volumes = data.map(d => d.volume);

    const calculateEMA = (p: number[], period: number) => {
      const k = 2 / (period + 1);
      const ema = [p[0]];
      for (let i = 1; i < p.length; i++) {
        ema.push(p[i] * k + ema[i - 1] * (1 - k));
      }
      return ema;
    };

    const ema12 = calculateEMA(prices, MACD_FAST);
    const ema26 = calculateEMA(prices, MACD_SLOW);

    // Cumulative VWAP helpers
    let cumPV = 0;
    let cumV = 0;

    for (let i = 0; i < results.length; i++) {
      // Bollinger Bands
      if (indicators?.bollingerBands && i >= BB_PERIOD - 1) {
        const slice = prices.slice(i - BB_PERIOD + 1, i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / BB_PERIOD;
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / BB_PERIOD;
        const stdDev = Math.sqrt(variance);
        (results[i] as any).bb_upper = mean + (BB_STD * stdDev);
        (results[i] as any).bb_lower = mean - (BB_STD * stdDev);
        (results[i] as any).bb_middle = mean;
      }

      // RSI
      if (indicators?.rsi && i >= RSI_PERIOD) {
        let gains = 0;
        let losses = 0;
        for (let j = i - RSI_PERIOD + 1; j <= i; j++) {
          const diff = prices[j] - prices[j - 1];
          if (diff > 0) gains += diff; else losses -= diff;
        }
        const rs = (gains / RSI_PERIOD) / (losses / RSI_PERIOD || 1);
        (results[i] as any).rsi = 100 - (100 / (1 + rs));
      }

      // VWAP
      if (indicators?.vwap) {
        const typicalPrice = (highs[i] + lows[i] + prices[i]) / 3;
        cumPV += typicalPrice * volumes[i];
        cumV += volumes[i];
        (results[i] as any).vwap = cumV !== 0 ? cumPV / cumV : prices[i];
      }

      // ATR (Average True Range)
      if (indicators?.atr && i >= ATR_PERIOD) {
          const ranges = [];
          for (let j = i - ATR_PERIOD + 1; j <= i; j++) {
              const tr = Math.max(
                  highs[j] - lows[j],
                  Math.abs(highs[j] - (prices[j-1] || highs[j])),
                  Math.abs(lows[j] - (prices[j-1] || lows[j]))
              );
              ranges.push(tr);
          }
          (results[i] as any).atr = ranges.reduce((a, b) => a + b, 0) / ATR_PERIOD;
      }

      if (indicators?.macd) {
        (results[i] as any).macd = ema12[i] - ema26[i];
      }

      if (indicators?.ichimoku) {
          if (i >= TENKAN_PERIOD - 1) {
              const h_slice = highs.slice(i - TENKAN_PERIOD + 1, i + 1);
              const l_slice = lows.slice(i - TENKAN_PERIOD + 1, i + 1);
              (results[i] as any).tenkan = (Math.max(...h_slice) + Math.min(...l_slice)) / 2;
          }
          if (i >= KIJUN_PERIOD - 1) {
              const h_slice = highs.slice(i - KIJUN_PERIOD + 1, i + 1);
              const l_slice = lows.slice(i - KIJUN_PERIOD + 1, i + 1);
              (results[i] as any).kijun = (Math.max(...h_slice) + Math.min(...l_slice)) / 2;
          }
      }
    }

    return results;
  }, [data, indicators]);

  useEffect(() => {
    if (chartType === 'TRADINGVIEW' && containerRef.current) {
      containerRef.current.innerHTML = '';
      
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;

      let tvSymbol = symbol.replace('/', '');
      const cryptoMajors = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOT', 'DOGE', 'LINK', 'MATIC', 'PEPE', 'SHIB', 'LTC', 'AVAX'];
      
      if (cryptoMajors.some(c => symbol.startsWith(c))) {
        tvSymbol = `BINANCE:${tvSymbol}T`;
      } else if (symbol.startsWith('XAU') || symbol.startsWith('XAG')) {
        tvSymbol = `OANDA:${tvSymbol}`;
      } else {
        tvSymbol = `FX:${tvSymbol}`;
      }

      const tvIntervalMap: Record<string, string> = {
        '1min': '1', '5min': '5', '15min': '15', '1h': '60', '4h': '240'
      };

      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": tvSymbol,
        "interval": tvIntervalMap[activeTimeframe],
        "timezone": "Etc/UTC",
        "theme": isLight ? "light" : "dark",
        "style": "1",
        "locale": "en",
        "allow_symbol_change": false,
        "calendar": false,
        "support_host": "https://www.tradingview.com"
      });
      
      containerRef.current.appendChild(script);
    }
  }, [chartType, symbol, theme, activeTimeframe]);

  const gridColor = isLight 
    ? `rgba(${parseInt(dynamicColor.slice(1,3), 16)}, ${parseInt(dynamicColor.slice(3,5), 16)}, ${parseInt(dynamicColor.slice(5,7), 16)}, 0.05)` 
    : isMidnight 
      ? `rgba(${parseInt(dynamicColor.slice(1,3), 16)}, ${parseInt(dynamicColor.slice(3,5), 16)}, ${parseInt(dynamicColor.slice(5,7), 16)}, 0.03)` 
      : "rgba(255,255,255,0.05)";
  
  const axisColor = isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.3)";

  return (
    <div className={`w-full h-full min-h-[300px] rounded-[2.5rem] border relative overflow-hidden group flex flex-col transition-all duration-700 ${
      isMidnight ? 'bg-black border-white/5' : 
      isLight ? 'bg-slate-50 border-slate-200' : 
      'bg-slate-900/40 border-slate-800'
    }`} style={{ boxShadow: !isLight ? `0 0 40px ${dynamicColor}11 inset` : undefined }}>
      
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] transition-colors duration-1000" style={{ backgroundColor: dynamicColor }} />

      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {chartType === 'QUANTUM' ? (
          <button 
            onClick={handleDirectSync}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-orbitron text-[10px] font-black transition-all shadow-xl group/btn ${
              isAnalyzing 
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' 
              : `bg-black/60 border-white/10 text-white hover:text-black hover:scale-105 active:scale-95`
            }`}
            style={!isAnalyzing ? { borderColor: `${dynamicColor}55`, backgroundColor: `${dynamicColor}11` } : {}}
          >
            {isAnalyzing ? (
              <>
                <Zap className="w-3 h-3 animate-bounce text-cyan-400" /> SYNCING...
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4 transition-transform duration-500 group-hover/btn:rotate-90" style={{ color: dynamicColor }} /> DIRECT NEURAL SYNC
              </>
            )}
          </button>
        ) : (
          <button 
            onClick={() => onAnalyzeView?.(activeTimeframe)}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-orbitron text-[10px] font-black transition-all shadow-xl group/btn ${
              isAnalyzing 
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' 
              : `bg-black/60 border-white/10 text-white hover:scale-105 active:scale-95`
            }`}
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-3 h-3 animate-spin" /> SCANNING...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 group-hover/btn:animate-pulse" style={{ color: dynamicColor }} /> AI VISION SCAN
              </>
            )}
          </button>
        )}
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 backdrop-blur-md transition-all duration-700 shadow-2xl ${
            isLight ? 'bg-white/80 border-slate-200 text-slate-600' : 'bg-black/60 border-white/10 text-zinc-400'
        }`} style={{ borderColor: `${dynamicColor}66`, color: dynamicColor }}>
            <Layers className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[9px] font-orbitron font-black uppercase tracking-widest">{regime.replace('_', ' ')} REGIME</span>
        </div>
      </div>

      <div className={`absolute bottom-4 left-4 z-10 flex backdrop-blur-md rounded-xl border p-1 ${
        isLight ? 'bg-white/90 border-slate-200' : 'bg-black/60 border-white/10'
      }`}>
        {timeframes.map(tf => (
            <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-orbitron font-black transition-all ${activeTimeframe === tf ? 'text-black' : 'text-zinc-500 hover:text-white'}`}
                style={activeTimeframe === tf ? { backgroundColor: dynamicColor } : {}}
            >
                {tf.replace('min', 'M')}
            </button>
        ))}
      </div>

      <div className={`absolute top-4 right-4 z-10 flex backdrop-blur-md rounded-lg border p-1 ${isLight ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-black/60 border-white/10'}`}>
        <button 
          onClick={() => setChartType('QUANTUM')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-orbitron font-black transition-all ${chartType === 'QUANTUM' ? 'text-black' : 'text-zinc-500 hover:text-white'}`}
          style={chartType === 'QUANTUM' ? { backgroundColor: dynamicColor } : {}}
        >
          <LineChart className="w-3 h-3" /> QUANTUM
        </button>
        <button 
          onClick={() => setChartType('TRADINGVIEW')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-orbitron font-black transition-all ${chartType === 'TRADINGVIEW' ? 'text-black' : 'text-zinc-500 hover:text-white'}`}
          style={chartType === 'TRADINGVIEW' ? { backgroundColor: dynamicColor } : {}}
        >
          <LayoutGrid className="w-3 h-3" /> TRADINGVIEW
        </button>
      </div>

      <div className="flex-1 relative" ref={chartWrapperRef}>
        {isAnalyzing && (
          <div className="absolute inset-0 z-[5] overflow-hidden pointer-events-none">
             <div className="absolute inset-0 scanning-overlay animate-pulse opacity-40" style={{ background: `radial-gradient(circle, transparent 20%, ${dynamicColor} 100%)` }} />
             <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className="border-[0.5px]" style={{ borderColor: dynamicColor }} />
                ))}
             </div>
             <div className="scanner-line" style={{ background: `linear-gradient(90deg, transparent, ${dynamicColor}, transparent)` }} />
          </div>
        )}
        {chartType === 'QUANTUM' ? (
          <div className="w-full h-full p-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={dynamicColor} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={dynamicColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 6" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" hide={true} />
                <YAxis yAxisId="price" domain={['auto', 'auto']} orientation="right" stroke={axisColor} fontSize={9} axisLine={false} tickLine={false} tick={{ fontWeight: 'bold' }} />
                <YAxis yAxisId="rsi" domain={[0, 100]} orientation="left" hide={true} />
                <YAxis yAxisId="macd" domain={['auto', 'auto']} orientation="left" hide={true} />
                <YAxis yAxisId="atr" domain={['auto', 'auto']} orientation="left" hide={true} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isLight ? '#fff' : isMidnight ? '#000' : '#0f172a', 
                    border: isLight ? '1px solid #e2e8f0' : `1px solid ${dynamicColor}33`, 
                    fontSize: '10px', 
                    borderRadius: '12px', 
                    color: isLight ? '#0f172a' : '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }} 
                  itemStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold' }}
                />
                <Area yAxisId="price" type="monotone" dataKey="price" stroke={dynamicColor} strokeWidth={2.5} fillOpacity={1} fill="url(#colorPrice)" animationDuration={800} />
                
                {smartZones.map((zone, idx) => (
                    <ReferenceArea
                        key={`zone-${idx}`}
                        yAxisId="price"
                        y1={zone.bottom}
                        y2={zone.top}
                        x1={zone.startTime}
                        fill={zone.direction === 'BULLISH' ? '#10b981' : '#ef4444'}
                        fillOpacity={0.1}
                        stroke={zone.type === 'FVG' ? (zone.direction === 'BULLISH' ? '#10b981' : '#ef4444') : 'transparent'}
                        strokeDasharray={zone.type === 'FVG' ? "3 3" : "0"}
                        strokeOpacity={0.4}
                    />
                ))}

                {indicators?.vwap && (
                    <Line yAxisId="price" type="monotone" dataKey="vwap" stroke="#6366f1" dot={false} strokeWidth={1.5} opacity={0.8} />
                )}

                {indicators?.bollingerBands && (
                    <>
                        <Line yAxisId="price" type="monotone" dataKey="bb_upper" stroke={isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)"} strokeDasharray="3 3" dot={false} strokeWidth={1} />
                        <Line yAxisId="price" type="monotone" dataKey="bb_lower" stroke={isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)"} strokeDasharray="3 3" dot={false} strokeWidth={1} />
                        <Line yAxisId="price" type="monotone" dataKey="bb_middle" stroke={`${dynamicColor}33`} dot={false} strokeWidth={1} />
                    </>
                )}
                {indicators?.ichimoku && (
                    <>
                        <Line yAxisId="price" type="step" dataKey="tenkan" stroke="#f43f5e" dot={false} strokeWidth={1.5} opacity={0.6} />
                        <Line yAxisId="price" type="step" dataKey="kijun" stroke="#06b6d4" dot={false} strokeWidth={1.5} opacity={0.6} />
                    </>
                )}
                {indicators?.rsi && (
                    <Line yAxisId="rsi" type="monotone" dataKey="rsi" stroke="#f59e0b" dot={false} strokeWidth={1.5} opacity={0.7} />
                )}
                {indicators?.atr && (
                    <Line yAxisId="atr" type="monotone" dataKey="atr" stroke="#10b981" dot={false} strokeWidth={1} opacity={0.5} />
                )}
                {indicators?.macd && (
                    <Bar yAxisId="macd" dataKey="macd" fill="#8b5cf6" opacity={0.4} radius={[2, 2, 0, 0]} />
                )}
                {parsedLevels.map((lvl, idx) => (
                  <ReferenceLine 
                    key={`level-${idx}`}
                    yAxisId="price" 
                    y={lvl} 
                    stroke={isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)"} 
                    strokeWidth={1}
                    label={{ 
                      value: `L${idx+1}`, 
                      fill: isLight ? '#666' : '#999', 
                      fontSize: 8, 
                      position: 'left',
                      fontFamily: 'Orbitron',
                      fontWeight: 'bold'
                    }}
                  />
                ))}
                {chartData.length > 0 && <ReferenceLine yAxisId="price" y={chartData[chartData.length-1].price} stroke={dynamicColor} strokeDasharray="4 4" opacity={0.6} strokeWidth={1} />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div ref={containerRef} className="tradingview-widget-container h-full w-full"></div>
        )}
      </div>
    </div>
  );
};

export default MarketChart;
