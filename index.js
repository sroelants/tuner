import { Analyzer } from "./analyzer.js";
import { Renderer } from "./renderer.js";

let stream = navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 48000 } });

/**
 * Run the tuner on a given input audio stream
 *
 * @param {MediaStream} stream The audio stream to feed to the tuner
 */
function run(stream) {
  let canvas = document.getElementById("canvas");
  let analyzer = new Analyzer(stream);
  let renderer = new Renderer(canvas);

  function tick() {
    requestAnimationFrame(tick);
    analyzer.refresh();
    renderer.render(analyzer.freqData);
  };

  tick();
}

function maxIdx(data) {
  let maxIdx = 0;
  let max = data[maxIdx];

  for (let i = 0; i < data.length; i++) {
    if (data[i] > max) {
      max = data[i];
      maxIdx = i;
    }
  }

  return maxIdx;
}

stream.then(run);
