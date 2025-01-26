# Tuner

Use it to tune things.

> [!WARNING]
> This is a WIP. The resolution is still quite crap.

## TODO

- [x] Don't hardcode the sample rate to be 48000, because apparently it depends
  on the specific hardware
- [ ] Replace WebAudio FFT with custom FFT implementation
- [ ] Zero-pad the input signal to increase the frequency resolution
- [ ] Add Hamming/Hanning windowing?
- [ ] Make the UI less jumpy

## Building the project
The FFT implementation is written in Zig and must be compiled to WASM first:

```sh
zig build-exe fft.zig -target wasm32-freestanding -fno-entry --export=fft -O ReleaseFast
```
