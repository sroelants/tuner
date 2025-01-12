/**
 * Get the index of the max element in an array
 *
 * @param {Array} array The array to find the max index for.
 */
export function maxIdx(array) {
  let maxIdx = 0;
  let max = array[maxIdx];

  for (let i = 0; i < array.length; i++) {
    if (array[i] > max) {
      max = array[i];
      maxIdx = i;
    }
  }

  return maxIdx;
}

export const MIN_FREQ = 65;
export const MAX_FREQ = 2093;

const NOTES = [
  { name: "C2", value: 65.406 },
  { name: "C#2/Db2", value: 69.296 },
  { name: "D2", value: 73.416 },
  { name: "D#2/Eb2", value: 77.796 },
  { name: "E2", value: 82.406 },
  { name: "F2", value: 87.308 },
  { name: "F#2/Gb2", value: 92.498 },
  { name: "G2", value: 97.998 },
  { name: "G#2/Ab2", value: 103.826 },
  { name: "A2", value: 110 },
  { name: "A#2/Bb2", value: 116.54 },
  { name: "B2", value: 123.472 },
  { name: "C3", value: 130.812 },
  { name: "C#3/Db3", value: 138.592 },
  { name: "D3", value: 146.832 },
  { name: "D#3/Eb3", value: 155.592 },
  { name: "E3", value: 164.812 },
  { name: "F3", value: 174.616 },
  { name: "F#3/Gb3", value: 184.996 },
  { name: "G3", value: 195.996 },
  { name: "G#3/Ab3", value: 207.652 },
  { name: "A3", value: 220 },
  { name: "A#3/Bb3", value: 233.08 },
  { name: "B3", value: 246.944 },
  { name: "C4", value: 261.624 },
  { name: "C#4/Db4", value: 277.184 },
  { name: "D4", value: 293.664 },
  { name: "D#4/Eb4", value: 311.184 },
  { name: "E4", value: 329.624 },
  { name: "F4", value: 349.232 },
  { name: "F#4/Gb4", value: 369.992 },
  { name: "G4", value: 391.992 },
  { name: "G#4/Ab4", value: 415.304 },
  { name: "A4", value: 440 },
  { name: "A#4/Bb4", value: 466.16 },
  { name: "B4", value: 493.888 },
  { name: "C5", value: 523.248 },
  { name: "C#5/Db5", value: 554.368 },
  { name: "D5", value: 587.328 },
  { name: "D#5/Eb5", value: 622.368 },
  { name: "E5", value: 659.248 },
  { name: "F5", value: 698.464 },
  { name: "F#5/Gb5", value: 739.984 },
  { name: "G5", value: 783.984 },
  { name: "G#5/Ab5", value: 830.608 },
  { name: "A5", value: 880 },
  { name: "A#5/Bb5", value: 932.32 },
  { name: "B5", value: 987.776 },
  { name: "C6", value: 1046.496 },
  { name: "C#6/Db6", value: 1108.736 },
  { name: "D6", value: 1174.656 },
  { name: "D#6/Eb6", value: 1244.736 },
  { name: "E6", value: 1318.496 },
  { name: "F6", value: 1396.928 },
  { name: "F#6/Gb6", value: 1479.968 },
  { name: "G6", value: 1567.968 },
  { name: "G#6/Ab6", value: 1661.216 },
  { name: "A6", value: 1760 },
  { name: "A#6/Bb6", value: 1864.64 },
  { name: "B6", value: 1975.552 },
  { name: "C7", value: 2092.992 },
];

export function nearestNote(freq) {
  let nearest = NOTES[0];

  for (let note of NOTES) {
    let dCurrent = Math.abs(note.value - freq);
    let dNearest = Math.abs(nearest.value - freq);
    if (dCurrent < dNearest) {
      nearest = note;
    }
  }

  return nearest;
}

export function dCents(f1, f2) {
  return 1200 * Math.log2(f1 / f2);
}
