/**
 * The number of samples per second of the input stream
 *
 * Create a dummy AudioContext to figure out the machine's sampleRate
 * It's gross, but whatever.
 */
export const SAMPLING_RATE = new AudioContext().sampleRate;

/**
 * The amount of samples used in a single FFT window.
 *
 * This in part determines the frequency resolution.
 */
export const FFT_SIZE = 32 * 1024;

/**
 * The number of actual FFT bins.
 *
 * For real-valued functions, we only need half of the Fourier coefficients.
 */
export const BIN_COUNT = FFT_SIZE / 2;

/**
 * The number of downsampled signals to include in HPS (Harmonic Product
 * Spectrum)
 */
const N_HPS = 5;

/**
 * A list of pitch names and their associated frequencies
 *
 * TODO: Make this a function that can just derive the correct note name and 
 * register
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
 * @returns {string} The name of the nearest note
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

  return nearest;
}

/**
 * Find the difference between two pitches in cents
 *
 * @param {number} f1 The first pitch
 * @param {number} f2 The second pitch
 * @returns {number} The distance between the pitches in cents
 */
export function dCents(f1, f2) {
  return f2 > 0 ? 1200 * Math.log2(f1 / f2) : 0; 
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
 * Transform an array of FFT data into its Harmonic Product Spectrum, to help
 * identify the fundamental pitch.
 *
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
  let hps_len = Math.floor(BIN_COUNT / N_HPS);
  let hps = new Array(hps_len).fill(1.0);

  for (let stride = 1; stride < N_HPS; stride++) {
    for (let i = 0; i < hps_len; i++) {
      hps[i] *= data[i * stride];
    }
  }

  // Clear out anything < 50Hz since the HPS creates a bunch of noise in the
  // lower end.
  for (let i = 0; i < hps.length; i++) {
    if (binToHz(i) < 50) {
      hps[i] = 0;
    }
  }

  return hps;
}

/**
 * Given an array of FFT data, find the fundamental pitch.
 *
 * @param {Uint8Array} data
 * @returns {number} The fundamental pitch in Hz
 */
export function getFundamental(data) {
  let idx = maxIdx(harmonicProductSpectrum(data));
  return binToHz(idx);
}
