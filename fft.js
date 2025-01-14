import { BIN_COUNT, FFT_SIZE } from "./util.js";

/**
 * Helper class that wraps an AudioContext that we can use for easy FFTs.
 */
export class Transformer {
  /**
   * @type AudioContext
   */
  ctx = new AudioContext();

  /**
   * @type AnalyserNode
   */
  analyzer;

  /**
   * @type Uint8Array
   */
  freqData = new Uint8Array(BIN_COUNT);

  /**
   * Create a Transformer that can be used to perform FFT on a provided input
   * stream.
   *
   * @param {MediaStream} stream The input stream
   */
  constructor(stream) {
    let source = this.ctx.createMediaStreamSource(stream);
    this.analyzer = this.ctx.createAnalyser();
    this.analyzer.fftSize = FFT_SIZE;
    source.connect(this.analyzer);
    this.analyzer.getByteFrequencyData(this.freqData);
  }

  /**
   * Refresh the time/frequency domain data
   * 
   * @returns {Uint8Array}
   */
  fft() {
    this.analyzer.getByteFrequencyData(this.freqData);
    return this.freqData;
  }
}
