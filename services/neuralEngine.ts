
import * as tf from '@tensorflow/tfjs';
import { MarketDataPoint, NeuralModelStatus } from '../types';

function prepareFeatures(data: MarketDataPoint[]) {
  const windowSize = 10;
  const features = [];
  const labels = [];

  for (let i = windowSize; i < data.length - 1; i++) {
    const window = data.slice(i - windowSize, i);
    const current = data[i];
    const next = data[i + 1];

    const returns = (current.price / window[0].price) - 1;
    const avgVol = window.reduce((a, b) => a + b.volume, 0) / windowSize;
    const volZ = (current.volume - avgVol) / (avgVol || 1);
    const prices = window.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pos = (current.price - min) / (max - min || 1);
    const mom = (current.price / data[i - 1].price) - 1;

    features.push([returns, volZ, pos, mom]);
    labels.push(next.price > current.price ? 1 : 0);
  }
  return { features, labels };
}

async function runNeuralClassifier(data: MarketDataPoint[]): Promise<NeuralModelStatus> {
  if (data.length < 30) return { name: 'FOREST-ENSEMBLE', signal: 'HOLD', confidence: 0 };

  const { features, labels } = prepareFeatures(data);
  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(labels, [labels.length, 1]);

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 12, activation: 'tanh', inputShape: [4] }));
  model.add(tf.layers.dense({ units: 6, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({ optimizer: tf.train.adam(0.015), loss: 'binaryCrossentropy' });
  await model.fit(xs, ys, { epochs: 15, verbose: 0 });

  const current = data[data.length - 1];
  const lastWindow = data.slice(-10);
  const avgVol = lastWindow.reduce((a, b) => a + b.volume, 0) / 10;
  const prices = lastWindow.map(p => p.price);

  const currentFeatures = [
    (current.price / lastWindow[0].price) - 1,
    (current.volume - avgVol) / (avgVol || 1),
    (current.price - Math.min(...prices)) / (Math.max(...prices) - Math.min(...prices) || 1),
    (current.price / data[data.length - 2].price) - 1
  ];

  const prediction = model.predict(tf.tensor2d([currentFeatures])) as tf.Tensor;
  const probability = (await prediction.data())[0];

  const signal = probability > 0.60 ? 'BUY' : probability < 0.40 ? 'SELL' : 'HOLD';
  const confidence = Math.round(Math.abs(probability - 0.5) * 200);

  xs.dispose(); ys.dispose(); prediction.dispose(); model.dispose();

  return { name: 'FOREST-ENSEMBLE', signal, confidence, probabilityNextCandle: probability };
}

async function runLSTM(data: MarketDataPoint[]): Promise<NeuralModelStatus> {
  const prices = data.map(d => d.price);
  if (prices.length < 20) return { name: 'TF-LSTM', signal: 'HOLD', confidence: 0 };
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const norm = prices.map(p => (p - min) / (max - min || 1));
  
  const win = 8;
  const xs: number[][] = [];
  const ys: number[] = [];
  for (let i = 0; i < norm.length - win; i++) {
    xs.push(norm.slice(i, i + win));
    ys.push(norm[i + win]);
  }

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: 'tanh', inputShape: [win] }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({ optimizer: tf.train.adam(0.02), loss: 'meanSquaredError' });

  await model.fit(tf.tensor2d(xs), tf.tensor1d(ys), { epochs: 15, verbose: 0 });

  const lastWin = norm.slice(-win);
  const prediction = model.predict(tf.tensor2d([lastWin])) as tf.Tensor;
  const predVal = (await prediction.data())[0];
  const lastVal = norm[norm.length - 1];

  const diff = predVal - lastVal;
  const signal = diff > 0.0002 ? 'BUY' : diff < -0.0002 ? 'SELL' : 'HOLD';
  const confidence = Math.min(100, Math.round(Math.abs(diff) * 10000));

  prediction.dispose(); model.dispose();

  return { name: 'TF-LSTM', signal, confidence };
}

export async function calculateNeuralMetrics(data: MarketDataPoint[]): Promise<NeuralModelStatus[]> {
  return Promise.all([runNeuralClassifier(data), runLSTM(data)]);
}
