import { AudioStreamSource } from "./source.js";
import { renderTuner, renderDebugInfo } from "./render.js";
import { fft, WINDOW_SIZE } from "./analysis.js";

let renderDebug = false;

// Get samples
const samples = new Float32Array(WINDOW_SIZE);
let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
let source = AudioStreamSource(stream);

let previousTime = performance.now();

function tick(time) {
  let dt = time - previousTime;
  previousTime = time;

  source.getSamples(samples);
  let spectrum = fft(samples);

  if (renderDebug) {
    renderDebugInfo(samples, spectrum, dt);
  } else {
    renderTuner(spectrum);
  }

  requestAnimationFrame(tick);
}

document.addEventListener("pointerdown", () => renderDebug = !renderDebug);
document.addEventListener("keydown", event => {
  if (event.key === "d") renderDebug = !renderDebug;
});


requestAnimationFrame(tick);
