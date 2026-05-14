import { ColorJSON, Logger, Vec3 } from "@bedrock-oss/bedrock-boost";
import {
  BlockVolume,
  Dimension,
  Direction,
  StructureRotation,
  system,
  Vector2,
  Vector3,
  world,
} from "@minecraft/server";
import {
  Edge,
  Cell,
  MegaTileConstraints,
  MegaTileGenerator,
  MegaTile,
  TileStyle,
  extractConstraints,
} from "./tileGeneration";

const log = Logger.getLogger("place");

export interface Edges {
  north: Edge;
  south: Edge;
  east: Edge;
  west: Edge;
}

function buildWall(
  dimension: Dimension,
  edge: Edge,
  corner: Vec3,
  axis: "x" | "z",
) {
  if (edge === Edge.Large) return;

  let direction;
  if (axis === "x") {
    direction = new Vec3(1, 0, 0);
  } else {
    direction = new Vec3(0, 0, 1);
  }
  dimension.fillBlocks(
    new BlockVolume(corner, corner.add(direction.multiply(7))),
    "minecraft:yellow_terracotta",
  );
  dimension.fillBlocks(
    new BlockVolume(
      corner.add(0, 1, 0),
      corner.add(direction.multiply(7)).add(0, 3, 0),
    ),
    "minecraft:cyan_terracotta",
  );

  if (edge === Edge.Small) {
    // Create a small doorway
    dimension.fillBlocks(
      new BlockVolume(
        corner.add(direction.multiply(3)),
        corner.add(direction.multiply(4)).add(0, 3, 0),
      ),
      "minecraft:air",
    );
  }
}

function edgeMask(cell: Cell): number {
  let mask = 0;

  if (cell.north === Edge.Small) mask |= 1;
  if (cell.east === Edge.Small) mask |= 2;
  if (cell.south === Edge.Small) mask |= 4;
  if (cell.west === Edge.Small) mask |= 8;

  return mask;
}

enum Prefab {
  DeadEnd,
  Straight,
  Corner,
  T,
  Cross,
  Empty,
}

interface PrefabResult {
  prefab: Prefab;
  rotation: StructureRotation; // degrees
}

function getPrefab(mask: number): PrefabResult {
  switch (mask) {
    // Empty
    case 0:
      return { prefab: Prefab.Empty, rotation: StructureRotation.None };

    // Dead ends
    case 1:
      return { prefab: Prefab.DeadEnd, rotation: StructureRotation.None };
    case 2:
      return { prefab: Prefab.DeadEnd, rotation: StructureRotation.Rotate90 };
    case 4:
      return { prefab: Prefab.DeadEnd, rotation: StructureRotation.Rotate180 };
    case 8:
      return { prefab: Prefab.DeadEnd, rotation: StructureRotation.Rotate270 };

    // Straights
    case 5: // N + S
      return { prefab: Prefab.Straight, rotation: StructureRotation.None };

    case 10: // E + W
      return { prefab: Prefab.Straight, rotation: StructureRotation.Rotate90 };

    // Corners
    case 3: // N + E
      return { prefab: Prefab.Corner, rotation: StructureRotation.None };

    case 6: // E + S
      return { prefab: Prefab.Corner, rotation: StructureRotation.Rotate90 };

    case 12: // S + W
      return { prefab: Prefab.Corner, rotation: StructureRotation.Rotate180 };

    case 9: // W + N
      return { prefab: Prefab.Corner, rotation: StructureRotation.Rotate270 };

    // T junctions
    case 7: // N E S
      return { prefab: Prefab.T, rotation: StructureRotation.None };

    case 14: // E S W
      return { prefab: Prefab.T, rotation: StructureRotation.Rotate90 };

    case 13: // S W N
      return { prefab: Prefab.T, rotation: StructureRotation.Rotate180 };

    case 11: // W N E
      return { prefab: Prefab.T, rotation: StructureRotation.Rotate270 };

    // Cross
    case 15:
      return { prefab: Prefab.Cross, rotation: StructureRotation.None };

    default:
      throw new Error(`Invalid mask ${mask}`);
  }
}

export function place(
  dimension: Dimension,
  location_: Vector3,
  edges: Edges,
  style: TileStyle,
) {
  const location = Vec3.from(location_);

  dimension.fillBlocks(
    new BlockVolume(location.add(0, -17, 0), location.add(7, 4, 7)),
    "minecraft:air",
  );

  const roofBlock = "minecraft:air";
  // const roofBlock = "minecraft:gray_concrete";

  if (style === TileStyle.Pit) {
    dimension.fillBlocks(
      new BlockVolume(location.add(0, 5, 0), location.add(7, 5, 7)),
      roofBlock,
    );

    const connections: Partial<Record<Direction, boolean>> = {
      North: edges.north === Edge.Small,
      East: edges.east === Edge.Small,
      South: edges.south === Edge.Small,
      West: edges.west === Edge.Small,
    };

    const mask = edgeMask(edges);
    const prefab = getPrefab(mask);

    let structureId;

    switch (prefab.prefab) {
      case Prefab.Empty:
        structureId = "mbbr/prefabs/pit:empty";
        break;
      case Prefab.DeadEnd:
        structureId = "mbbr/prefabs/pit:deadend";
        break;
      case Prefab.Straight:
        structureId = "mbbr/prefabs/pit:straight";
        break;
      case Prefab.Corner:
        structureId = "mbbr/prefabs/pit:corner";
        break;
      case Prefab.T:
        structureId = "mbbr/prefabs/pit:t";
        break;
      case Prefab.Cross:
        structureId = "mbbr/prefabs/pit:cross";
        break;
    }

    world.structureManager.place(structureId, dimension, location, {
      rotation: prefab.rotation,
    });
  } else {
    dimension.fillBlocks(
      new BlockVolume(location.add(0, -16, 0), location.add(7, 0, 7)),
      "minecraft:gray_concrete",
    );

    dimension.fillBlocks(
      new BlockVolume(location.add(0, 5, 0), location.add(7, 5, 7)),
      roofBlock,
    );

    let canUsePrefab = true;
    for (const edge of Object.values(edges)) {
      if (edge === Edge.Large) {
        canUsePrefab = false;
        break;
      }
    }

    if (canUsePrefab) {
      const mask = edgeMask(edges);
      const prefab = getPrefab(mask);

      let structureId;

      switch (prefab.prefab) {
        case Prefab.Empty:
          structureId = "mbbr/prefabs/standard:empty";
          break;
        case Prefab.DeadEnd:
          structureId = "mbbr/prefabs/standard:deadend";
          break;
        case Prefab.Straight:
          structureId = "mbbr/prefabs/standard:straight";
          break;
        case Prefab.Corner:
          structureId = "mbbr/prefabs/standard:corner";
          break;
        case Prefab.T:
          structureId = "mbbr/prefabs/standard:t";
          break;
        case Prefab.Cross:
          structureId = "mbbr/prefabs/standard:cross";
          break;
      }

      world.structureManager.place(structureId, dimension, location.add(0, 1, 0), {
        rotation: prefab.rotation,
      });
    }

    // Remove need to build walls by including them in the prefabs
    buildWall(dimension, edges.north, location.add(0, 1, 0), "x");
    buildWall(dimension, edges.south, location.add(0, 1, 7), "x");
    buildWall(dimension, edges.east, location.add(7, 1, 0), "z");
    buildWall(dimension, edges.west, location.add(0, 1, 0), "z");
  }

  dimension.fillBlocks(
    new BlockVolume(location.add(0, -17, 0), location.add(7, -17, 7)),
    "minecraft:black_concrete",
  );
}

world.afterEvents.worldLoad.subscribe(() => {
  const gen = new MegaTileGenerator();

  const cells = gen.generate({
    north: [null, null, null],
    south: [null, null, null],
    east: [null, null, null],
    west: [null, null, null],
  });

  const dimensions = world.getDimension("overworld");
  const origin = Vec3.from(1335, 106, 27);

  const megaTileEdges: { [key: string]: MegaTileConstraints } = {};
  const tileWorld: { [key: string]: MegaTile } = {};
  const worldSize: Vector2 = { x: 5, y: 5 };

  const megaTileKey = (x: number, y: number) => `${x},${y}`;

  for (let my = 0; my < worldSize.y; my++) {
    for (let mx = 0; mx < worldSize.x; mx++) {
      let constraints: MegaTileConstraints = {
        north: [null, null, null],
        east: [null, null, null],
        south: [null, null, null],
        west: [null, null, null],
      };

      const neighborKeyNorth = megaTileKey(mx, my - 1);
      if (megaTileEdges[neighborKeyNorth]) {
        constraints.north = megaTileEdges[neighborKeyNorth].south;
      }
      const neighborKeyWest = megaTileKey(mx - 1, my);
      if (megaTileEdges[neighborKeyWest]) {
        constraints.west = megaTileEdges[neighborKeyWest].east;
      }

      // Generate mega tile
      const megaTile = gen.generate(constraints);

      // Save details of the mega tile
      tileWorld[megaTileKey(mx, my)] = megaTile;
      megaTileEdges[megaTileKey(mx, my)] = extractConstraints(megaTile);
    }
  }

  let delay = 0;
  for (let my = 0; my < worldSize.y; my++) {
    for (let mx = 0; mx < worldSize.x; mx++) {
      const tileKey = megaTileKey(mx, my);
      const megaTile = tileWorld[tileKey];
      const cells = megaTile.cells;

      // Place each cell
      for (let y = 0; y < cells.length; y++) {
        for (let x = 0; x < cells[0].length; x++) {
          const cell = cells[y][x]!;

          place(
            dimensions,
            origin.add((mx * 3 + x) * 8, 0, (my * 3 + y) * 8),
            {
              north: cell.north ?? Edge.Wall,
              east: cell.east ?? Edge.Wall,
              south: cell.south ?? Edge.Wall,
              west: cell.west ?? Edge.Wall,
            },
            megaTile.style,
          );
        }
      }
    }
  }
});
