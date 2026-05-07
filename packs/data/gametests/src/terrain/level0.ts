import { Logger, Vec3 } from "@bedrock-oss/bedrock-boost";
import {
  BlockVolume,
  BlockVolumeBase,
  Vector2,
  Vector3,
} from "@minecraft/server";
import { DimensionGenerator } from "./common";
import { randomInteger } from "../math";

const log = Logger.getLogger("GeneratorLevel0");

export class GeneratorLevel0 extends DimensionGenerator {
  constructor() {
    super();
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

    // Place ceiling lights
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
    for (const offset of lightOffsets) {
      const location = {
        x: chunkOrigin.x + offset.x,
        y: 5,
        z: chunkOrigin.y + offset.y,
      };
      this.dimension.setBlockType(location, "minecraft:ochre_froglight");
    }

    // Place walls

    const wallCount = randomInteger(2, 5);
    const wallXZBias = 0.5;
    const shortWallBias = 0.15;

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

      this.dimension.fillBlocks(
        new BlockVolume(wallStart, wallEnd),
        "mbbr:lobby_wallpaper",
      );
    }
  }
}
