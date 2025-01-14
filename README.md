# Tuner

## Description

Use it to tune things.

> [!WARNING]
> Still a lot of kinks to iron out:
> 1. Crappy resolution
> 2. Frequencies are off on some microphones

## TODO

- [ ] Don't hardcode the sample rate to be 48000, because apparently it depends
  on the specific hardware
- [ ] Replace WebAudio FFT with custom FFT implementation
- [ ] Zero-pad the input signal to increase the frequency resolution
- [ ] Add Hamming/Hanning windowing?
- [ ] Make the UI less jumpy

