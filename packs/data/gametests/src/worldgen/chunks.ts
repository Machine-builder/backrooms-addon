// Version 1.0.0

// TODO: We need to unload
// entries from ChunkSplit.bitGridCache
// This causes a very slow memory leak if
// we do not!

// Store each chunk currently generated with a bool

import { system, TicksPerSecond, world } from "@minecraft/server";
import { mod } from "../math";

// A region is a 16x16 area of chunks

class BitGrid16x16 {
  private data: Uint32Array;

  constructor(data?: Uint32Array) {
    this.data = data ?? new Uint32Array(8); // 8 * 32 = 256 bits
  }

  get(x: number, y: number): boolean {
    const index = y * 16 + x;
    const word = this.data[index >>> 5]; // same as Math.floor(index / 32)
    const bit = index & 31; // same as index % 32
    return ((word >>> bit) & 1) === 1;
  }

  set(x: number, y: number, value: boolean): void {
    const index = y * 16 + x;
    const wordIndex = index >>> 5;
    const bit = index & 31;
    if (value) {
      this.data[wordIndex] |= 1 << bit;
    } else {
      this.data[wordIndex] &= ~(1 << bit);
    }
  }

  serialize(): string {
    return Array.from(this.data)
      .map((n) => n.toString(36))
      .join(",");
  }

  static deserialize(serialized: string): BitGrid16x16 {
    const parts = serialized.split(",").map((s) => parseInt(s, 36));
    return new BitGrid16x16(new Uint32Array(parts));
  }
}

export class ChunkSplit {
  private bitGridCache: { [key: string]: BitGrid16x16 } = {};

  dimensionTypeId: string;
  propertyId: string;

  constructor(dimensionTypeId: string) {
    this.dimensionTypeId = dimensionTypeId;
    this.propertyId = `${dimensionTypeId}_chunkspit`;
    // Poor man's memory leak fix
    system.runInterval(() => {
      this.clearMemory();
    }, 10 * TicksPerSecond);
  }

  clearMemory() {
    this.bitGridCache = {};
  }

  getRegionKey(chunkx: number, chunkz: number): string {
    return `${Math.floor(chunkx / 16)},${Math.floor(chunkz / 16)}`;
  }

  getRegion(regionKey: string): BitGrid16x16 {
    const propertyId = `${this.propertyId}_${regionKey}`;
    let bitGrid = this.bitGridCache[propertyId];
    if (bitGrid === undefined) {
      const s = world.getDynamicProperty(propertyId) as string | undefined;
      if (s === undefined) {
        bitGrid = new BitGrid16x16();
      } else {
        bitGrid = BitGrid16x16.deserialize(s);
      }
      this.bitGridCache[propertyId] = bitGrid;
    }
    return bitGrid;
  }

  saveRegion(regionKey: string) {
    const propertyId = `${this.propertyId}_${regionKey}`;
    let bitGrid = this.bitGridCache[propertyId];
    if (bitGrid === undefined) {
      throw new Error(
        `Attempt to save region with region key "${regionKey}" but no bit grid found in cache`,
      );
    }
    world.setDynamicProperty(propertyId, bitGrid.serialize());
  }

  getChunkValue(chunkx: number, chunkz: number): boolean {
    const x = mod(chunkx, 16);
    const z = mod(chunkz, 16);
    const regionKey = this.getRegionKey(chunkx, chunkz);
    const region = this.getRegion(regionKey);
    return region.get(x, z);
  }

  setChunkValue(chunkx: number, chunkz: number, value: boolean) {
    const x = mod(chunkx, 16);
    const z = mod(chunkz, 16);
    const regionKey = this.getRegionKey(chunkx, chunkz);
    const region = this.getRegion(regionKey);
    region.set(x, z, value);
    this.saveRegion(regionKey);
  }
}
