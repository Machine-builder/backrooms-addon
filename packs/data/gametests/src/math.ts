import { Vector2 } from "@minecraft/server";

export function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

export function randomInteger(a: number, b: number) {
  return a + Math.floor(Math.random() * (b - a));
}

export function distManhattan2d(a: Vector2, b: Vector2) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function mapRange(
  n: number,
  from_min: number,
  from_max: number,
  to_min: number,
  to_max: number,
): number {
  let from_range = from_max - from_min;
  let to_range = to_max - to_min;

  if (from_range === 0) {
    throw new Error(
      "Cannot map range when from_min equals from_max (division by zero).",
    );
  }

  // Clamp n to the source range
  n = Math.max(from_min, Math.min(n, from_max));

  return ((n - from_min) / from_range) * to_range + to_min;
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function chooseFromArray<T>(arr: T[]): T {
  const i = Math.floor(Math.random() * arr.length);
  return arr[i];
}

export function chooseWeighted<T>(values: T[], weights: number[]): T {
  if (values.length === 0) {
    throw new Error("Cannot choose from an empty array.");
  }

  if (values.length !== weights.length) {
    throw new Error("Values and weights arrays must be the same length.");
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

  let r = Math.random() * totalWeight;

  for (let i = 0; i < values.length; i++) {
    const weight = weights[i];

    if (weight <= 0) continue;

    r -= weight;

    if (r < 0) {
      return values[i];
    }
  }

  // Fallback for floating point precision issues
  return values[values.length - 1];
}
