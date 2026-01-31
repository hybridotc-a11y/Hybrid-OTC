
import { MarketSymbol, MarketDataPoint, TimeFrame, MarketPhysics, BrokerProfile, BrokerID, BROKER_DEFINITIONS } from "../types";

const TWELVE_DATA_KEYS = [
  "660529fb84264c2d8fceb72ffc756770",
  "43865412a23f4451af7672e1dd66db45"
];

let currentKeyIndex = 0;

export async function fetchMarketHistory(symbol: MarketSymbol, interval: TimeFrame = '1min'): Promise<MarketDataPoint[]> {
  const apiKey = TWELVE_DATA_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % TWELVE_DATA_KEYS.length;
  const cleanSymbol = symbol.replace(' (OTC)', '');
  const url = `https://api.twelvedata.com/time_series?symbol=${cleanSymbol}&interval=${interval}&apikey=${apiKey}&outputsize=100`;

  const response = await fetch(url);
  const data = await response.json();
  if (!data.values) throw new Error("Broker Oracle Unavailable");

  return data.values.map((v: any) => ({
    time: v.datetime,
    price: parseFloat(v.close),
    volume: parseFloat(v.volume || "0"),
    high: parseFloat(v.high || v.close),
    low: parseFloat(v.low || v.close)
  })).reverse();
}

export function computeMarketPhysics(data: MarketDataPoint[]): MarketPhysics {
  const length = data.length;
  if (length < 20) return { volatility: 0, velocity: 0, spread: 0.0001, regimeStrength: 50, momentumDirection: 'FLAT', noiseFloor: 0 };
  
  const prices = data.map(d => d.price);
  const currentPrice = prices[length - 1];

  // 1. Calculate Momentum Direction (Last 5 ticks)
  const last5 = prices.slice(-5);
  const firstOf5 = last5[0];
  const lastOf5 = last5[4];
  let momentumDirection: 'BULL' | 'BEAR' | 'FLAT' = 'FLAT';
  if (lastOf5 > firstOf5 * 1.0001) momentumDirection = 'BULL';
  else if (lastOf5 < firstOf5 * 0.9999) momentumDirection = 'BEAR';

  // 2. Volatility and Noise Floor (Standard Deviation of local returns)
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.abs(prices[i] - prices[i-1]));
  }
  const avgVolatility = returns.reduce((a, b) => a + b, 0) / returns.length;
  
  // Noise Floor: Detects high-frequency small wicks (Broker Signature)
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgVolatility, 2), 0) / returns.length;
  const noiseFloor = Math.sqrt(variance);

  // 3. Efficiency Ratio (Regime)
  const totalDisplacement = Math.abs(currentPrice - prices[0]);
  const totalPath = returns.reduce((a, b) => a + b, 0);
  const efficiencyRatio = totalDisplacement / (totalPath || 1);

  return { 
    volatility: avgVolatility, 
    velocity: (currentPrice - prices[length - 10]) / 10, 
    spread: avgVolatility * 0.1, 
    regimeStrength: Math.min(100, efficiencyRatio * 100),
    momentumDirection,
    noiseFloor
  };
}

export function getBrokerProfile(symbol: MarketSymbol, physics: MarketPhysics, brokerId: BrokerID): BrokerProfile {
  const isOTC = symbol.includes('(OTC)');
  const baseDef = BROKER_DEFINITIONS[brokerId];

  return {
    id: brokerId,
    name: baseDef.name || 'Generic LP',
    tickResolution: baseDef.physicsBias === 'NOISY' ? 0.5 : 2,
    observedSpread: physics.spread,
    maxExpiry: isOTC ? 300 : 3600,
    isSynthetic: isOTC,
    reliabilityScore: isOTC ? (baseDef.reliabilityScore || 80) - 15 : (baseDef.reliabilityScore || 80),
    physicsBias: isOTC ? 'SYNTHETIC' : (baseDef.physicsBias || 'SMOOTH')
  };
}
