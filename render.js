/** @import { Rect } from "./math.js" */
import { N_SAMPLES } from "./source.js";
import { clamp, center, vsplit, pad, width, height } from "./math.js";
import { maxIdx, harmonicProductSpectrum, binToHz, findPitch, nearestNote, dCents, interpolate, findSubharmonic } from "./analysis.js";
const PADDING = 20;
const SIGNAL_THRESHOLD = 10;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
ctx.canvas.width = 800;
ctx.canvas.height = 600;
document.getElementById("container").appendChild(canvas);

/** @type {Rect} */
export const CANVAS = { x1: 0, y1: 0, x2: ctx.canvas.width, y2: ctx.canvas.height };

/**
 * Render the provided rect as a frame
 * @param {Rect} rect - The rectangle to frame
 * @param {string} [label] - An optional label to render alongside the frame
 */
export function drawFrame(rect, label) {
  ctx.strokeRect(rect.x1, rect.y1, width(rect), height(rect));
  ctx.fillText(label, rect.x1, rect.y1 - 5);
}

/**
 * Render the provided data inside the desired rectangle bounds
 *
 * @param {Rect} rect - The rectangle to render the data into
 * @param {Float32Array} data - The data to render
 * @param {Object} opts - Any additional options
 * @param {number} opts.scale - The value to scale the y-values by
 * @param {"bottom" | "center" | "top"} opts.align - How to align the data
 */
export function renderData(rect, data, opts = {}) {
  let { scale = 1, align ="bottom" } = opts;

  ctx.beginPath();

  let yStart = align === "center" ? (rect.y1 + rect.y2) / 2
      : align === "top"           ? rect.y1
      : rect.y2;

  ctx.moveTo(rect.x1, yStart);

  for (let i = 0; i < data.length; i++) {
    let x = rect.x1 + i / data.length * width(rect);
    let y = align === "bottom"
        ? clamp(yStart - scale * data[i], rect.y1, rect.y2)
        : clamp(yStart + scale * data[i], rect.y1, rect.y2);
    ctx.lineTo(x, y, 1, 1);
  }

  ctx.stroke();
}

/**
 * Render a line within the given rect, at position `x`, with the desired label
 *
 * @param {Rect} rect
 * @param {number} x
 * @param {string} label
 * @param {string} [color]
 */
export function line(rect, x, label, color = "red") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  ctx.fillText(label, rect.x1 + x, rect.y2 + 10)

  ctx.beginPath();
  ctx.moveTo(rect.x1 + x, rect.y2);
  ctx.lineTo(rect.x1 + x, rect.y1);
  ctx.stroke();

  ctx.restore();
}

/**
 * Render a vertical line at a given index, marking the corresponding frequency
 *
 * @param {Rect} rect
 * @param {Float32Array} data
 * @param {number} idx
 * @param {string} label
 * @param {string} [color]
 */
export function lineAt(rect, data, idx, color = "red") {
  let freq = binToHz(idx).toFixed(2);
  let x = idx / data.length * width(rect);
  line(rect, x, `${freq}`, color);
}

/**
 * Clear the canvas
 */
export function clearCanvas() {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Render debug information
 *
 * @param {Float32Array} samples - The audio signal
 * @param {Float32Array} spectrum - The frequency spectrum
 * @param {number} dt - The time interval since the last frame
 */
export function renderDebugInfo(samples, spectrum, dt) {
  clearCanvas();

  let fps = 1000 / dt;

  let [samplesRect, spectraRect] = vsplit(CANVAS, 0.33);
  let [spectrumRect, hpsRect] = vsplit(spectraRect, 0.5);
  samplesRect = pad(samplesRect, PADDING);
  spectrumRect = pad(spectrumRect, PADDING);
  hpsRect = pad(hpsRect, PADDING);

  // Render frames
  drawFrame(samplesRect, "Audio");
  drawFrame(spectrumRect, "Spectrum");
  drawFrame(hpsRect, "Harmonic Product");

  let idx = maxIdx(spectrum);
  let max = spectrum[idx];
  let bins = spectrum.length / 16;

  // Render samples
  renderData(samplesRect, samples.slice(0, N_SAMPLES ), { scale: 200, align: "center" });

  // Render extra info
  ctx.fillText(`FPS: ${fps.toFixed(0)}`, CANVAS.x1, CANVAS.y2);


  // Don't attempt to render spectral data unless there's an appreciable signal
  if (max < SIGNAL_THRESHOLD) {
    return;
  }

  // Render spectrum (Only the first chunk)
  {
    let data = spectrum.slice(0, bins);
    renderData(spectrumRect, data, { scale: 0.5 });

    let max = maxIdx(data);
    lineAt(spectrumRect, data, max, "red");

    let f0 = interpolate(data, findSubharmonic(data, max));
    lineAt(spectrumRect, data, f0, "blue");
  }

  // Render hps (Only the first chunk)
  {
    let hps = harmonicProductSpectrum(spectrum);
    let data = hps.slice(0, bins);
    renderData(hpsRect, data, { scale: 0.00001 });

    let max = maxIdx(data);
    lineAt(hpsRect, data, max, "red");

    let f0 = interpolate(data, findSubharmonic(data, max));
    lineAt(hpsRect, data, f0, "blue");
  }

}

const smoothPitch = smooth(findPitch);

/**
 * Given the provided spectrum data, render the default tuner UI
 *
 * @param {Float32Array} spectrum
 */
export function renderTuner(spectrum) {
  clearCanvas();
  ctx.save();
  ctx.strokeStyle = "rgb(51 65 85)";
  ctx.font = "bold 48px sans-serif";
  let placeholder = "A4";
  let midpoint = center(CANVAS);

  // Render skeleton UI first
  ctx.beginPath();
  ctx.moveTo(midpoint.x - 100, midpoint.y + 30);
  ctx.lineTo(midpoint.x + 100, midpoint.y + 30);
  ctx.stroke()

  let idx = maxIdx(spectrum);
  let max = spectrum[idx];

  // Only render actual tuning stuff if there's an appreciable signal
  if (max < SIGNAL_THRESHOLD) {
    ctx.fillStyle = "#99a1af";
    let textSize = ctx.measureText(placeholder);

    ctx.fillText(
        placeholder,
        midpoint.x - textSize.width / 2,
        midpoint.y,
    );

    ctx.restore();
    return;
  }

  let hps = harmonicProductSpectrum(spectrum);
  let pitch = smoothPitch(hps);

  let [nearestName, nearestPitch] = nearestNote(pitch);
  let cents = dCents(pitch, nearestPitch);

  ctx.fillStyle = Math.abs(cents) < 5 ?  "rgb(56 178 172)" : "rgb(51 65 85)";

  let textSize = ctx.measureText(nearestName);

  ctx.fillText(
    nearestName,
    midpoint.x - textSize.width / 2,
    midpoint.y,
  );

  ctx.beginPath();
  ctx.ellipse(midpoint.x + 2 * cents, midpoint.y + 30, 10, 10, 0, 0, 2*Math.PI);
  ctx.fill();

  ctx.restore();
}

/**
 * Return a "smoothed" version of the provided function that washes out any jitter
 * by returning a running average.
 *
 * @param {(x: T) => number} callback - The function to smoothen
 * @param {number} t - The weight to use in the runnnig average
 * @returns {(x: T) => number} The smoothed callback
 */
function smooth(callback, t = 0.1) {
  let prev = 0;

  return (x) => {
    let val = callback(x);
    let diff = Math.abs(val - prev) / ((val + prev) / 2);

    // If the difference between the new value and the previous one is
    // appreciable, simply jump to the new value
    if (diff > 0.1) {
      return prev = val;
    }

    return prev = (1 - t) * prev + t * val;
  }
}
