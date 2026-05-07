import {
  Dimension,
  EntityInitializationCause,
  Player,
  system,
  TicksPerSecond,
  world,
} from "@minecraft/server";
import { DimensionGenerator } from "./terrain/common";
import { Logger } from "@bedrock-oss/bedrock-boost";

const log = Logger.getLogger("DimensionManager");

const allowSpawns = [
  "minecraft:item",
  "minecraft:egg",
  "minecraft:snowball",
  "minecraft:arrow",
  "minecraft:wind_charge_projectile",
  "minecraft:fireball",
];

export class DimensionManager {
  typeId: string;
  generator?: DimensionGenerator;

  activeRunId: number = -1;
  dimension?: Dimension;
  activatedAt: number = 0;

  constructor(typeId: string, generator?: DimensionGenerator) {
    this.typeId = typeId;
    this.generator = generator;

    world.afterEvents.worldLoad.subscribe(() => {
      this.dimension = world.getDimension(this.typeId);
      if (this.generator) {
        this.generator.onDimensionReady(this.dimension);
      }
      if (this.hasAnyPlayers()) {
        this.ensureActive();
      }
    });

    world.afterEvents.entitySpawn.subscribe((event) => {
      const entity = event.entity;
      const dimensionId = entity.dimension.id;
      if (dimensionId !== typeId) return;
      if (
        event.cause === EntityInitializationCause.Spawned &&
        !allowSpawns.includes(entity.typeId)
      ) {
        entity.remove();
      }
    });

    if (generator) {
      generator.onDimensionManagerReady(this);
    }
  }

  teleport(player: Player) {
    player.teleport(
      { x: 0, y: 0, z: 0 },
      { dimension: world.getDimension(this.typeId) },
    );
    this.ensureActive();
  }

  isActive() {
    return this.activeRunId !== -1;
  }

  ensureActive() {
    if (!this.isActive()) this.activate();
  }

  activate() {
    this.activeRunId = system.runInterval(() => {
      this.tick();
    }, 1);
    this.activatedAt = system.currentTick;
  }

  deactivate() {
    system.clearRun(this.activeRunId);
    this.activeRunId = -1;
  }

  hasAnyPlayers(): boolean {
    return (this.dimension?.getPlayers() ?? []).length > 0;
  }

  tick() {
    const currentTick = system.currentTick;
    const startupCooldownPassed =
      currentTick - this.activatedAt > 5 * TicksPerSecond;

    const players = this.dimension?.getPlayers() ?? [];

    if (startupCooldownPassed && currentTick % 20 === 0) {
      if (players.length === 0) {
        this.deactivate();
        return;
      }
    }

    if (currentTick % (1 * TicksPerSecond) === 0) {
      players.forEach((p) => {
        this.updatePlayer(p);
      });
    }

    players.forEach((p) => {
      this.updatePlayerFast(p);
    });

    if (this.generator) {
      this.generator.generateChunksForPlayers(players);
    }
  }

  updatePlayerFast(player: Player) {
    // Runs once per tick
  }

  updatePlayer(player: Player) {
    // Runs once per second
  }
}
