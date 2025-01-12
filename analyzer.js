export class Analyzer {
  /**
   * The AudioContext used to analyze the input stream
   *
   * @type AudioContext
   */
  ctx = new AudioContext();

  /**
   * The source node in the audio graph
   *
   * @type MediaStreamNode
   */
  source;

  /**
   * The Analyzer node
   * 
   * @type AnalyserNode
   */
  analyzer;

  /**
   * The current time data
   *
   * @type Uint8Array
   */
  timeData

  /**
   * The current fft data
   *
   * @type Uint8Array
   */
  freqData

  /**
   * Create an Analyzer that can be used to perform FFT and pitch detection on
   * a provided input stream.
   *
   * @param {MediaStream} stream The input stream
   */
  constructor(stream) {
    this.source = this.ctx.createMediaStreamSource(stream);
    this.analyzer = this.ctx.createAnalyser();
    this.source.connect(this.analyzer);

    this.analyzer.fftSize = 4096;
    const bufferLength = this.analyzer.frequencyBinCount;
    this.timeData = new Uint8Array(bufferLength);
    this.freqData = new Uint8Array(bufferLength);
    this.analyzer.getByteTimeDomainData(this.timeData);
    this.analyzer.getByteFrequencyData(this.freqData);
  }

  refresh() {
    this.analyzer.getByteTimeDomainData(this.timeData);
    this.analyzer.getByteFrequencyData(this.freqData);
  }
}
