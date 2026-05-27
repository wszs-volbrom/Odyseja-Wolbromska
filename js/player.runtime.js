(function () {
  "use strict";

  const ODYSEJA_CONFIG = window.ODYSEJA_CONFIG;
  const ODYSEJA_UTILS = window.ODYSEJA_UTILS;
  const ODYSEJA_SYSTEMS = window.ODYSEJA_SYSTEMS;
  if (!ODYSEJA_CONFIG || !ODYSEJA_UTILS || !ODYSEJA_SYSTEMS) {
    throw new Error("Player dependencies failed to load. Make sure config, utils, and systems are included before js/player.runtime.js.");
  }

  const { CONFIG } = ODYSEJA_CONFIG;
  const { clamp, lerp } = ODYSEJA_UTILS;
  const { CollisionSystem } = ODYSEJA_SYSTEMS;

class PlayerController {
  constructor(game) {
    this.game = game;
    this.baseW = 52;
    this.baseH = CONFIG.player.drawHeight;
    this.w = this.baseW;
    this.h = this.baseH;
    this.spawnX = 80;
    this.spawnY = CONFIG.groundY - this.h;
    this.spawnHeight = this.h;
    this.ozempicActive = false;
    this.ozempicSnacksRemaining = 0;
    this.reset();
  }

  reset() {
    this.applyOzempicSize(false);
    const spawnFoot = this.spawnY + (this.spawnHeight || this.h);
    this.x = this.spawnX;
    this.y = spawnFoot - this.h;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.jumpCount = 0;
    this.lives = CONFIG.player.lives;
    this.invulnerable = 0;
    this.speedBoost = 0;
    this.lastGroundY = CONFIG.groundY;
    this.checkpoint = { x: this.spawnX, y: this.spawnY, standingHeight: this.spawnHeight || this.h };
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  setPlayerScale(scale, keepFeet = true) {
    const footY = this.y + this.h;
    this.w = Math.round(this.baseW * scale);
    this.h = Math.round(this.baseH * scale);
    if (keepFeet) this.y = footY - this.h;
  }

  applyOzempicSize(keepFeet = true) {
    this.setPlayerScale(this.ozempicActive ? 0.5 : 1, keepFeet);
  }

  clearOzempicStatus(keepFeet = true) {
    this.ozempicActive = false;
    this.ozempicSnacksRemaining = 0;
    this.applyOzempicSize(keepFeet);
  }

  respawnAtCheckpoint() {
    this.applyOzempicSize(false);
    const checkpointFoot = this.checkpoint.y + (this.checkpoint.standingHeight || this.h);
    this.x = this.checkpoint.x;
    this.y = checkpointFoot - this.h;
    this.vx = 0;
    this.vy = 0;
    this.invulnerable = CONFIG.player.invulnerability;
    this.game.hunger.reset();
  }

  receiveOzempic(sourceX) {
    if (this.invulnerable > 0) return false;

    if (this.ozempicActive) {
      this.game.addFloatingText("OZEMPIC x2!", this.x + this.w / 2, this.y - 46, "#ef476f");
      if (!this.game.unlimitedLives) this.lives -= 1;
      this.invulnerable = CONFIG.player.invulnerability;
      this.vx = this.x < sourceX ? -260 : 260;
      this.vy = -260;
      this.game.addFloatingText("-1 zycie", this.x + this.w / 2, this.y - 28, "#ef476f");
      if (this.lives <= 0) {
        this.game.audio.playEnemyDefeated();
        this.game.gameOver();
      }
      return true;
    }

    this.ozempicActive = true;
    this.ozempicSnacksRemaining = 6;
    this.applyOzempicSize(true);
    this.invulnerable = CONFIG.player.invulnerability;
    this.vx = this.x < sourceX ? -250 : 250;
    this.vy = -235;
    this.game.hunger.add(-500);
    this.game.addFloatingText("OZEMPIC! -500 kcal", this.x + this.w / 2, this.y - 44, "#9cffb7");
    this.game.addFloatingText("Zjedz 6 pysznosci", this.x + this.w / 2, this.y - 66, "#ffd166");
    return true;
  }

  registerOzempicSnack() {
    if (!this.ozempicActive) return;
    this.ozempicSnacksRemaining = Math.max(0, this.ozempicSnacksRemaining - 1);
    if (this.ozempicSnacksRemaining === 0) {
      this.clearOzempicStatus(true);
      this.game.addFloatingText("Rozmiar wraca!", this.x + this.w / 2, this.y - 46, "#9cffb7");
    } else {
      this.game.addFloatingText(`OZEMPIC: ${this.ozempicSnacksRemaining}/6`, this.x + this.w / 2, this.y - 46, "#ffd166");
    }
  }

  update(dt) {
    const input = this.game.input;
    const left = input.down("KeyA", "ArrowLeft");
    const right = input.down("KeyD", "ArrowRight");
    const desired = (right ? 1 : 0) - (left ? 1 : 0);
    const sprint = input.sprintingFor(desired) || input.down("ShiftLeft", "ShiftRight");
    const speedBoostFactor = this.speedBoost > 0 ? 1.22 : 1;
    const targetSpeed = (sprint ? CONFIG.player.sprintSpeed : CONFIG.player.speed) * speedBoostFactor;

    if (desired !== 0) this.facing = desired;
    if (sprint && desired !== 0) {
      input.sprintDirection = desired;
      input.sprintTimer = 0.75;
    }

    const accel = this.onGround ? 1850 : 1150;
    const friction = this.onGround ? 1650 : 420;
    if (desired !== 0) {
      this.vx = lerp(this.vx, desired * targetSpeed, clamp(accel * dt / targetSpeed, 0, 1));
    } else {
      const slow = Math.sign(this.vx) * friction * dt;
      if (Math.abs(slow) > Math.abs(this.vx)) this.vx = 0;
      else this.vx -= slow;
    }

    if (input.justPressed("Space")) this.tryJump();

    this.vy += CONFIG.gravity * dt;
    CollisionSystem.resolveEntityPlatforms(this, this.game.level.platforms, dt);

    if (this.onGround) this.jumpCount = 0;
    if (this.invulnerable > 0) this.invulnerable -= dt;
    if (this.speedBoost > 0) this.speedBoost -= dt;

    if (this.y > CONFIG.height + 180) this.game.playerDie(true);
    this.game.hunger.update(dt, sprint && Math.abs(this.vx) > 60);
  }

  tryJump() {
    if (this.onGround) {
      this.vy = -CONFIG.player.jumpForce;
      this.onGround = false;
      this.jumpCount += 1;
      this.game.hunger.spendJumpCost();
      this.game.audio.playJump();
      return;
    }

    const canDoubleJump = CONFIG.enableDoubleJump && this.jumpCount === 1 && this.game.hunger.value >= CONFIG.hunger.doubleJumpCost;
    if (canDoubleJump) {
      this.vy = -CONFIG.player.jumpForce * 1.42;
      this.jumpCount += 1;
      this.game.hunger.add(-CONFIG.hunger.doubleJumpCost);
      this.game.addFloatingText("-500 kcal", this.x + this.w / 2, this.y - 24, "#45d4ff");
      this.game.audio.playJump();
    }
  }

  bounce(force = 420) {
    this.vy = -force;
    this.onGround = false;
    this.jumpCount = 1;
  }

  damage(sourceX, damage = 1) {
    if (this.invulnerable > 0) return;
    if (!this.game.unlimitedLives) this.lives -= damage;
    this.invulnerable = CONFIG.player.invulnerability;
    this.vx = this.x < sourceX ? -260 : 260;
    this.vy = -260;
    this.game.hunger.add(-220);
    this.game.addFloatingText("-1 życie", this.x, this.y - 24, "#ef476f");
    if (this.lives <= 0) {
      this.game.audio.playEnemyDefeated();
      this.game.gameOver();
    }
  }

  render(ctx, camera, sprites, time) {
    const blinking = this.invulnerable > 0 && Math.floor(time * 18) % 2 === 0;
    if (blinking) return;

    let state = "idle";
    if (!this.onGround && this.vy < 0) state = "jump";
    else if (!this.onGround && this.vy >= 0) state = "fall";
    else if (Math.abs(this.vx) > 250) state = "sprint";
    else if (Math.abs(this.vx) > 20) state = "walk";

    const frame = sprites.getFrame(state, time);
    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y - camera.y);

    if (frame) {
      const scale = this.h / frame.height;
      const drawW = frame.width * scale;
      const drawX = sx + this.w / 2 - drawW / 2;
      ctx.save();
      if (this.facing === -1) {
        ctx.translate(drawX + drawW, sy);
        ctx.scale(-1, 1);
        ctx.drawImage(frame, 0, 0, drawW, this.h);
      } else {
        ctx.drawImage(frame, drawX, sy, drawW, this.h);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(sx, sy, this.w, this.h);
      ctx.fillStyle = "#f5d0a9";
      ctx.fillRect(sx + 10, sy + 8, 20, 20);
    }

    if (this.speedBoost > 0) {
      ctx.fillStyle = "rgba(69, 212, 255, 0.45)";
      ctx.fillRect(sx - 5, sy + this.h - 8, this.w + 10, 4);
    }
  }
}



  window.ODYSEJA_PLAYER = Object.freeze({
    PlayerController,
  });
})();