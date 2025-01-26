const std = @import("std");
const Complex = std.math.complex.Complex(f32);
const exp = std.math.complex.exp;
const pi = std.math.pi;
const im = Complex.init(0, 1.0);

export fn fft(
    input: [*]f32, 
    output: [*]Complex, 
    len: i32, 
) void {
    const N: usize = @intCast(len);
    cooley_tukey(input[0..N], output[0..2*N], 1);
}

fn cooley_tukey(input: []f32, output: []Complex, stride: usize) void {
    const N = output.len;

    // Base case: If there is only a single element, copy it over directly
    if (N == 1) {
        output[0] = Complex.init(input[0], 0);
        return;
    }

    cooley_tukey(input, output[0..N/2], 2 * stride);
    cooley_tukey(input[stride..], output[N/2..], 2 * stride);

    for (0..N/2) |k| {
        const k_f32: f32 = @floatFromInt(k);
        const N_f32: f32 = @floatFromInt(N);
        const phase = 2.0 * pi * k_f32 / N_f32;
        const z: Complex = Complex.init(0, phase);

        const p = output[k];
        const q = exp(z).mul(output[k + N/2]);
        output[k] = p.add(q);
        output[k + N/2] = p.sub(q);
    }
}
