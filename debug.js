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
//
// Also, worth just returning undefined if the maximal spectral value is below some cutoff
// (or the volume is below some cutoff?)

import {
  maxIdx,
  lineAt,
  drawMax,
  nearestNote,
  binToHz,
  findPitch,
  getFundamental,
  findSubharmonic,
  label,
  vsplit,
  pad,
  drawFrame,
  render,
  harmonicProductSpectrum,
  drawFundamental,
  interpolate,
  N_SAMPLES,
} from "./util.js";

const PADDING = 20;

/** @type {Rect} */
export const CANVAS = { x1: 0, y1: 0, x2: 800, y2: 600 };

/**
 * Render debug information
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Float32Array} samples - The audio signal
 * @param {Float32Array} spectrum - The frequency spectrum
 * @param {number} dt - The time interval since the last frame
 */
export function renderDebugInfo(ctx, samples, spectrum, dt) {
  clearCanvas(ctx);

  let fps = 1000 / dt;

  let [samplesRect, spectraRect] = vsplit(CANVAS, 0.33);
  let [spectrumRect, hpsRect] = vsplit(spectraRect, 0.5);

  // Render samples
  {
    samplesRect = pad(samplesRect, PADDING);
    drawFrame(ctx, samplesRect);
    label(ctx, samplesRect, "Audio");
    render(ctx, samplesRect, samples.slice(0, N_SAMPLES ), { scale: 200, align: "center" });
  }

  let bins = spectrum.length / 16;

  // Render spectrum (Only the first chunk)
  {
    let rect = pad(spectrumRect, PADDING);
    let data = spectrum.slice(0, bins);
    drawFrame(ctx, rect);
    label(ctx, rect, "Spectrum");
    render(ctx, rect, data, { scale: 0.5 });

    let max = maxIdx(data);
    lineAt(ctx, rect, data, max, "red");

    let f0 = interpolate(data, findSubharmonic(data, max));
    lineAt(ctx, rect, data, f0, "blue");
  }

  // Render hps (Only the first chunk)
  let hps = harmonicProductSpectrum(spectrum);

  {
    let rect = pad(hpsRect, PADDING);
    let data = hps.slice(0, bins);
    drawFrame(ctx, rect);
    label(ctx, rect, "Harmonic Product");
    render(ctx, rect, data, { scale: 0.00001 });

    let max = maxIdx(data);
    lineAt(ctx, rect, data, max, "red");

    let f0 = interpolate(data, findSubharmonic(data, max));
    lineAt(ctx, rect, data, f0, "blue");
  }

  let fSpectrum = binToHz(findPitch(spectrum));
  let fHps = binToHz(findPitch(hps));

  // Render extra info
  ctx.fillText(
    `FPS: ${fps.toFixed(0)}, f0: ${fSpectrum.toFixed(2)}, f0 (hps): ${fHps.toFixed(2)}, note: ${nearestNote(fSpectrum)[0]} (${nearestNote(fHps)[0]})`,
    CANVAS.x1,
    CANVAS.y2,
  );
}

export function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

class Plot {
  /** @type {HTMLDivElement} */
  container = document.createElement("div");
  /** @type {HTMLCanvasElement} */
  canvas = document.createElement("canvas");
  /** @type {CanvasRenderingContext2D} */
  ctx = this.canvas.getContext("2d");
  /** @type {number} */
  width = 800;
  /** @type {number} */
  height = 300;
  /** @type {number} */
  scaleX = 1;
  /** @type {number} */
  scaleY = 1;
  /** @type {number} */
  minY = 0;
  /** @type {number} */
  maxY = 1;
  /** @type {"top" | "center" | "bottom"} */
  align = "bottom";

  /** @type {Iterable<number>} */
  data = [];

  /**
   * @param {Object} params
   * @param {number} [params.width]
   * @param {number} [params.height]
   */
  constructor(params) {
    this.container.className = "plot";
    this.width = params.width ?? this.width;
    this.height = params.height ?? this.height;
  }

  label(l) {
    this.label = l;
  }

  render() {
    ctx.strokeRect(0, 9, this.width, this.height);
  }
}
