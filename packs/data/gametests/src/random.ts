export default class Random {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  random(): number {
    let t = (this.state += 0x6d2b79f5);

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  randint(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.random() * arr.length)];
  }

  choiceWeighted<T>(arr: T[], weights: number[]): T {
    if (arr.length === 0) {
      throw new Error("Cannot choose from an empty array.");
    }

    if (arr.length !== weights.length) {
      throw new Error("Array and weights arrays must be the same length.");
    }

    let totalWeight = 0;

    for (const weight of weights) {
      if (weight > 0) {
        totalWeight += weight;
      }
    }

    if (totalWeight <= 0) {
      throw new Error("Total weight must be greater than 0.");
    }

    let r = this.random() * totalWeight;

    for (let i = 0; i < arr.length; i++) {
      const weight = weights[i];

      if (weight <= 0) continue;

      r -= weight;

      if (r < 0) {
        return arr[i];
      }
    }
  }
}

const rng = new Random(1234);

console.log(rng.random());
console.log(rng.randint(1, 10));
console.log(rng.choice(["a", "b", "c"]));
