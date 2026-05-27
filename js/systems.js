import { CONFIG } from "./config.js";
import { clamp, lerp, rectsOverlap } from "./utils.js";

export class SpeedrunTimer {
  constructor() {
    this.time = 0;
    this.running = false;
  }

  reset() {
    this.time = 0;
    this.running = false;
  }

  start() {
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  update(dt) {
    if (this.running) this.time += dt;
  }
}

export class HungerSystem {
  constructor(game) {
    this.game = game;
    this.value = CONFIG.hunger.max;
    this.warningReady = true;
  }

  reset() {
    this.value = CONFIG.hunger.max;
    this.warningReady = true;
  }

  add(amount) {
    this.value = clamp(this.value + amount, 0, CONFIG.hunger.max);
    if (this.value > 650) this.warningReady = true;
  }

  update(dt, sprinting) {
    let drain = CONFIG.hunger.normalDrain;
    if (sprinting) drain *= CONFIG.hunger.sprintMultiplier;
    if (sprinting) drain += CONFIG.hunger.sprintExtraDrain;
    const levelPressure = this.game.currentLevel ? this.game.currentLevel.difficulty * 18 : Math.max(0, this.game.levelNumber - 1) * 5;
    drain += levelPressure;
    this.value = clamp(this.value - drain * dt, 0, CONFIG.hunger.max);
    if (this.value <= 500 && this.warningReady) {
      this.warningReady = false;
      this.game.audio.playHungerWarning();
      this.game.addFloatingText("JESTEM GŁODNA!!!!", this.game.player.x + this.game.player.w / 2, this.game.player.y - 34, "#ef476f");
    }
    if (this.value <= 0) {
      this.game.addFloatingText("0 kcal!", this.game.player.x, this.game.player.y - 24, "#ef476f");
      this.game.playerDie(false);
    }
  }

  spendJumpCost() {
    this.value = clamp(this.value - CONFIG.hunger.jumpCost, 0, CONFIG.hunger.max);
  }
}

export class CameraSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
  }

  update(dt, player, levelWidth) {
    const lookAhead = player.facing === 1 ? 130 : 55;
    const target = player.x + lookAhead - this.canvas.width * 0.42;
    const maxX = Math.max(0, levelWidth - this.canvas.width);
    this.x = clamp(lerp(this.x, target, 1 - Math.pow(0.001, dt)), 0, maxX);
    this.y = 0;
  }
}

export class CollisionSystem {
  static resolveEntityPlatforms(entity, platforms, dt) {
    entity.onGround = false;
    entity.x += entity.vx * dt;
    let box = entity.bounds;

    for (const platform of platforms) {
      if (!rectsOverlap(box, platform)) continue;
      if (CollisionSystem.tryStepUp(entity, platform, platforms)) {
        box = entity.bounds;
        continue;
      }
      if (entity.vx > 0) entity.x = platform.x - entity.w;
      else if (entity.vx < 0) entity.x = platform.x + platform.w;
      entity.vx = 0;
      box = entity.bounds;
    }

    entity.y += entity.vy * dt;
    box = entity.bounds;

    for (const platform of platforms) {
      if (!rectsOverlap(box, platform)) continue;
      if (entity.vy > 0) {
        entity.y = platform.y - entity.h;
        entity.vy = 0;
        entity.onGround = true;
        entity.lastGroundY = platform.y;
      } else if (entity.vy < 0) {
        entity.y = platform.y + platform.h;
        entity.vy = 0;
      }
      box = entity.bounds;
    }
  }

  static tryStepUp(entity, obstacle, platforms) {
    if (!entity.onGround && Math.abs(entity.vy) > 30) return false;
    const feet = entity.y + entity.h;
    const stepHeight = 18;
    const obstacleTop = obstacle.y;
    const canStep = obstacleTop < feet && feet - obstacleTop <= stepHeight;
    if (!canStep) return false;

    const oldY = entity.y;
    entity.y = obstacleTop - entity.h;
    const steppedBox = entity.bounds;
    const blocked = platforms.some((platform) => platform !== obstacle && rectsOverlap(steppedBox, platform));
    if (blocked) {
      entity.y = oldY;
      return false;
    }
    entity.vy = Math.min(entity.vy, 0);
    entity.onGround = true;
    entity.lastGroundY = obstacleTop;
    return true;
  }

  static hasGroundAhead(entity, platforms, dir, distance = 18) {
    const foot = {
      x: entity.x + (dir > 0 ? entity.w + distance : -distance),
      y: entity.y + entity.h + 6,
      w: distance,
      h: 18
    };
    return platforms.some((platform) => rectsOverlap(foot, platform));
  }
}

