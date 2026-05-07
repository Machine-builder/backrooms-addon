import { Logger, Vec3 } from "@bedrock-oss/bedrock-boost";
import { BlockVolume, Vector2, world } from "@minecraft/server";
import { DimensionGenerator } from "./common";
import { randomInteger } from "../math";
import { Noise2d } from "../worldgen/noise";

const log = Logger.getLogger("GeneratorLevel0");

export class GeneratorLevel0 extends DimensionGenerator {
  noiseWallpaper: Noise2d;
  noiseTightness: Noise2d;
  noiseDarkness: Noise2d;

  constructor() {
    super();

    const worldSeed = parseInt(world.seed);
    this.noiseWallpaper = new Noise2d(worldSeed + 57, 0.005);
    this.noiseTightness = new Noise2d(worldSeed + 98, 0.005);
    this.noiseDarkness = new Noise2d(worldSeed + 123, 0.005);
  }

  generateChunk(chunkLocation: Vector2) {
    const chunkOrigin: Vector2 = {
      x: chunkLocation.x * 16,
      y: chunkLocation.y * 16,
    };

    const chunkOriginVec3: Vec3 = Vec3.from(chunkOrigin.x, 0, chunkOrigin.y);

    this.dimension.fillBlocks(
      new BlockVolume(
        { x: chunkOrigin.x, y: 0, z: chunkOrigin.y },
        { x: chunkOrigin.x + 16, y: 0, z: chunkOrigin.y + 16 },
      ),
      "mbbr:lobby_old_carpet",
    );
    this.dimension.fillBlocks(
      new BlockVolume(
        { x: chunkOrigin.x, y: 5, z: chunkOrigin.y },
        { x: chunkOrigin.x + 16, y: 5, z: chunkOrigin.y + 16 },
      ),
      "mbbr:lobby_ceiling_tile",
    );

    // Large amount of blocks above so fog renders correctly in vv
    this.dimension.fillBlocks(
      new BlockVolume(
        { x: chunkOrigin.x, y: 6, z: chunkOrigin.y },
        { x: chunkOrigin.x + 16, y: 22, z: chunkOrigin.y + 16 },
      ),
      "minecraft:bedrock",
    );

    // Place ceiling lights

    const darknessSample = this.noiseDarkness.sample(
      chunkOrigin.x,
      chunkOrigin.y,
    );

    if (darknessSample < .6) {
      const lightOffsets: Vector2[] = [
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 11, y: 3 },
        { x: 12, y: 3 },
        { x: 3, y: 11 },
        { x: 4, y: 11 },
        { x: 11, y: 11 },
        { x: 12, y: 11 },
      ];

      if (Math.random() < 0.3) {
        // Extra lit-up
        lightOffsets.push({ x: 3, y: 3 + 4 });
        lightOffsets.push({ x: 4, y: 3 + 4 });
        lightOffsets.push({ x: 11, y: 3 + 4 });
        lightOffsets.push({ x: 12, y: 3 + 4 });
        lightOffsets.push({ x: 3, y: 11 + 4 });
        lightOffsets.push({ x: 4, y: 11 + 4 });
        lightOffsets.push({ x: 11, y: 11 + 4 });
        lightOffsets.push({ x: 12, y: 11 + 4 });
      }

      for (const offset of lightOffsets) {
        const location = {
          x: chunkOrigin.x + offset.x,
          y: 5,
          z: chunkOrigin.y + offset.y,
        };
        this.dimension.setBlockType(location, "mbbr:lobby_ceiling_light");
      }
    }

    // Place walls

    const tightnessSample = this.noiseTightness.sample(
      chunkOrigin.x,
      chunkOrigin.y,
    );

    let wallCount = randomInteger(2, 5);
    let wallXZBias = 0.5;
    let shortWallBias = 0.2; // 3 block tall walls % chance

    if (tightnessSample > 0.65) {
      // Increase claustrophobia
      wallCount += 5;
      shortWallBias = 0.1;
    } else if (tightnessSample < 0.35) {
      // Open areas
      wallCount = Math.random() < 0.25 ? randomInteger(2, 4) : 0;
      shortWallBias = 0.0;
    }

    for (let i = 0; i < wallCount; i++) {
      // Choose a random starting location inside this tile
      let wallStart = new Vec3(randomInteger(0, 16), 0, randomInteger(0, 16));
      let wallDirection: Vec3;
      if (Math.random() > wallXZBias) {
        wallDirection = new Vec3(1, 0, 0);
      } else {
        wallDirection = new Vec3(0, 0, 1);
      }
      if (Math.random() > 0.5) {
        wallDirection = wallDirection.multiply(-1);
      }
      let wallLength: number;
      if (Math.random() < 0.6) {
        wallLength = randomInteger(3, 8);
      } else {
        wallLength = randomInteger(8, 15);
      }
      let wallEnd = wallStart.add(wallDirection.multiply(wallLength));

      let wallHeight = 4;
      if (Math.random() < shortWallBias) {
        wallHeight = 3;
      }

      // Offset the wall to this tile
      wallStart = wallStart.add(chunkOriginVec3).add(0, 1, 0);
      wallEnd = wallEnd.add(chunkOriginVec3).add(0, wallHeight, 0);

      let wallpaperType = "mbbr:lobby_wallpaper";

      const wallpaperNoiseSample = this.noiseWallpaper.sample(
        chunkOrigin.x,
        chunkOrigin.y,
      );

      if (wallpaperNoiseSample < 0.35) {
        wallpaperType = "mbbr:lobby_wallpaper_spotted";
      } else if (wallpaperNoiseSample > 0.65) {
        wallpaperType = "mbbr:lobby_wallpaper_ornate";
      }

      this.dimension.fillBlocks(
        new BlockVolume(wallStart, wallEnd),
        wallpaperType,
      );
    }
  }
}
