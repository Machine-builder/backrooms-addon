import { makeNoise2D, Noise2D } from "open-simplex-noise/lib/2d";

export class Noise2d {
    noise: Noise2D;
    scale: number;

    constructor(seed: number, scale: number = 1.0) {
        this.noise = makeNoise2D(seed);
        this.scale = scale;
    }

    sample(x: number, y: number): number {
        return (this.noise(x*this.scale, y*this.scale)+1)/2;
    }
}

export class MultiNoise2d {
    noise: Noise2D[];
    scale: number;
    octaves: number;

    constructor(seed: number, scale: number = 1.0, octaves: number = 1) {
        this.noise = [];
        for (let i = 0; i < octaves; i++) {
            this.noise.push(makeNoise2D(seed + i*999)); // offset seed for each octave
        }
        this.scale = scale;
        this.octaves = octaves;
    }

    sample(x: number, y: number): number {
        let total = 0;
        let amplitude = 1;
        let maxAmplitude = 0;
        let frequency = this.scale;

        for (let i = 0; i < this.octaves; i++) {
            const noiseFn = this.noise[i];
            total += noiseFn(x * frequency, y * frequency) * amplitude;
            maxAmplitude += amplitude;

            frequency *= 2;      // scale increases
            amplitude /= 2;      // amplitude decreases
        }

        // Normalize and convert to [0, 1]
        return (total / maxAmplitude + 1) / 2;
    }
}