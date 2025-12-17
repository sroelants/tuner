const PADDING = 10;

/** @type {CanvasRenderingContext2D} */
let ctx = document.getElementById("canvas").getContext("2d");

ctx.canvas.width = 800
ctx.canvas.height = 400;

export function renderDebugInfo(samples, spectrum) {
  ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);

  // Render samples
  const SAMPLES_X1 = 0 + PADDING;
  const SAMPLES_Y1 = 0 + PADDING;
  const SAMPLES_X2 = ctx.canvas.width - PADDING;
  const SAMPLES_Y2 = ctx.canvas.height / 2 - PADDING;
  const SAMPLES_WIDTH = SAMPLES_X2 - SAMPLES_X1;
  const SAMPLES_HEIGHT = SAMPLES_Y2 - SAMPLES_Y1;
  const MID_Y = (SAMPLES_Y1 + SAMPLES_Y2)/2;
  const SCALE = 500;

  ctx.strokeRect(SAMPLES_X1, SAMPLES_Y1, SAMPLES_WIDTH, SAMPLES_HEIGHT);

  ctx.beginPath();
  ctx.moveTo(SAMPLES_X1, MID_Y);

  for (let i = 0; i < samples.length; i++) {
    let x = SAMPLES_X1 + i / samples.length * SAMPLES_WIDTH
    let y = clamp(MID_Y + SCALE * samples[i], SAMPLES_Y1, SAMPLES_Y2);
    ctx.lineTo(x, y, 1, 1);
  }
  // ctx.closePath();
  ctx.stroke();


  // Render samples
  const SPECTRUM_X1 = 0 + PADDING;
  const SPECTRUM_Y1 = ctx.canvas.height / 2 + PADDING;
  const SPECTRUM_X2 = ctx.canvas.width - PADDING;
  const SPECTRUM_Y2 = ctx.canvas.height - PADDING;
  const SPECTRUM_WIDTH = SPECTRUM_X2 - SPECTRUM_X1;
  const SPECTRUM_HEIGHT = SPECTRUM_Y2 - SPECTRUM_Y1;
  const SPECTRUM_LEN = spectrum.length / 16;

  ctx.strokeRect(SPECTRUM_X1, SPECTRUM_Y1, SPECTRUM_WIDTH, SPECTRUM_HEIGHT);

  ctx.beginPath();
  ctx.moveTo(SPECTRUM_X1, SPECTRUM_Y2);


  for (let i = 0; i < SPECTRUM_LEN; i++) {
    let x = SPECTRUM_X1 + i / SPECTRUM_LEN * SPECTRUM_WIDTH
    let y = clamp(SPECTRUM_Y2 - spectrum[i], SPECTRUM_Y1, SPECTRUM_Y2);
    ctx.lineTo(x, y, 1, 1);
  }

  ctx.stroke();

  // Render spectrum tics (toggle between regular tics and notes?)
  // Add (render) spectrum peak
  // Add (render) HPS peak
}

function clamp(value, min, max) {
  return Math.max(Math.min(value, max), min);
}
