import { clamp } from "./math.js";
import { N_SAMPLES } from "./source.js";

export const WINDOW_SIZE = 64 * 1024; //32 * 1024;

/**
 * The number of actual FFT bins.
 *
 * For real-valued functions, we only need half of the Fourier coefficients.
 */
export const BIN_COUNT = WINDOW_SIZE / 2;

/**
 * The number of samples per second of the input stream
 *
 * Create a dummy AudioContext to figure out the machine's sampleRate
 * It's gross, but whatever.
 */
export const SAMPLING_RATE = new AudioContext().sampleRate;

/**
 * Perform a discrete fourier transform on a buffer of samples
 *
 * @param {Float32Array} samples The buffer of samples to transform
 * @returns Float32Array The buffer of frequency samples
 */
export function fft(samples) {
  hann(new Float32Array(samples.buffer, 0, N_SAMPLES));
  let output = new Float32Array(2*samples.length);
  cooleyTukey(samples, output, samples.length, 0, 1);

  let spectrum = new Float32Array(samples.length);

  for (let i = 0; i < samples.length; i++) {
    spectrum[i] = Math.sqrt(output[2*i] ** 2 + output[2*i+1] ** 2);
  }

  return spectrum;
}

/**
 * Perform a step of the Cooley-Tukey FFT algorithm
 *
 * @param {Float32Array} input - The (real) time-domain samples
 * @param {Float32Array} output - An array of (complex-valued) frequency domain values, twice the length of `input`
 * @param {number} N - The number of samples to read in this step
 * @param {number} start - The index to start reading the input values at
 * @param {number} stride - The number of elements to skip between input values
 */
export function cooleyTukey(input, output, N, start, stride) {
  if (N === 1) {
    output[0] = input[start];
    output[1] = 0;
    return;
  }

  // Otherwise, create an auxiliary Float32Array that we'll use to collect the
  // subsequent FFT components.
  let even = new Float32Array(2 * N/2);
  let odd  = new Float32Array(2 * N/2);

  // FFT both parts separately;
  cooleyTukey(input, even, N/2, start,            2 * stride);
  cooleyTukey(input, odd,  N/2, start + stride,   2 * stride);

  for (let k = 0; k < N / 2; k += 1) {
    let w = -2 * Math.PI * k / N;

    let pr = even[2 * k];
    let pi = even[2 * k + 1];
    let qr = Math.cos(w) * odd[2 * k] - Math.sin(w) * odd[2 * k + 1];
    let qi = Math.sin(w) * odd[2 * k] + Math.cos(w) * odd[2 * k + 1];

    let idx1 = 2 * k;
    let idx2 = 2 * (k + N / 2);

    output[idx1    ] = pr + qr;
    output[idx1 + 1] = pi + qi;

    output[idx2    ] = pr - qr;
    output[idx2 + 1] = pi - qi;
  }
}

const NAMES = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];

/**
 * Find the note nearest to the provided frequency
 *
 * @param {number} freq The frequency to quantize to the nearest note
 * @returns {[string, number]} The name and frequency of the nearest note
 */
export function nearestNote(pitch) {
  // Number of semitones (rounded) from A440 to get the nearest pitch.
  let semitones = Math.round(12 * Math.log2(pitch / 440));

  // Get the note name by indexing the number of semitones away from A
  // Account for the fact that % can return a negative number, but we want
  // something between 0 and 11
  let name = NAMES[(semitones % 12 + 12) % 12];

  // The octave number
  // The reference pitch (440Hz) is in the 4th octave register.
  // Octaves switch at each C, so we need to offset the semitones by 3 to get
  // from A to C.
  let octave = 4 + Math.ceil((semitones - 3) / 12);

  let nearestPitch = 440 * 2 ** (semitones / 12);

  return [name + octave.toString(), nearestPitch];
}


/**
 * Find the difference between two pitches in cents
 *
 * @param {number} f1 The first pitch
 * @param {number} f2 The second pitch
 * @returns {number} The distance between the pitches in cents
 */
export function dCents(f1, f2) {
  let cents = f2 > 0 ? 1200 * Math.log2(f1 / f2) : 0;
  return clamp(cents, -50, 50);
}

/**
 * Get the index of the max element in an array
 *
 * @param {number[]} xs The array to find the max index for.
 * @returns {number} The index of the largest element in the array.
 */
export function maxIdx(xs) {
  let maxIdx = 0;

  for (let i = 0; i < xs.length; i++) {
    if (xs[i] > xs[maxIdx]) {
      maxIdx = i;
    }
  }

  return maxIdx;
}

/**
 * The number of downsampled signals to include in HPS (Harmonic Product
 * Spectrum)
 */
const N_HPS = 5;

/**
 * Transform an array of FFT data into its Harmonic Product Spectrum, to help
 * identify the fundamental pitch.
 *
 * By downscaling, we fold higher harmonics onto the fundamental. By taking
 * successive products, we (hopefully) guarantee that the fundamental is the
 * largest peak in the final product spectrum.
 *
 * @see http://musicweb.ucsd.edu/~trsmyth/analysis/Harmonic_Product_Spectrum.html
 *
 * @param {Uint8Array} data
 * @returns {number[]}
 */
export function harmonicProductSpectrum(data) {
  let hps_len = Math.floor(data.length / N_HPS);
  let hps = new Array(hps_len).fill(1.0);

  for (let stride = 1; stride < N_HPS; stride++) {
    for (let i = 0; i < hps_len; i++) {
      hps[i] *= data[i * stride];
    }
  }

  // Clear out anything < 50Hz since the HPS creates a bunch of noise in the
  // lower end.
  for (let i = 0; i < hps.length; i++) {
    if (binToHz(i) < 60) {
      hps[i] = 0;
    }
  }

  return hps;
}

/**
 * Given an array of data, and the index of the maximal value, perform a parabolic
 * interpolation to get an interpolated value that approximates the true maximum.
 *
 * @param {Float32Array} data - The data to interpolate
 * @param {number} idx - The index to interpolate around;
 */
export function interpolate(data, idx) {
  let x1 = idx - 1;
  let x2 = idx;
  let x3 = idx + 1;
  let y1 = data[x1];
  let y2 = data[x2];
  let y3 = data[x3];

  return x2 + 0.5 * ((y1 - y2) * (x3 - x2)**2 - (y3 - y2) * (x2 - x1)**2) /
                    ((y1 - y2) * (x3 - x2)    + (y3 - y2) * (x2 - x1))
}

/**
 * Given a spectral peak, see if there is an appreciable subharmonic that would
 * indicate we're dealing with a missing fundamental. (Sometimes, the higher
 * harmonics can have a larger contribution than the fundamental pitch. In this
 * case, we still want to return the lower octave, rather than the spectral max)
 *
 * @param {Float32Array} data - The spectral data
 * @param {Float32Array} peak - The spectral peak (the maximal value)
 * @returns {number} The *index* of the subharmonic (if one was found), otherwise the original peak index.
 */
export function findSubharmonic(data, peak) {
  let reference = data[peak];
  let estimate = Math.round(peak / 2);

  let window = [
    Math.max(estimate - 10, 1),
    estimate + 10
  ];

  for (let idx = window[0]; idx < window[1]; idx++) {
    let isPeak = data[idx-1] < reference && reference > data[idx+1];
    let isLarge = data[idx] / reference > 0.5;

    if (isPeak && isLarge) {
      return idx;
    }
  }

  return peak;
}

/**
 * Find the fundamental pitch using several tricks:
 * 1. Find the spectral peak of the provided data
 * 2. Check whether there are sub-octave peaks
 * 3. Use quadratic interpolation to increase the resolution of the spectral data
 *
 * @param {Float32Array} data - The spectral data
 * @returns {number} The fundamental pitch in Hz
 */
export function findPitch(data) {
  let pitch = maxIdx(data);
  pitch = findSubharmonic(data, pitch);
  pitch = interpolate(data, pitch);
  return binToHz(pitch);
}

/**
 * Convert an FFT bin index to the corresponding frequency
 *
 * @param {number} bin The FFT bin index.
 * @returns {number} The corresponding frequency in Hz
 */
export function binToHz(bin) {
  return (bin / BIN_COUNT) * (SAMPLING_RATE / 2);
}

/**
 * Apply a Hann window to the provided data
 *
 * @param {Float32Array} data - The data to window
 */
function hann(data) {
  let N = data.length;

  for (let i = 0; i < N; i++) {
    data[i] *= 0.5 - 0.5*Math.cos(2 * Math.PI * i / N)
  }
}
