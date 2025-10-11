// Stuff for grabbing audio bytes
// Idea:
// Grab a `MediaRecorder` that's wired up to the microphone
// copy over chunks into the input array. Don't worry about cyclic for now,
// just grab a second of data, copy over the nearest power of 2 into the
// input array, and grab the FFT

/**
 * Capture a second of audio
 *
 * @returns {Promise<Float32Array>}
 */
let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
let recorder = MediaRecorder(stream);

const captureAudio = async () => {
  recorder.start(1000);
};

