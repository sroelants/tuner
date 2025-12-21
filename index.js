import { fft } from "./fft.js";
import { harmonicProductSpectrum, nearestNote, maxIdx, WINDOW_SIZE, width, height, center, dCents, interpolate, binToHz, findPitch } from "./util.js";
import { AudioStreamSource } from "./source.js";
import { CANVAS, clearCanvas, renderDebugInfo } from "./debug.js";

let container = document.getElementById("container");
let canvas = document.createElement("canvas");
container.appendChild(canvas);
let ctx = canvas.getContext("2d");
ctx.canvas.width = width(CANVAS);
ctx.canvas.height = height(CANVAS);

let renderDebug = false;

// Get samples
let samples = new Float32Array(WINDOW_SIZE);
console.log(`Resolution: ${binToHz(1).toFixed(2)}Hz`);

let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
let audioSource = AudioStreamSource(stream);

let previousTime = performance.now();

function tick(time) {
  let dt = time - previousTime;
  previousTime = time;

  audioSource.getSamples(samples);
  let spectrum = fft(samples);

  if (renderDebug) {
    renderDebugInfo(ctx, samples, spectrum, dt);
  } else {
    renderTuner(spectrum);
  }

  requestAnimationFrame(tick);
}

function renderTuner(spectrum) {
  clearCanvas(ctx);
  ctx.save();

  let idx = maxIdx(spectrum);
  let max = spectrum[idx];

  if (max < 75) {
    return;
  }

  let hps = harmonicProductSpectrum(spectrum);
  let pitch = binToHz(findPitch(hps));

  let [nearestName, nearestPitch] = nearestNote(pitch);
  let cents = dCents(pitch, nearestPitch);

  ctx.fillStyle = Math.abs(cents) < 10 ?  "rgb(56 178 172)" : "rgb(51 65 85)";
  ctx.strokeStyle = "rgb(51 65 85)";
  ctx.font = "bold 48px sans-serif";

  let textSize = ctx.measureText(nearestName);
  let midpoint = center(CANVAS);

  ctx.fillText(
    nearestName,
    midpoint.x - textSize.width / 2,
    midpoint.y,
  );

  ctx.beginPath();
  ctx.moveTo(midpoint.x - 100, midpoint.y + 30);
  ctx.lineTo(midpoint.x + 100, midpoint.y + 30);
  ctx.stroke()

  ctx.beginPath();
  ctx.ellipse(midpoint.x + 2 * cents, midpoint.y + 30, 10, 10, 0, 0, 2*Math.PI);
  ctx.fill();

  ctx.restore();
}


function toggleDebug() {
  renderDebug = !renderDebug;
}

document.addEventListener("keydown", event => {
  if (event.key === "d") toggleDebug()
});

document.addEventListener("pointerdown", toggleDebug);

requestAnimationFrame(tick);
