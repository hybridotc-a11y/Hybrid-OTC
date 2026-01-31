
import { MarketDataPoint, BacktestResult, MarketSymbol, TimeFrame } from '../types';
import { calculateNeuralMetrics } from './neuralEngine';

/**
 * Executes a simulated backtest on the provided historical dataset.
 * Uses local TFJS neural models to generate signals candle-by-candle.
 */
export async function runQuantitativeBacktest(
  symbol: MarketSymbol,
  timeframe: TimeFrame,
  data: MarketDataPoint[]
): Promise<BacktestResult> {
  const minRequired = 40;
  if (data.length < minRequired + 10) {
    throw new Error("Insufficient data depth for backtesting.");
  }

  let wins = 0;
  let losses = 0;
  let consecutiveWins = 0;
  let maxConsecutiveWins = 0;
  let maxDrawdown = 0;
  let balance = 1000; // Starting simulated balance
  const initialBalance = 1000;
  const stake = 10;
  const payout = 0.85;

  // We start from index 30 to give neural models enough context
  // We stop at length - 1 because we need the NEXT candle to verify the result
  for (let i = 30; i < data.length - 1; i++) {
    const historicalWindow = data.slice(0, i + 1);
    const neuralMetrics = await calculateNeuralMetrics(historicalWindow);
    
    // Aggregate signal from Forest Ensemble and LSTM
    const forestSignal = neuralMetrics.find(m => m.name === 'FOREST-ENSEMBLE');
    const lstmSignal = neuralMetrics.find(m => m.name === 'TF-LSTM');

    let finalSignal: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
    if (forestSignal?.signal === 'BUY' && lstmSignal?.signal === 'BUY') finalSignal = 'CALL';
    else if (forestSignal?.signal === 'SELL' && lstmSignal?.signal === 'SELL') finalSignal = 'PUT';

    if (finalSignal === 'NEUTRAL') continue;

    const actualMove = data[i + 1].price - data[i].price;
    const isWin = (finalSignal === 'CALL' && actualMove > 0) || (finalSignal === 'PUT' && actualMove < 0);

    if (isWin) {
      wins++;
      consecutiveWins++;
      balance += stake * payout;
      if (consecutiveWins > maxConsecutiveWins) maxConsecutiveWins = consecutiveWins;
    } else {
      losses++;
      consecutiveWins = 0;
      balance -= stake;
      const currentDD = ((initialBalance - balance) / initialBalance) * 100;
      if (currentDD > maxDrawdown) maxDrawdown = currentDD;
    }
  }

  const totalTrades = wins + losses;
  return {
    winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
    totalTrades,
    wins,
    losses,
    profitSimulation: balance - initialBalance,
    drawdown: Math.max(0, maxDrawdown),
    consecutiveWins: maxConsecutiveWins,
    symbol,
    timeframe,
    period: `${data.length} Bars`
  };
}
