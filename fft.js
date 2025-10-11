import { BIN_COUNT, FFT_SIZE, WINDOW_SIZE } from "./util.js";

const wasm = await WebAssembly.instantiateStreaming(fetch('fft.wasm'));
const { fft, memory } = wasm.instance.exports;

export class SineSource {
  SIZE = WINDOW_SIZE;

  /**
   * @type number
   */
  freq = 400;

  /**
   * Create a new audio source returning a sine signal
   *
   * @param {number} freq The sine frequency
   */
  constructor(freq) {
    this.freq = freq;
  }

  /**
   * Obtain a set of samples from the source
   *
   * TODO: Should we pass in an array for it to fill? Or does it store its own
   * array to fill to save ourselves a copy?
   *
   * @returns {Float32Array}
   */
  getSamples() {
    let samples = new Float32Array(this.SIZE);

    for (let i = 0; i < this.SIZE; i++) {
      samples[i] = Math.sin(2 * Math.PI * this.freq * i / this.SIZE)
    }

    return samples;
  }
}

export class WasmTransformer {
  /**
   * @type AudioContext
   */
  ctx = new AudioContext();

  /**
   * @type AnalyserNode
   */
  analyzer;

  timeData = new Float32Array(memory.buffer, 0, FFT_SIZE);

  fftOut = new Float32Array(memory.buffer, 4 * FFT_SIZE, 2 * FFT_SIZE);

  freqData = new Float32Array(FFT_SIZE)

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
  }

  /**
   * Refresh the time/frequency domain data
   * 
   * @returns {Float32Array}
   */
  fft() {
    this.analyzer.getFloatTimeDomainData(this.timeData);
    fft(this.timeData.byteOffset, this.fftOut.byteOffset, FFT_SIZE);

    // Take the norm of each entry
    for (let i = 0; i < this.freqData.length; i++) {
      this.freqData[i] = Math.sqrt(this.fftOut[2*i] ** 2 + this.fftOut[2*i+1] ** 2);
    }

    // console.log("Time:", this.timeData.slice());
    // console.log("fft:", this.fftOut.slice());
    // console.log("Freq:", this.freqData.slice());

    return this.freqData;
  }
}
