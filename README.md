# Tuner

Use it to tune things.

> [!WARNING]
> This is a WIP. The resolution is still quite crap.

## TODO
- [x] Hand-written FFT implementation
- [ ] Polish up debug info
      - [ ] Audio stream
      - [ ] Spectrum (Add axis labels for frequencies and/or notes?)
      - [ ] Identify spectrum peak
      - [ ] Identify Harmonic product peak
- [ ] Render the actual pitch
- [ ] Use bigger (circular?) buffer that we write chunks into from the MediaStream
- [ ] Support instruments/tunings to get more accurate results?
- [ ] Swap out FFT implementation with a Zig/Wasm implementation
- [ ] Reduce allocations

