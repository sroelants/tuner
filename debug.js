// TODO:
// - Render an FPS?
// - Render the spectral peak
// - Render the HPS peak
//
// Ideally, we want to have a couple of geometry primitives here
// - A `Rect` primitive
// - A way to get padded `Rect`s from other rects
// - A way to split up rects
// - A way to render a set of samples _inside_ a rect (Take care of all the clamping, etc...)
// - A way to render tics on a rect
//
// That way, we could just define the graph like:
// "Take the canvas, split it 30/70, render the audio in the first rect, render
// the spectrum in the second. Then add some ticks to the second"
//
// TODO:
// - Render an FPS?
// - Render the spectral peak
// - Render the HPS peak
//
// Ideally, we want to have a couple of geometry primitives here
// - A `Rect` primitive
// - A way to get padded `Rect`s from other rects
// - A way to split up rects
// - A way to render a set of samples _inside_ a rect (Take care of all the clamping, etc...)
// - A way to render tics on a rect
//
// That way, we could just define the graph like:
// "Take the canvas, split it 30/70, render the audio in the first rect, render
// the spectrum in the second. Then add some ticks to the second"
//
// # Robust pitch detection
// Looking at the spectral peak can be fragile: sometimes the fundamental can get overshadowed by harmonics
//
// Other methods:
// 1. Harmonic product spectrum
//   - If there's a peak at 1/2 of the maximum frequency, *and* the magnitude is
//     on the order of the max peak, then pick that one instead
// 2. Cepstrum analysis
// 3. Modulate with "likelihood" windows
// 4. Manually look for peaks (strong deviations from the average value, points
//    where the curve changes direction and same magnitude as the max value)
//
// Also worth improving the resolution either by zero padding or parabolic/gaussian interpolation around
// the identified maximum

import { nearestNote, getFundamental, label, width, height, vsplit, pad, drawFrame, render, harmonicProductSpectrum } from "./util.js";

const PADDING = 20;

/** @import { Rect } from "./util.js" */

/** @type {Rect} */
const CANVAS = { x1: 0, y1: 0, x2: 800, y2: 600 };

/** @type {CanvasRenderingContext2D} */
let ctx = document.getElementById("canvas").getContext("2d");
ctx.canvas.width = width(CANVAS);
ctx.canvas.height = height(CANVAS);


/**
 * Render debug information
 *
 * @param {Float32Array} samples - The audio signal
 * @param {Float32Array} spectrum - The frequency spectrum
 * @param {number} dt - The time interval since the last frame
 */
export function renderDebugInfo(samples, spectrum, dt) {
  ctx.clearRect(CANVAS.x1, CANVAS.y1, width(CANVAS), height(CANVAS));

  let fps = 1000/dt;

  let [samplesRect, spectraRect] = vsplit(CANVAS, 0.33);
  let [spectrumRect, hpsRect] = vsplit(spectraRect, 0.5);

  // Render samples
  samplesRect = pad(samplesRect, PADDING);
  drawFrame(ctx, samplesRect);
  label(ctx, samplesRect, "Audio");
  render(ctx, samplesRect, samples, { scale: 200, align: "center" });

  let bins = spectrum.length / 16;

  // Render spectrum (Only the first chunk)
  spectrumRect = pad(spectrumRect, PADDING);
  drawFrame(ctx, spectrumRect);
  label(ctx, spectrumRect, "Spectrum");
  render(ctx, spectrumRect, spectrum.slice(0, bins), { scale: 0.5 });

  // Render hps (Only the first chunk)
  let hps = harmonicProductSpectrum(spectrum);
  hpsRect = pad(hpsRect, PADDING);
  drawFrame(ctx, hpsRect);
  label(ctx, hpsRect, "Harmonic Product");
  render(ctx, hpsRect, hps.slice(0, bins), { scale: 0.00001 });

  let spectralMaxIdx = 0;

  for (let i = 0; i < spectrum.length; i++) {
    if (spectrum[i] > spectrum[spectralMaxIdx]) {
      spectralMaxIdx = i;
    }
  }

  let fSpectrum = getFundamental(spectrum);
  let fHps = getFundamental(hps);

  // Render extra info
  ctx.fillText(`FPS: ${fps.toFixed(0)}, f0: ${fSpectrum.toFixed(2)}, f0 (hps): ${fHps.toFixed(2)}, note: ${nearestNote(fSpectrum)} (${nearestNote(fHps)})`, CANVAS.x1, CANVAS.y2 - 5);
}
