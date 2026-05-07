import {
  CommandPermissionLevel,
  CustomCommandOrigin,
  CustomCommandStatus,
  Player,
  system,
} from "@minecraft/server";
import { DimensionManager } from "./dimensionManager";
import { GeneratorLevel0 } from "./terrain/level0";

const dimensionBackroomsLevel0 = new DimensionManager(
  "mbbr:backrooms_level_0",
  new GeneratorLevel0(),
);

system.beforeEvents.startup.subscribe((event) => {
  event.dimensionRegistry.registerCustomDimension(
    dimensionBackroomsLevel0.typeId,
  );

  event.customCommandRegistry.registerCommand(
    {
      name: dimensionBackroomsLevel0.typeId,
      description: "Travel to the backrooms",
      permissionLevel: CommandPermissionLevel.Any,
      cheatsRequired: false,
    },
    (origin: CustomCommandOrigin) => {
      const player = origin.sourceEntity;
      if (!player || !(player instanceof Player))
        return {
          status: CustomCommandStatus.Failure,
          message: "Only players can use this command!",
        };
      system.run(() => {
        dimensionBackroomsLevel0.teleport(player);
      });
      return { status: CustomCommandStatus.Success };
    },
  );
});
