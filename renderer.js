import { MIN_FREQ, MAX_FREQ } from "./util.js";

export class Renderer {
  /**
   * The canvas HTML element we render into
   *
   * @type HTMLCanvasElement
   */
  canvas;

  /**
   * The canvas rendering context to use for rendering
   * 
   * @type Canvas2dRenderingContext
   */
  ctx;

  /**
   * Create a Renderer object mounted to the provided canvas element
   *
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  /**
   * Render out FFT data
   *
   * @param {Uint8Array} data The FFT bins to render
   */
  render(data, maxIdx) {
    this.ctx.fillStyle = "rgb(200 200 200)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "rgb(0 0 0)";

    this.ctx.beginPath();

    const sliceWidth = (this.canvas.width * 1.0) / data.length;

    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = this.canvas.height - (v * this.canvas.height) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.lineTo(this.canvas.width, this.canvas.height);
    this.ctx.stroke();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.fillStyle = "red";
    let maxX = maxIdx * sliceWidth;
    let maxY = this.freqHeight(data[maxIdx]);
    this.ctx.ellipse(maxX, maxY, 10, 10, 0, 0, 2*Math.PI);
    this.ctx.fill();
    this.ctx.closePath();
  }

  renderTuner(fundamental, nearest, cents) {
    this.ctx.fillStyle = "rgb(200 200 200)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    let x = 0.5 * this.canvas.width * (100 + cents) / 100;
    let y = this.canvas.height / 2;

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "rgb(0 0 0)";
    this.ctx.beginPath();
    this.ctx.moveTo(0.25 * this.canvas.width, y);
    this.ctx.lineTo(0.75 * this.canvas.width, y);
    this.ctx.stroke()
    this.ctx.closePath();

    // Render circle
    if (fundamental >= MIN_FREQ && fundamental <= MAX_FREQ) {
      this.ctx.fillStyle = "black";
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, 10, 10, 0, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.closePath();
    }
  }

  freqHeight(val) {
    return this.canvas.height * (1 - val / 256.0);
  }
}
