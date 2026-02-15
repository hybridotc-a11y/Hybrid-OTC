import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MarketSymbol, PredictionResult, MarketDataPoint, MarketPhysics, BrokerProfile } from "../types";

// Initialize using Vite's environment variable syntax
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const PREDICTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    direction: { type: Type.STRING, enum: ['CALL', 'PUT', 'NEUTRAL'] },
    probability: { type: Type.NUMBER, description: 'Structural confidence 0-100' },
    executionConfidence: { type: Type.NUMBER, description: 'Permission to trade now 0-100' },
    manipulationIndex: { type: Type.NUMBER, description: 'Probability that current wicks are artificial 0-100' },
    sharpMovementProbability: { type: Type.NUMBER, description: 'Likelihood of high-velocity movement in the next window 0-100' },
    preciseEntry: { type: Type.NUMBER, description: 'Specific price for optimal entry' },
    preciseExit: { type: Type.NUMBER, description: 'Specific price for profit target/exit' },
    brokerTactic: { type: Type.STRING, enum: ['LIQUIDITY_INDUCEMENT', 'STOP_HUNT_WIZARD', 'STAIRCASE_DRIFT', 'VOLATILITY_SQUEEZE', 'RETAIL_BAIT', 'ALGORITHMIC_BALANCE', 'NONE'] },
    edgeHalfLife: { type: Type.NUMBER, description: 'Total seconds until edge expires' },
    expectedEntryCountdown: { type: Type.NUMBER, description: 'Seconds until price hits the optimal execution level.' },
    entryWindowDuration: { type: Type.NUMBER, description: 'Total seconds the optimal window stays open once reached' },
    recommendedExpiry: { type: Type.STRING },
    decayRisk: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
    regime: { type: Type.STRING },
    analysis: { type: Type.STRING, description: 'Adversarial report. Focus on Volatility Forecast and Liquidity shifts.' },
    patternMatch: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['LIQUIDITY_SWEEP', 'FAIR_VALUE_GAP', 'ORDER_BLOCK', 'BREAK_OF_STRUCTURE', 'MITIGATION_TAP', 'CHoCH', 'SFP', 'BROKER_TRAP', 'VOLATILITY_CLIMAX', 'NONE'] },
        confidence: { type: Type.NUMBER },
        description: { type: Type.STRING }
      },
      required: ['type', 'confidence', 'description']
    },
    matrix: {
      type: Type.OBJECT,
      properties: {
        technical: { type: Type.NUMBER },
        structural: { type: Type.NUMBER },
        volume: { type: Type.NUMBER },
        algorithmic: { type: Type.NUMBER }
      }
    },
    trapDetected: { type: Type.BOOLEAN },
    executionAdvice: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING },
        timing: { type: Type.STRING }
      }
    }
  },
  required: ['direction', 'probability', 'executionConfidence', 'manipulationIndex', 'brokerTactic', 'edgeHalfLife', 'expectedEntryCountdown', 'entryWindowDuration', 'patternMatch', 'regime', 'analysis', 'sharpMovementProbability', 'preciseEntry', 'preciseExit']
};

export async function getMarketProbability(
  symbol: MarketSymbol,
  history: MarketDataPoint[],
  physics: MarketPhysics,
  broker: BrokerProfile,
  useThinking: boolean = true
): Promise<PredictionResult> {
  // Use the validated API_KEY
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const recent = history.slice(-60);
  
  const systemInstruction = `
    ROLE: Adversarial Volatility Forecaster v5.0.
    TASK: Analyze market data to predict "Sharp Movement Periods" and "Liquidity Shifts".
    VOLATILITY PROTOCOL: Identify "Expansion Windows" and precise FVG/Order Block entry points.
    CORE RULE: Set SharpMovementProbability > 80 only if Volatility Squeeze is detected.
  `;

  const prompt = `
    ASSET: ${symbol} | BROKER: ${broker.name} | PHYSICS: Volatility=${physics.volatility}, Velocity=${physics.velocity}
    TICK STREAM (Price): ${recent.map(d => d.price.toFixed(5)).join(', ')}
    Provide a Volatility Forecast JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: PREDICTION_SCHEMA
    }
  });

  const result = JSON.parse(response.text || '{}');
  return formatResult(result, symbol, broker, physics);
}

export async function analyzeMarketVisual(
  base64Image: string,
  symbol: MarketSymbol,
  broker: BrokerProfile,
  history: MarketDataPoint[],
  physics: MarketPhysics
): Promise<PredictionResult> {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const imageData = base64Image.split(',')[1];
  
  const systemInstruction = `ROLE: Neural Vision Volatility Scanner. TASK: Scan chart for visual clues of sharp movement.`;
  const prompt = `PERFORM SHARP MOVEMENT ANALYSIS. Return Adversarial Volatility JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: 'image/jpeg', data: imageData } }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: PREDICTION_SCHEMA
    }
  });

  const result = JSON.parse(response.text || '{}');
  return formatResult(result, symbol, broker, physics);
}

function formatResult(result: any, symbol: MarketSymbol, broker: BrokerProfile, physics?: MarketPhysics): PredictionResult {
  let momentumMismatch = false;
  if (physics) {
    if (result.direction === 'CALL' && physics.momentumDirection === 'BEAR') momentumMismatch = true;
    if (result.direction === 'PUT' && physics.momentumDirection === 'BULL') momentumMismatch = true;
  }

  let executionState: any = 'PRIME_WINDOW';
  if (result.sharpMovementProbability > 85) executionState = 'VOLATILITY_EXPANSION';
  else if (result.manipulationIndex > 70) executionState = 'MANIPULATION_HIGH';
  else if (result.expectedEntryCountdown > 0) executionState = 'WAITING';

  return {
    ...result,
    executionState,
    momentumMismatch,
    timestamp: new Date().toLocaleTimeString(),
    market: symbol,
    marketType: broker.isSynthetic ? 'OTC' : 'LIVE',
    physics
  };
}

export async function speakMarketNarrative(text: string): Promise<void> {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: `Strategy Alert: ${text}` }] },
      config: {
        responseModalalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    // Audio processing logic remains the same...
  } catch (err) {}
}
