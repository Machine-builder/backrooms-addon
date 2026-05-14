import Random from "../random";

export enum Edge {
  Wall = 0,
  Small = 1,
  Large = 2,
}

enum TileSpecial {
  Default = 0,
  Open = 1,
}

export enum TileStyle {
  Default = 0,
  Pit = 1,
}

export interface Cell {
  north: Edge;
  east: Edge;
  south: Edge;
  west: Edge;
}

export interface MegaTileConstraints {
  north: (Edge | null)[];
  east: (Edge | null)[];
  south: (Edge | null)[];
  west: (Edge | null)[];
}

type PartialEdges = (Edge | null)[][];

export interface MegaTile {
  cells: Cell[][];
  style: TileStyle;
}

export class MegaTileGenerator {
  rng: Random;

  constructor(seed?: number) {
    this.rng = new Random(seed ?? Math.random() * 1000);
  }

  generate(constraints: MegaTileConstraints): MegaTile {
    let special: TileSpecial = TileSpecial.Default;
    if (this.rng.random() < 0.15) {
      special = TileSpecial.Open;
    }
    let style: TileStyle = TileStyle.Default;
    if (this.rng.random() < 0.2) {
      style = TileStyle.Pit;
    }

    // Edge Grid
    //
    // Horizontal edges: 4 rows x 3 cols
    // Vertical edges:   3 rows x 4 cols
    //
    // A 3x3 cell grid has:
    //
    // +---+---+---+
    // |   |   |   |
    // +---+---+---+
    // |   |   |   |
    // +---+---+---+
    // |   |   |   |
    // +---+---+---+

    const h: PartialEdges = Array.from({ length: 4 }, () =>
      Array.from({ length: 3 }, () => null),
    );
    const v: PartialEdges = Array.from({ length: 3 }, () =>
      Array.from({ length: 4 }, () => null),
    );

    const chooseEdge = () => {
      if (style === TileStyle.Pit) {
        return this.rng.choiceWeighted([Edge.Wall, Edge.Small], [0.9, 0.1]);
      } else {
        return this.rng.choiceWeighted(
          [Edge.Wall, Edge.Small, Edge.Large],
          [0.8, 0.19, 0.01],
        );
      }
    };

    // Stamp boundary constraints
    for (let x = 0; x < 3; x++) {
      h[0][x] = constraints.north[x] ?? chooseEdge();
      h[3][x] = constraints.south[x] ?? chooseEdge();
    }
    for (let y = 0; y < 3; y++) {
      v[y][0] = constraints.west[y] ?? chooseEdge();
      v[y][3] = constraints.east[y] ?? chooseEdge();
    }

    for (let y = 1; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        if (h[y][x] === null) {
          if (special === TileSpecial.Open) {
            h[y][x] = Edge.Large;
          } else {
            h[y][x] = chooseEdge();
          }
        }
      }
    }

    for (let y = 0; y < 3; y++) {
      for (let x = 1; x < 3; x++) {
        if (v[y][x] === null) {
          if (special === TileSpecial.Open) {
            v[y][x] = Edge.Large;
          } else {
            v[y][x] = chooseEdge();
          }
        }
      }
    }

    // North / South
    for (let x = 0; x < 3; x++) {
      if (h[0][x] === null) {
        h[0][x] = chooseEdge();
      }
      if (h[3][x] === null) {
        h[3][x] = chooseEdge();
      }
    }

    // East / West
    for (let y = 0; y < 3; y++) {
      if (v[y][0] === null) {
        v[y][0] = chooseEdge();
      }
      if (v[y][3] === null) {
        v[y][3] = chooseEdge();
      }
    }

    // Ensure external openings connect together
    if (special !== TileSpecial.Open) {
      this.forceConnectivity(h, v);
    }

    const cells: (Cell | null)[][] = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => null),
    );

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        cells[y][x] = {
          north: h[y][x]!,
          east: v[y][x + 1]!,
          south: h[y + 1][x]!,
          west: v[y][x]!,
        };
      }
    }

    return {
      // @ts-ignore
      cells: cells,
      style: style,
    };
  }

  forceConnectivity(h: PartialEdges, v: PartialEdges) {
    const entrances: [number, number][] = [];

    for (let x = 0; x < 3; x++) {
      if (h[0][x] != Edge.Wall) {
        entrances.push([x, 0]);
      }
      if (h[3][x] != Edge.Wall) {
        entrances.push([x, 2]);
      }
    }

    for (let y = 0; y < 3; y++) {
      if (v[y][0] != Edge.Wall) {
        entrances.push([0, y]);
      }
      if (v[y][3] != Edge.Wall) {
        entrances.push([2, y]);
      }
    }

    if (entrances.length <= 1) return;

    const root = entrances[0];

    for (const target of entrances.splice(1)) {
      this.carvePath(h, v, root, target);
    }
  }

  carvePath(
    h: PartialEdges,
    v: PartialEdges,
    root: [number, number],
    target: [number, number],
  ) {
    let [x, y] = root;
    let [tx, ty] = target;

    while (x != tx) {
      if (tx > x) {
        v[y][x + 1] = Edge.Small;
        x++;
      } else {
        v[y][x] = Edge.Small;
        x--;
      }
    }

    while (y != ty) {
      if (ty > y) {
        h[y + 1][x] = Edge.Small;
        y++;
      } else {
        h[y][x] = Edge.Small;
        y--;
      }
    }
  }
}

export function extractConstraints(tile: MegaTile): MegaTileConstraints {
  return {
    north: tile.cells[0].map((c) => c.north),
    south: tile.cells[2].map((c) => c.south),

    west: [tile.cells[0][0].west, tile.cells[1][0].west, tile.cells[2][0].west],

    east: [tile.cells[0][2].east, tile.cells[1][2].east, tile.cells[2][2].east],
  };
}
