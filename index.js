/** @import { Rect } from "./util.js" */
import { fft } from "./fft.js";
import { getFundamental, harmonicProductSpectrum, nearestNote, maxIdx, WINDOW_SIZE, width, height } from "./util.js";
import { AudioStreamSource } from "./source.js";
import { CANVAS, renderDebugInfo } from "./debug.js";

let container = document.getElementById("container");
let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
ctx.canvas.width = width(CANVAS);
ctx.canvas.height = height(CANVAS);

let renderDebug = false;

// Get samples
let samples = new Float32Array(WINDOW_SIZE);

let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
let audioSource = AudioStreamSource(stream);

let noteContainer = document.createElement("div");
noteContainer.className = "note-name";
container.appendChild(noteContainer);

let previousTime = performance.now();

function debugTick(time) {
  let dt = time - previousTime;
  previousTime = time;

  audioSource.getSamples(samples);
  let spectrum = fft(samples);

  renderDebugInfo(ctx, samples, spectrum, dt)

  if (renderDebug) {
    requestAnimationFrame(debugTick)
  } else {
    requestAnimationFrame(tick);
  }
}

function tick() {
  audioSource.getSamples(samples);
  let spectrum = fft(samples);
  let idx = maxIdx(spectrum);
  let max = spectrum[idx];

  if (max < 50) {
    noteContainer.innerText = "";
    requestAnimationFrame(tick)
    return;
  }

  let hps = harmonicProductSpectrum(spectrum);
  let pitch = getFundamental(hps);
  let nearest = nearestNote(pitch);
  noteContainer.innerText = nearest;

  if (renderDebug) {
    requestAnimationFrame(debugTick)
  } else {
    requestAnimationFrame(tick);
  }
}

requestAnimationFrame(tick);

function toggleDebug() {
  if (renderDebug) {
    container.removeChild(canvas);
    container.appendChild(noteContainer)
  } else {
    container.removeChild(noteContainer)
    container.appendChild(canvas);
  }

  renderDebug = !renderDebug;
}

document.addEventListener("keydown", event => {
  if (event.key === "d") toggleDebug()
});

document.addEventListener("pointerdown", toggleDebug);
