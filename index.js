import { Transformer } from "./fft.js";
import { getFundamental, dCents, nearestNote, SAMPLING_RATE, NOTES } from "./util.js";

let stream = await navigator.mediaDevices.getUserMedia({ 
  audio: { sampleRate: SAMPLING_RATE } 
});

run(stream);

/**
 * Run the tuner on a given input audio stream
 *
 * @param {MediaStream} stream The audio stream to feed to the tuner
 */
function run(stream) {
  let container = document.getElementById("container");
  let transformer = new Transformer(stream);

  function tick() {
    requestAnimationFrame(tick);
    let fftData = transformer.fft();
    let f0 = getFundamental(fftData);
    let nearestName = nearestNote(f0);
    let nearestValue = NOTES[nearestName];
    let cents = dCents(f0, nearestValue);
    render(container, f0, nearestValue, nearestName, cents);
  };

  tick();
}


/**
 * Render the tuner UI
 *
 * @param {HTMLElement} container
 * @param {number} f0
 * @param {number} nearest
 * @param {string} name
 * @param {number} cents
 */
export function render(container, f0, nearest, name, cents) {
  container.innerHTML = `
  <div class="note-name">${name}</div>
  <div>
    <span>${f0.toFixed(1)}Hz</span>/${nearest.toFixed(1)}Hz (${cents.toFixed(1)} cts)
  </div>
  `;
}
