
import { GlobalMarketStatus, MarketSession, MarketSymbol } from '../types';

const CRYPTO_TICKERS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOT', 'DOGE', 'LINK', 'MATIC', 'PEPE', 'SHIB', 'LTC', 'AVAX', 'TRX', 'UNI'];

export function isAssetOpen(symbol: MarketSymbol): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  
  // Crypto is 24/7
  if (CRYPTO_TICKERS.some(ticker => symbol.startsWith(ticker))) {
    return true;
  }

  // Forex and Commodities are closed from Friday 22:00 UTC to Sunday 22:00 UTC
  const isWeekend = (day === 6) || (day === 5 && hour >= 22) || (day === 0 && hour < 22);
  return !isWeekend;
}

export function getGlobalMarketStatus(): GlobalMarketStatus {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const day = now.getUTCDay();
  
  const isWeekend = day === 0 || day === 6;

  const sessions: MarketSession[] = [
    { 
      name: 'SYDNEY', 
      status: (!isWeekend && (utcHour >= 22 || utcHour < 7)) ? 'OPEN' : 'CLOSED',
      color: 'bg-blue-500' 
    },
    { 
      name: 'TOKYO', 
      status: (!isWeekend && (utcHour >= 0 && utcHour < 9)) ? 'OPEN' : 'CLOSED',
      color: 'bg-rose-500' 
    },
    { 
      name: 'LONDON', 
      status: (!isWeekend && (utcHour >= 8 && utcHour < 17)) ? 'OPEN' : 'CLOSED',
      color: 'bg-emerald-500' 
    },
    { 
      name: 'NEW YORK', 
      status: (!isWeekend && (utcHour >= 13 && utcHour < 22)) ? 'OPEN' : 'CLOSED',
      color: 'bg-cyan-500' 
    }
  ];

  const isLondonNYOverlap = !isWeekend && utcHour >= 13 && utcHour < 17;
  
  let volatilityBias: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  let recommendation = '';

  if (isWeekend) {
    volatilityBias = 'LOW';
    recommendation = "Weekend Protocol: Institutional liquidity is offline. Crypto markets may see high manipulation.";
  } else if (isLondonNYOverlap) {
    volatilityBias = 'HIGH';
    recommendation = "Peak Liquidity: London/NY Overlap. Optimal session for precision scalping.";
  } else {
    volatilityBias = 'MEDIUM';
    recommendation = "Active Markets: Standard volatility expected. Follow HTF trend alignment.";
  }

  return { sessions, currentVolatilityBias: volatilityBias, recommendation };
}
