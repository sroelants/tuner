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
  cooleyTukey(samples, even, N/2, start,            2 * stride);
  cooleyTukey(samples, odd,  N/2, start + stride,   2 * stride);

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
