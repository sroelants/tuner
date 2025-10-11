// Rough steps:
// - [x] Simple input
// - [x] Print input (render to canvas?)
// - [ ] Print additional information?
// - [ ] Implement simple FFT with WebAudioAPI? (Is that even possible? Or does it require a Stream?)
// - [ ] Optional: Implement naive DFT?
// - [ ] Implement simple FFT in Javascript. Make sure we get the correct results
// - [ ] Render the waveform *and* spectrum side by side, with stats
// - [ ] Run in loop
// - [ ] Use AudioStream to write bytes into buffer, instead of fixed signal
// - [ ] Implement in Zig/Wasm
//   - [ ] Implementation that simply copies input to output
//   - [ ] Implementation that performs FFT on input

import { WINDOW_SIZE } from "./util.js";
const FREQ = 400;

let container = document.getElementById("container");
render(container);
let samples = getSamples();
renderCanvas(samples);

/**
 * Render the tuner UI
 *
 * @param {HTMLElement} container
 * @param {number} f0
 * @param {number} nearest
 * @param {string} name
 * @param {number} cents
 */
export function render(container) {
  container.innerHTML = `
    <div class="note-name">Hello</div>
    <div>
      <span>there</span>
    </div>
  `;
}

export function getSamples() {
  const samples = new Float32Array(WINDOW_SIZE);

  for (let i = 0; i < samples.length; i++) {
    samples[i] = 50 * Math.sin(2 * Math.PI * FREQ * i / WINDOW_SIZE);
  }

  return samples
}

/**
 * Render a buffer of samples to the canvas
 *
 * @param {Float32Array} samples The buffer of samples
 */
export function renderCanvas(samples) {
  let ctx = document.getElementById("canvas").getContext("2d");
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  ctx.beginPath();
  ctx.moveTo(0, ctx.canvas.height/2);

  for (let i = 0; i < samples.length; i++) {
    ctx.lineTo(i, ctx.canvas.height/2 + samples[i], 1, 1);
  }

  ctx.stroke();
}
