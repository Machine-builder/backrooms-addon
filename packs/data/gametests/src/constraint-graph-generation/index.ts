import { system } from "@minecraft/server";
import { Edge } from "./tileGeneration";
import { Edges, place } from "./place";
import { chooseWeighted } from "../math";

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== "mbbr:placedynamictile") return;

  const args = event.message.split(" ");
  const squareSize = parseInt(args[0]);

  const block = event.sourceBlock;
  if (!block) return;

  system.run(() => {
    function randomEdge() {
      return chooseWeighted(
        [Edge.Wall, Edge.Small, Edge.Large],
        [0.6, 0.35, 0.05],
      );
    }

    for (let x = 0; x < squareSize; x++) {
      for (let z = 0; z < squareSize; z++) {
        const edges: Edges = {
          north: randomEdge(),
          east: randomEdge(),
          south: randomEdge(),
          west: randomEdge(),
        };

        place(
          block.dimension,
          {
            x: block.x + x * 7 + 1,
            y: block.y + 5,
            z: block.z + z * 7 + 1,
          },
          edges,
        );
      }
    }
  });
});
