import { WINDOW_SIZE } from "./util.js";
import { AudioStreamSource } from "./source.js";

/** @type {CanvasRenderingContext2D} */
let ctx = document.getElementById("canvas").getContext("2d");

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

// Get samples
let samples = new Float32Array(WINDOW_SIZE);

let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
let audioSource = AudioStreamSource(stream);

// TODO: Make this rendering a little fancier
// Render samples
function tick() {
  audioSource.getSamples(samples);
  let spectrum = fft(samples);

  ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
  renderCanvas(samples, 0.25, 1000);
  renderCanvas(spectrum, 0.75, 1);

  requestAnimationFrame(tick)
}

requestAnimationFrame(tick);

/**
 * Render a buffer of samples to the canvas
 *
 * @param {Float32Array} samples The buffer of samples
 */
export function renderCanvas(samples, height, scale) {
  ctx.beginPath();
  ctx.moveTo(0, height*ctx.canvas.height);

  for (let i = 0; i < samples.length / 16; i++) {
    ctx.lineTo(i, height * ctx.canvas.height - scale * samples[i], 1, 1);
  }

  ctx.stroke();
}
