
export type BrokerID = 'POCKET_OPTION' | 'IQ_OPTION' | 'QUOTEX' | 'INSTITUTIONAL';

export type MarketSymbol = 
  | 'BTC/USD' | 'ETH/USD' | 'SOL/USD' | 'BNB/USD' | 'XRP/USD' 
  | 'ADA/USD' | 'DOT/USD' | 'DOGE/USD' | 'LINK/USD' | 'MATIC/USD' 
  | 'PEPE/USD' | 'SHIB/USD' | 'LTC/USD' | 'AVAX/USD' | 'TRX/USD' | 'UNI/USD'
  | 'EUR/USD' | 'GBP/USD' | 'USD/JPY' | 'AUD/USD' | 'USD/CAD' | 'USD/CHF' | 'NZD/USD'
  | 'EUR/GBP' | 'EUR/JPY' | 'GBP/JPY' | 'AUD/JPY' | 'NZD/JPY' | 'EUR/AUD' | 'GBP/AUD' | 'EUR/CAD' | 'GBP/CAD'
  | 'XAU/USD' | 'XAG/USD'
  | 'EUR/USD (OTC)' | 'GBP/USD (OTC)' | 'USD/JPY (OTC)' | 'AUD/USD (OTC)' | 'EUR/GBP (OTC)' | 'EUR/JPY (OTC)' | 'GBP/JPY (OTC)'
  | 'USD/CAD (OTC)' | 'USD/CHF (OTC)' | 'NZD/USD (OTC)' | 'AUD/CAD (OTC)' | 'AUD/CHF (OTC)' | 'AUD/JPY (OTC)'
  | 'CAD/CHF (OTC)' | 'CAD/JPY (OTC)' | 'CHF/JPY (OTC)' | 'EUR/AUD (OTC)' | 'EUR/CAD (OTC)' | 'EUR/CHF (OTC)'
  | 'EUR/NZD (OTC)' | 'GBP/AUD (OTC)' | 'GBP/CAD (OTC)' | 'GBP/CHF (OTC)' | 'GBP/NZD (OTC)' | 'NZD/JPY (OTC)'
  | 'BTC/USD (OTC)' | 'ETH/USD (OTC)' | 'LTC/USD (OTC)' | 'DOGE/USD (OTC)' | 'SOL/USD (OTC)' | 'BNB/USD (OTC)' | 'XRP/USD (OTC)'
  | 'ADA/USD (OTC)' | 'DOT/USD (OTC)' | 'LINK/USD (OTC)' | 'MATIC/USD (OTC)' | 'TRX/USD (OTC)' | 'AVAX/USD (OTC)'
  | 'XAU/USD (OTC)' | 'XAG/USD (OTC)';

export type MarketType = 'LIVE' | 'OTC' | 'SYNTHETIC_CHOP';

export type ExecutionState = 'WAITING' | 'PRIME_WINDOW' | 'DECAYING' | 'EXPIRED' | 'BLOCKED' | 'MANIPULATION_HIGH' | 'VOLATILITY_EXPANSION';

export type BrokerTactic = 
  | 'LIQUIDITY_INDUCEMENT' | 'STOP_HUNT_WIZARD' | 'STAIRCASE_DRIFT' 
  | 'VOLATILITY_SQUEEZE' | 'RETAIL_BAIT' | 'ALGORITHMIC_BALANCE' | 'NONE';

export interface MarketDataPoint {
  time: string;
  price: number;
  volume: number;
  high?: number;
  low?: number;
}

export interface MarketZone {
  top: number;
  bottom: number;
  startTime: string;
  direction: 'BULLISH' | 'BEARISH';
  type: 'FVG' | 'ORDER_BLOCK' | 'INDUCEMENT_ZONE' | 'EXPANSION_ZONE';
}

export interface NeuralModelStatus {
  name: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  probabilityNextCandle?: number;
}

export interface MarketSession {
  name: string;
  status: 'OPEN' | 'CLOSED';
  color: string;
}

export interface GlobalMarketStatus {
  sessions: MarketSession[];
  currentVolatilityBias: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
}

export interface BrokerProfile {
  id: BrokerID;
  name: string;
  tickResolution: number; 
  observedSpread: number;
  maxExpiry: number;
  isSynthetic: boolean;
  reliabilityScore: number; 
  physicsBias: 'SMOOTH' | 'NOISY' | 'INSTITUTIONAL' | 'SYNTHETIC';
}

export interface MarketPhysics {
  volatility: number;
  velocity: number;
  spread: number;
  regimeStrength: number;
  momentumDirection: 'BULL' | 'BEAR' | 'FLAT';
  noiseFloor: number; 
  sharpMovementProb?: number; 
}

export type InstitutionalPattern = 
  | 'LIQUIDITY_SWEEP' | 'FAIR_VALUE_GAP' | 'ORDER_BLOCK' | 'BREAK_OF_STRUCTURE' 
  | 'MITIGATION_TAP' | 'CHoCH' | 'SFP' | 'BROKER_TRAP' | 'VOLATILITY_CLIMAX' | 'NONE';

export type MarketRegime = 
  | 'TRENDING' | 'RANGING' | 'EXPANSION' | 'CONTRACTION' 
  | 'LIQUIDITY_GRAB' | 'DISTRIBUTION' | 'ACCUMULATION'
  | 'OTC_RANGE' | 'OTC_DRIFT' | 'OTC_FAKE_OUT' | 'SYNTHETIC_STAIRCASE';

export type TimeFrame = '1min' | '5min' | '15min' | '1h' | '4h';
export type AppTheme = 'MIDNIGHT' | 'DARK' | 'LIGHT' | 'VOLATILITY_AMBER';
export type EntryType = 'INSTANT' | 'WAIT_FOR_RETRACE' | 'WAIT_FOR_BREAKOUT' | 'COUNTER_MANIPULATION';
export type BinarySignal = 'CALL' | 'PUT' | 'NEUTRAL';

export interface PredictionResult {
  direction: BinarySignal;
  probability: number; 
  executionConfidence: number; 
  executionState: ExecutionState;
  recommendedExpiry: string;
  marketType: MarketType;
  edgeHalfLife: number; 
  expectedEntryCountdown: number; 
  entryWindowDuration: number; 
  decayRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  regime: MarketRegime;
  analysis: string;
  momentumMismatch: boolean;
  manipulationIndex: number; 
  brokerTactic: BrokerTactic;
  sharpMovementProbability: number; 
  preciseEntry: number; 
  preciseExit: number; 
  patternMatch: {
    type: InstitutionalPattern;
    confidence: number;
    description: string;
  };
  matrix: { technical: number; structural: number; volume: number; algorithmic: number };
  trapDetected: boolean;
  timestamp: string;
  market: MarketSymbol;
  executionAdvice: {
    type: EntryType;
    timing: string;
  };
  physics?: MarketPhysics;
  indicatorReasoning?: string[];
}

export interface BacktestResult {
  winRate: number;
  totalTrades: number;
  wins: number;
  losses: number;
  profitSimulation: number;
  drawdown: number;
  consecutiveWins: number;
  symbol: MarketSymbol;
  timeframe: TimeFrame;
  period: string;
}

export interface AppSettings {
  confidenceThreshold: number;
  enabledSymbols: MarketSymbol[];
  theme: AppTheme;
  activeBroker: BrokerID;
  deepThinking: boolean;
  searchGrounding: boolean;
  autoVoice: boolean;
  autoScan: boolean;
  autoIndicators: boolean;
  enabledNeuralModels: string[]; 
  indicators: {
    rsi: boolean;
    macd: boolean;
    bollingerBands: boolean;
    ichimoku: boolean;
    smc: boolean;
    vsa: boolean;
    liquidity: boolean;
    multiHtf: boolean;
    neuralCrossCheck: boolean;
    vwap: boolean;
    atr: boolean;
    manipulationOverlay: boolean;
  };
}

export const ALL_SYMBOLS: MarketSymbol[] = [
  'BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD', 
  'ADA/USD', 'DOT/USD', 'DOGE/USD', 'LINK/USD', 'MATIC/USD', 
  'PEPE/USD', 'SHIB/USD', 'LTC/USD', 'AVAX/USD', 'TRX/USD', 'UNI/USD',
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'NZD/USD',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'NZD/JPY', 'EUR/AUD', 'GBP/AUD', 'EUR/CAD', 'GBP/CAD',
  'XAU/USD', 'XAG/USD',
  'EUR/USD (OTC)', 'GBP/USD (OTC)' , 'USD/JPY (OTC)', 'AUD/USD (OTC)', 'EUR/GBP (OTC)', 'EUR/JPY (OTC)', 'GBP/JPY (OTC)',
  'USD/CAD (OTC)', 'USD/CHF (OTC)', 'NZD/USD (OTC)', 'AUD/CAD (OTC)', 'AUD/CHF (OTC)', 'AUD/JPY (OTC)',
  'CAD/CHF (OTC)', 'CAD/JPY (OTC)', 'CHF/JPY (OTC)', 'EUR/AUD (OTC)', 'EUR/CAD (OTC)', 'EUR/CHF (OTC)',
  'EUR/NZD (OTC)', 'GBP/AUD (OTC)', 'GBP/CAD (OTC)', 'GBP/CHF (OTC)', 'GBP/NZD (OTC)', 'NZD/JPY (OTC)',
  'BTC/USD (OTC)', 'ETH/USD (OTC)', 'LTC/USD (OTC)', 'DOGE/USD (OTC)', 'SOL/USD (OTC)', 'BNB/USD (OTC)', 'XRP/USD (OTC)',
  'ADA/USD (OTC)', 'DOT/USD (OTC)', 'LINK/USD (OTC)', 'MATIC/USD (OTC)', 'TRX/USD (OTC)', 'AVAX/USD (OTC)',
  'XAU/USD (OTC)', 'XAG/USD (OTC)'
];

export const BROKER_DEFINITIONS: Record<BrokerID, Partial<BrokerProfile>> = {
  POCKET_OPTION: { name: 'Pocket Option', reliabilityScore: 82, physicsBias: 'SYNTHETIC' },
  IQ_OPTION: { name: 'IQ Option', reliabilityScore: 88, physicsBias: 'SMOOTH' },
  QUOTEX: { name: 'Quotex', reliabilityScore: 85, physicsBias: 'NOISY' },
  INSTITUTIONAL: { name: 'Direct LP (Institutional)', reliabilityScore: 98, physicsBias: 'INSTITUTIONAL' }
};
