import { Vec3 } from "@bedrock-oss/bedrock-boost";
import { BlockVolume, Dimension, Direction, Vector3 } from "@minecraft/server";

export enum Edge {
  Wall = 0,
  Small = 1,
  Open = 2,
}

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
  if (edge === Edge.Open) return;

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
        corner.add(direction.multiply(4)).add(0, 2, 0),
      ),
      "minecraft:air",
    );
  }
}

export function place(dimension: Dimension, location_: Vector3, edges: Edges) {
  const location = Vec3.from(location_);

  dimension.fillBlocks(
    new BlockVolume(location, location.add(7, 4, 7)),
    "minecraft:air",
  );

  dimension.fillBlocks(
    new BlockVolume(location, location.add(7, 0, 7)),
    "minecraft:gray_concrete",
  );

  dimension.fillBlocks(
    new BlockVolume(location.add(0, 5, 0), location.add(7, 5, 7)),
    "minecraft:black_stained_glass",
  );

  buildWall(dimension, edges.north, location.add(0, 1, 0), "x");
  buildWall(dimension, edges.south, location.add(0, 1, 7), "x");
  buildWall(dimension, edges.east, location.add(7, 1, 0), "z");
  buildWall(dimension, edges.west, location.add(0, 1, 0), "z");
}
