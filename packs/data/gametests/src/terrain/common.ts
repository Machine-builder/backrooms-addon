import { Logger } from "@bedrock-oss/bedrock-boost";
import { DimensionManager } from "../dimensionManager";
import { Dimension, Player, Vector2 } from "@minecraft/server";
import { ChunkSplit } from "../worldgen/chunks";
import { distManhattan2d } from "../math";

const log = Logger.getLogger("DimensionGenerator");

export class DimensionGenerator {
  dimensionManager!: DimensionManager;
  dimension!: Dimension;
  chunkSplit!: ChunkSplit;
  generateChunksQueue: Vector2[] = [];

  constructor() {
    // No options for this abstract class
  }

  onDimensionManagerReady(dimensionManager: DimensionManager) {
    this.dimensionManager = dimensionManager;
    this.chunkSplit = new ChunkSplit(dimensionManager.typeId);
  }

  onDimensionReady(dimension: Dimension) {
    this.dimension = dimension;
  }

  generateChunk(chunkLocation: Vector2) {
    log.error("Function 'generateChunk' is not yet implemented.");
  }

  isChunkLoaded(chunkLocation: Vector2): boolean {
    if (!this.dimension) return false;
    try {
      let b = this.dimension.getBlock({
        x: chunkLocation.x * 16,
        y: 0,
        z: chunkLocation.y * 16,
      });
      if (b === undefined) return false;
    } catch {
      return false;
    }
    return true;
  }

  generateChunksForPlayers(players: Player[]) {
    // Add to chunk generation queue
    for (const player of players) {
      // Get chunks around them
      const playerLocation = player.location;
      const chunkLocation: Vector2 = {
        x: Math.floor(playerLocation.x / 16),
        y: Math.floor(playerLocation.z / 16),
      };
      const generateDistance = 4;
      let chunksAroundPlayer: Vector2[] = [];
      for (let x = -generateDistance; x < generateDistance + 1; x++) {
        for (let z = -generateDistance; z < generateDistance + 1; z++) {
          if (
            !this.chunkSplit.getChunkValue(
              chunkLocation.x + x,
              chunkLocation.y + z,
            )
          ) {
            chunksAroundPlayer.push({
              x: chunkLocation.x + x,
              y: chunkLocation.y + z
            });
          }
        }
      }
      // Add them to the queue sorted
      this.generateChunksQueue.push(...chunksAroundPlayer.sort((a, b) => distManhattan2d(chunkLocation, a) - distManhattan2d(chunkLocation, b)));
    }

    // Process chunk generation queue
    const generateChunksMax = 2;
    const generateChunksMin = 1;
    const generateChunksPercent = 0.1;

    const generateCount = Math.max(
      Math.min(
        Math.ceil(this.generateChunksQueue.length * generateChunksPercent),
        generateChunksMax,
      ),
      generateChunksMin,
    );

    let generatedCount = 0;
    let attempts = 0;
    const maxAttempts = this.generateChunksQueue.length; // Only check each once

    while (
      this.generateChunksQueue.length > 0 &&
      generatedCount < generateCount &&
      attempts < maxAttempts
    ) {
      attempts++;
      const chunkLocation = this.generateChunksQueue.shift();

      if (!chunkLocation) continue;

      if (this.chunkSplit.getChunkValue(chunkLocation.x, chunkLocation.y)) {
        // Already generated
        continue;
      }

      if (!this.isChunkLoaded(chunkLocation)) {
        // Skip and don't re-add to queue - it'll get processed later
        continue;
      }

      // Chunk ready to generate
      if (this.dimension) {
        try {
          this.generateChunk(chunkLocation);
          this.chunkSplit.setChunkValue(chunkLocation.x, chunkLocation.y, true);
          generatedCount++;
        } catch {
        }
      }
    }
  }
}
