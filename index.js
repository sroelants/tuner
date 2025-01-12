import { getFundamental, Transformer } from "./analyzer.js";
import { Renderer } from "./renderer.js";
import { SAMPLING_RATE } from "./constants.js";

let stream = navigator.mediaDevices.getUserMedia({ audio: { sampleRate: SAMPLING_RATE } });

/**
 * Run the tuner on a given input audio stream
 *
 * @param {MediaStream} stream The audio stream to feed to the tuner
 */
function run(stream) {
  let canvas = document.getElementById("canvas");
  let transformer = new Transformer(stream);
  let renderer = new Renderer(canvas);

  function tick() {
    requestAnimationFrame(tick);
    let fftData = transformer.getFftData();
    let {freq: f0, nearestNote: nearest, cents }  = getFundamental(fftData);
    console.log(`f0: ${f0}, nearest: ${nearest.value} (${nearest.name}), cents: ${cents}`);

    renderer.renderTuner(f0, nearest.value, cents);
  };

  tick();
}

stream.then(run);
