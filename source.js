/**
 * The number of samples per second of the input stream
 *
 * Create a dummy AudioContext to figure out the machine's sampleRate
 * It's gross, but whatever.
 */
export const SAMPLING_RATE = new AudioContext().sampleRate;

/**
 * A general interface for a waveform source that knows how to provide samples of its waveform.
 *
 * @typedef {Object} Source
 * @property {(samples: Float32Array) => void} getSamples - Fill the provided `Float32Array` with samples taken from the source
 * @returns void
 */

/**
 * The amount of samples used in a single window.
 *
 * This in part determines the frequency resolution.
 */
export const N_SAMPLES = 16 * 1024;


/**
 * Create a sine wave source with the given parameters
 * @param {Object} params
 * @param {number} params.freq - The frequency of the sine source
 * @param {number} params.ampl - The amplitude of the sine source
 *
 * @returns {Source} A wave source
 */
export function SineSource({ freq, ampl }) {
  return {
    getSamples(samples) {
      for (let i = 0; i < samples.length; i++) {
        samples[i] = ampl * Math.sin(2 * Math.PI * freq * i / samples.length);
      }
    }
  }
}

/**
 * Create an approximate square wave source with the given parameters
 * @param {Object} params
 * @param {number} params.freq - The frequency of the sine source
 * @param {number} params.ampl - The amplitude of the sine source
 * @param {number} params.n    - The order of the square wave approximation
 *
 * @returns {Source} A wave source
 */
export function SquareSource({ freq, ampl, n }) {
  return {
    getSamples(samples) {
      for (let i = 0; i < samples.length; i++) {
        for (let k = 1; k < 2*n; k += 2) {
          samples[i] += ampl / k * Math.sin(2 * Math.PI * k * freq * i / samples.length);
        }
      }
    }
  }
}

/**
 * Create a source that returns samples from the microphone input
 *
 * @param {MediaStream} The input audio stream to sample from
 *
 * @returns {Source} A wave source of the microphone input
 */
export function AudioStreamSource(stream) {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyzer = ctx.createAnalyser();
  analyzer.fftSize = N_SAMPLES;
  source.connect(analyzer);

  return {
    getSamples(samples) {
      analyzer.getFloatTimeDomainData(samples)
    }
  }
}
