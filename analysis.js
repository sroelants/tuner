import { clamp } from "./math.js";

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

/**
 * A list of pitch names and their associated frequencies
 *
 * TODO: Make this a function that can just derive the correct note name and
 * register from a reference pitch (A4 = 440Hz)
 */
export const NOTES = {
  "-": 0.0,
  "C2": 65.406,
  "C#2": 69.296,
  "D2": 73.416,
  "D#2": 77.796,
  "E2": 82.406,
  "F2": 87.308,
  "F#2": 92.498,
  "G2": 97.998,
  "G#2": 103.826,
  "A2": 110,
  "A#2": 116.54,
  "B2": 123.472,
  "C3": 130.812,
  "C#3": 138.592,
  "D3": 146.832,
  "D#3": 155.592,
  "E3": 164.812,
  "F3": 174.616,
  "F#3": 184.996,
  "G3": 195.996,
  "G#3": 207.652,
  "A3": 220,
  "A#3": 233.08,
  "B3": 246.944,
  "C4": 261.624,
  "C#4": 277.184,
  "D4": 293.664,
  "D#4": 311.184,
  "E4": 329.624,
  "F4": 349.232,
  "F#4": 369.992,
  "G4": 391.992,
  "G#4": 415.304,
  "A4": 440,
  "A#4": 466.16,
  "B4": 493.888,
  "C5": 523.248,
  "C#5": 554.368,
  "D5": 587.328,
  "D#5": 622.368,
  "E5": 659.248,
  "F5": 698.464,
  "F#5": 739.984,
  "G5": 783.984,
  "G#5": 830.608,
  "A5": 880,
  "A#5": 932.32,
  "B5": 987.776,
  "C6": 1046.496,
  "C#6": 1108.736,
  "D6": 1174.656,
  "D#6": 1244.736,
  "E6": 1318.496,
  "F6": 1396.928,
  "F#6": 1479.968,
  "G6": 1567.968,
  "G#6": 1661.216,
  "A6": 1760,
  "A#6": 1864.64,
  "B6": 1975.552,
  "C7": 2092.992,
};

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
 * Find the note nearest to the provided frequency
 *
 * @param {number} freq The frequency to quantize to the nearest note
 * @returns {[string, number]} The name of the nearest note
 */
export function nearestNote(freq) {
  let nearest = "-";

  for (let current in NOTES) {
    let dCurrent = Math.abs(NOTES[current] - freq);
    let dNearest = Math.abs(NOTES[nearest] - freq);

    if (dCurrent < dNearest) {
      nearest = current;
    }
  }

  return [nearest, NOTES[nearest]];
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
