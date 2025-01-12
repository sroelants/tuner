import { dCents, maxIdx, nearestNote } from "./util.js";
import { SAMPLING_RATE } from "./constants.js";

/**
 * The number of downsampled signals to include in HPS (Harmonic Product
 * Spectrum)
 */
const N_HPS = 5;

export class Transformer {
  /**
   * The AudioContext used to analyze the input stream
   *
   * @type AudioContext
   */
  ctx = new AudioContext();

  /**
   * The Analyzer node
   * 
   * @type AnalyserNode
   */
  analyzer;

  /**
   * The current fft data
   *
   * @type Uint8Array
   */
  freqData;

  /**
   * Create an Analyzer that can be used to perform FFT and pitch detection on
   * a provided input stream.
   *
   * @param {MediaStream} stream The input stream
   */
  constructor(stream) {
    let source = this.ctx.createMediaStreamSource(stream);
    this.analyzer = this.ctx.createAnalyser();
    source.connect(this.analyzer);

    this.analyzer.fftSize = 32 * 1024;
    const bufferLength = this.analyzer.frequencyBinCount;
    this.freqData = new Uint8Array(bufferLength);
    this.analyzer.getByteFrequencyData(this.freqData);
  }

  /**
   * Refresh the time/frequency domain data
   */
  getFftData() {
    this.analyzer.getByteFrequencyData(this.freqData);
    return this.freqData;
  }

  /**
   * Calculate the Harmonic Product Spectrum for the current frequency
   * data
   *
   * @returns {number[]}
   */
  hps() {
    let hps_len = Math.floor(this.freqData.length / N_HPS);
    let hps = new Array(hps_len).fill(1.0);

    for (let stride = 1; stride <= N_HPS; stride++) {
      for (let i = 0; i < hps_len; i++) {
        hps[i] *= this.freqData[i * stride];
      }
    }

    return hps;
  }
}

/**
 * Transform an array of FFT data into its Harmonic Product Spectrum, to help
 * identify the fundamental pitch
 */
export function hps(data) {
  let hps_len = Math.floor(data.length / N_HPS);
  let hps = new Array(hps_len).fill(1.0);

  for (let stride = 1; stride <= N_HPS; stride++) {
    for (let i = 0; i < hps_len; i++) {
      hps[i] *= data[i * stride];
    }
  }

  // Clear out anything < 50Hz
  for (let i = 0; i < hps.length; i++) {
    if (binToHz(i) < 50) {
      hps[i] = 0;
    }
  }

  return hps;
}

/**
 * Given an array of FFT data, find the fundamental pitch.
 */
export function getFundamental(data) {
  let idx = maxIdx(hps(data));
  let f0 = binToHz(idx, data.length);
  let nearest = nearestNote(f0);

  return {
    freq: f0,
    nearestNote: nearest,
    cents: dCents(f0, nearest.value),
  };
}

function binToHz(bin, totalBins) {
  return bin / totalBins * SAMPLING_RATE / 2;
}
