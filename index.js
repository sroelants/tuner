import { fft } from "./fft.js";
import { WINDOW_SIZE } from "./util.js";
import { AudioStreamSource } from "./source.js";
import { renderDebugInfo } from "./debug.js"

// Get samples
let samples = new Float32Array(WINDOW_SIZE);

let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
let audioSource = AudioStreamSource(stream);

function tick() {
  audioSource.getSamples(samples);
  let spectrum = fft(samples);

  renderDebugInfo(samples, spectrum);
  requestAnimationFrame(tick)
}

requestAnimationFrame(tick);
