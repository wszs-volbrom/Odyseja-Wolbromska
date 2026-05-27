(function () {
  "use strict";

  const ODYSEJA_CONFIG = window.ODYSEJA_CONFIG;
  const ODYSEJA_UTILS = window.ODYSEJA_UTILS;
  const ODYSEJA_SYSTEMS = window.ODYSEJA_SYSTEMS;
  const ODYSEJA_ASSETS = window.ODYSEJA_ASSETS;
  if (!ODYSEJA_CONFIG || !ODYSEJA_UTILS || !ODYSEJA_SYSTEMS || !ODYSEJA_ASSETS) {
    throw new Error("Enemy dependencies failed to load. Make sure config, utils, systems, and assets are included before js/enemies.runtime.js.");
  }

  const { CONFIG } = ODYSEJA_CONFIG;
  const { rectsOverlap, clamp, lerp, canvasFont, drawNameTag } = ODYSEJA_UTILS;
  const { CollisionSystem } = ODYSEJA_SYSTEMS;
  const { ENEMY_IMAGES } = ODYSEJA_ASSETS;

class EnemyBase {
  constructor(x, y, options) {
    this.x = x;
    this.y = y;
    this.w = options.w || 42;
    this.h = options.h || 42;
    this.vx = options.vx || 0;
    this.vy = 0;
    this.hp = options.hp;
    this.maxHp = options.hp;
    this.damage = options.damage || 1;
    this.name = options.name;
    this.color = options.color || "#ef476f";
    this.onGround = false;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.dead = false;
    this.hitFlash = 0;
    this.lastGroundY = y + this.h;
    this.patrolMin = x - (options.patrol || 160);
    this.patrolMax = x + (options.patrol || 160);
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(dt, game) {
    this.vy += CONFIG.gravity * dt;
    CollisionSystem.resolveEntityPlatforms(this, game.level.platforms, dt);
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.y > CONFIG.height + 220) this.dead = true;
  }

  takeHit(game) {
    this.hp -= 1;
    this.hitFlash = 0.2;
    this.vx *= -0.55;
    game.addFloatingText(`${this.name} -1`, this.x, this.y - 10, "#f7d774");
    if (this.hp <= 0) {
      this.dead = true;
      game.audio.playEnemyDefeated();
      game.addFloatingText("Bęc!", this.x, this.y - 24, "#f7d774");
    } else {
      game.audio.playEnemyHit();
    }
  }

  handlePlayerCollision(game) {
    if (this.dead) return;
    const player = game.player;
    if (!rectsOverlap(this.bounds, player.bounds)) return;

    const playerWasFalling = player.vy > 90;
    const playerBottomBefore = player.y + player.h - player.vy * game.dt;
    const stomp = playerWasFalling && playerBottomBefore <= this.y + 18;

    if (stomp) {
      this.takeHit(game);
      player.bounce(this.hp > 0 ? 390 : 460);
    } else {
      player.damage(this.x, this.damage);
    }
  }

  render(ctx, camera) {
    if (this.dead) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    ctx.save();
    ctx.fillStyle = this.hitFlash > 0 ? "#fff6a6" : this.color;
    ctx.strokeStyle = "#211713";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, this.w, this.h, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x + 6, y + this.h - 8, this.w - 12, 4);
    drawNameTag(ctx, this.name, x + this.w / 2, y - 14, 18);
    if (this.maxHp > 1) {
      ctx.fillStyle = "#111";
      ctx.fillRect(x, y + this.h + 4, this.w, 5);
      ctx.fillStyle = "#ffcf5c";
      ctx.fillRect(x, y + this.h + 4, this.w * (this.hp / this.maxHp), 5);
    }
    ctx.restore();
  }
}

class WalkerEnemy extends EnemyBase {
  constructor(x, y) {
    super(x, y, { name: "Andziaks", hp: 1, damage: 1, vx: 55, color: "#d84f76", patrol: 180 });
    this.hasThrown = false;
    this.turnCooldown = 0;
  }

  update(dt, game) {
    if (this.turnCooldown > 0) this.turnCooldown -= dt;
    this.vx = 55 * this.dir;
    const intendedDir = this.dir;
    super.update(dt, game);
    this.tryThrow(game);

    const hitWallOrStep = this.onGround && this.vx === 0;
    const leftPatrol = this.x <= this.patrolMin;
    const rightPatrol = this.x + this.w >= this.patrolMax;
    const edge = this.onGround && !CollisionSystem.hasGroundAhead(this, game.level.platforms, intendedDir, 26);
    if ((hitWallOrStep || leftPatrol || rightPatrol || edge) && this.turnCooldown <= 0) {
      this.dir = -intendedDir;
      this.x = clamp(this.x + this.dir * 8, this.patrolMin + 2, this.patrolMax - this.w - 2);
      this.vx = 55 * this.dir;
      this.turnCooldown = 0.18;
    }
  }

  tryThrow(game) {
    if (this.hasThrown) return;
    const player = game.player;
    const dx = player.x + player.w / 2 - (this.x + this.w / 2);
    const dy = Math.abs((player.y + player.h / 2) - (this.y + this.h / 2));
    if (Math.abs(dx) > 360 || dy > 115) return;
    this.dir = dx > 0 ? 1 : -1;
    this.hasThrown = true;
    game.projectiles.push(new EnemyProjectile(this.x + this.w / 2, this.y + 14, this.dir, "andziaks"));
    game.addFloatingText("O nie!", this.x + this.w / 2, this.y - 16, "#ffd166");
  }
}

class FastWalkerEnemy extends EnemyBase {
  constructor(x, y) {
    super(x, y - 30, { name: "Fit Influencerka", hp: 1, damage: 1, w: 46, h: 74, vx: 96, color: "#41c56d", patrol: 240 });
    this.pause = 0;
    this.shootCooldown = 1.2 + Math.random() * 0.8;
    this.throwTimer = 0;
    this.animTime = Math.random() * 0.35;
  }

  update(dt, game) {
    this.animTime += dt;
    if (this.throwTimer > 0) this.throwTimer -= dt;
    if (this.pause > 0) {
      this.pause -= dt;
      this.vx = 0;
    } else {
      this.vx = 96 * this.dir;
    }
    super.update(dt, game);
    this.tryShoot(dt, game);
    const edge = this.onGround && !CollisionSystem.hasGroundAhead(this, game.level.platforms, this.dir);
    if (this.x <= this.patrolMin || this.x + this.w >= this.patrolMax || edge) {
      this.dir *= -1;
      this.pause = 0.2 + Math.random() * 0.25;
    }
  }

  tryShoot(dt, game) {
    this.shootCooldown -= dt;
    const player = game.player;
    const dx = player.x - this.x;
    const dy = Math.abs(player.y - this.y);
    const inRange = Math.abs(dx) < 430 && dy < 105;
    if (inRange) this.dir = dx > 0 ? 1 : -1;
    if (this.shootCooldown <= 0 && inRange) {
      game.projectiles.push(new EnemyProjectile(this.x + this.w / 2, this.y + 18, this.dir, "fit"));
      game.addFloatingText("OZEMPIC!", this.x + this.w / 2, this.y - 16, "#9cffb7");
      this.throwTimer = 0.42;
      this.shootCooldown = 1.45 + Math.random() * 0.75;
    }
  }

  render(ctx, camera) {
    if (this.dead) return;
    const walkFrames = ENEMY_IMAGES.get("fitInfluencerWalk") || [];
    const throwFrames = ENEMY_IMAGES.get("fitInfluencerThrow") || [];
    const frames = this.throwTimer > 0 && throwFrames.length ? throwFrames : walkFrames;
    if (!frames.length) {
      super.render(ctx, camera);
      return;
    }

    const frameSpeed = this.throwTimer > 0 ? 12 : 7;
    const frame = frames[Math.floor(this.animTime * frameSpeed) % frames.length];
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    const drawH = this.h + 4;
    const drawW = Math.min(92, drawH * (frame.width / frame.height));
    const drawX = x + this.w / 2 - drawW / 2;
    const drawY = y + this.h - drawH;

    ctx.save();
    if (this.dir < 0) {
      ctx.translate(x + this.w / 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(frame, -drawW / 2, drawY, drawW, drawH);
    } else {
      ctx.drawImage(frame, drawX, drawY, drawW, drawH);
    }
    ctx.restore();

    if (this.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#fff6a6";
      ctx.fillRect(drawX, drawY, drawW, drawH);
      ctx.restore();
    }

    drawNameTag(ctx, this.name, x + this.w / 2, y - 16, 18);
  }
}

class JumperEnemy extends EnemyBase {
  constructor(x, y, chaotic = false) {
    super(x, y, {
      name: chaotic ? "Koziołek" : "Lannel",
      hp: 2,
      damage: 1,
      vx: chaotic ? 58 : 65,
      color: chaotic ? "#33b679" : "#4f8bd8",
      patrol: chaotic ? 105 : 170
    });
    this.chaotic = chaotic;
    this.jumpTimer = 0.5 + Math.random();
  }

  update(dt, game) {
    this.vx = (this.chaotic ? 58 : 65) * this.dir;
    this.jumpTimer -= dt;
    if (this.onGround && this.jumpTimer <= 0) {
      this.vy = -(this.chaotic ? 430 : 350) - Math.random() * (this.chaotic ? 110 : 45);
      this.jumpTimer = (this.chaotic ? 0.55 : 1.15) + Math.random() * (this.chaotic ? 0.55 : 1.0);
    }
    super.update(dt, game);
    if (this.chaotic && this.onGround && Math.random() < 0.006) this.vy = -240;
    if (this.x <= this.patrolMin || this.x + this.w >= this.patrolMax) this.dir *= -1;
    if (this.onGround && !CollisionSystem.hasGroundAhead(this, game.level.platforms, this.dir, 12)) this.dir *= -1;
  }
}

class TankEnemy extends EnemyBase {
  constructor(x, y) {
    super(x, y, { name: "Cesarzowa", hp: 4, damage: 1, w: 68, h: 62, vx: 28, color: "#7a4a2a", patrol: 130 });
    this.shake = 0;
  }

  takeHit(game) {
    this.shake = 0.22;
    super.takeHit(game);
  }

  update(dt, game) {
    this.vx = 28 * this.dir;
    super.update(dt, game);
    if (this.shake > 0) this.shake -= dt;
    if (this.x <= this.patrolMin || this.x + this.w >= this.patrolMax) this.dir *= -1;
    if (this.onGround && !CollisionSystem.hasGroundAhead(this, game.level.platforms, this.dir)) this.dir *= -1;
  }

  render(ctx, camera) {
    const originalX = this.x;
    if (this.shake > 0) this.x += (Math.random() - 0.5) * 5;
    super.render(ctx, camera);
    this.x = originalX;
  }
}

class FlyerEnemy extends EnemyBase {
  constructor(x, y) {
    super(x, y, { name: "Duch Myszy Wolbromskiej", hp: 1, damage: 1, w: 62, h: 44, vx: 70, color: "#36c7d0", patrol: 220 });
    this.baseY = y;
    this.hoverY = y;
    this.groundedTargetY = y;
    this.phase = Math.random() * Math.PI * 2;
    this.animTime = Math.random() * 0.4;
  }

  update(dt, game) {
    this.animTime += dt;
    this.x += 70 * this.dir * dt;
    const player = game.player;
    const distanceToPlayer = Math.abs((player.x + player.w / 2) - (this.x + this.w / 2));
    const idleY = this.baseY;
    const chaseY = clamp(player.y + player.h * 0.32 - this.h / 2, 82, CONFIG.groundY - this.h - 10);
    if (player.onGround) {
      this.groundedTargetY = distanceToPlayer < 520 ? chaseY : idleY;
    }
    const targetY = this.groundedTargetY;
    this.hoverY = lerp(this.hoverY, targetY, 1 - Math.pow(0.02, dt));
    this.y = this.hoverY + Math.sin(game.time * 4.8 + this.phase) * 26 + Math.sin(game.time * 2.1 + this.phase * 0.7) * 10;
    if (this.x <= this.patrolMin || this.x + this.w >= this.patrolMax) this.dir *= -1;
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  render(ctx, camera) {
    if (this.dead) return;
    const frames = ENEMY_IMAGES.get("volbromMouse") || [];
    if (!frames.length) {
      super.render(ctx, camera);
      return;
    }

    const frame = frames[Math.floor(this.animTime * 8) % frames.length];
    const scale = Math.min((this.w + 36) / frame.width, (this.h + 30) / frame.height);
    const drawW = frame.width * scale;
    const drawH = frame.height * scale;
    const x = Math.round(this.x - camera.x + this.w / 2 - drawW / 2);
    const y = Math.round(this.y - camera.y + this.h / 2 - drawH / 2);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = this.hitFlash > 0 ? 0.68 : 1;
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 3;
    if (this.dir < 0) {
      ctx.translate(x + drawW, y);
      ctx.scale(-1, 1);
      ctx.drawImage(frame, 0, 0, drawW, drawH);
    } else {
      ctx.drawImage(frame, x, y, drawW, drawH);
    }
    ctx.restore();

    drawNameTag(
      ctx,
      this.name,
      Math.round(this.x - camera.x + this.w / 2),
      Math.round(this.y - camera.y - 16),
      17
    );
  }
}

class ChargerEnemy extends EnemyBase {
  constructor(x, y) {
    super(x, y, { name: "Gr@żyna", hp: 2, damage: 1, w: 46, h: 46, vx: 38, color: "#b37bff", patrol: 200 });
    this.state = "patrol";
    this.windup = 0;
    this.chargeTime = 0;
  }

  update(dt, game) {
    const player = game.player;
    const distance = Math.abs(player.x - this.x);
    const seesPlayer = distance < 310 && Math.abs(player.y - this.y) < 95;

    if (this.state === "patrol" && seesPlayer) {
      this.state = "warn";
      this.windup = 0.55;
      this.dir = player.x > this.x ? 1 : -1;
    }

    if (this.state === "warn") {
      this.vx = 0;
      this.windup -= dt;
      if (this.windup <= 0) {
        this.state = "charge";
        this.chargeTime = 0.75;
      }
    } else if (this.state === "charge") {
      this.vx = 250 * this.dir;
      this.chargeTime -= dt;
      if (this.chargeTime <= 0) this.state = "patrol";
    } else {
      this.vx = 38 * this.dir;
    }

    super.update(dt, game);
    if (this.x <= this.patrolMin || this.x + this.w >= this.patrolMax || (this.onGround && !CollisionSystem.hasGroundAhead(this, game.level.platforms, this.dir))) {
      this.dir *= -1;
      if (this.state === "charge") this.state = "patrol";
    }
  }

  render(ctx, camera) {
    const oldColor = this.color;
    if (this.state === "warn") this.color = Math.floor(performance.now() / 95) % 2 ? "#ff2d2d" : "#ffd166";
    if (this.state === "charge") this.color = "#ff2d2d";
    super.render(ctx, camera);
    this.color = oldColor;
  }
}

class BossFlyingTrackerEnemy extends EnemyBase {
  constructor(x, y) {
    super(x, y, {
      name: "Zbiórka na Chore Dzieci",
      hp: 10,
      damage: 1,
      w: 118,
      h: 78,
      vx: 0,
      color: "#7b2f84",
      patrol: 260
    });
    this.name = "TEST BOSS";
    this.baseY = y;
    this.dashCooldown = 2.2;
    this.dashTime = 0;
    this.shootCooldown = 1.1;
  }

  update(dt, game) {
    const player = game.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 560) {
      const speed = this.dashTime > 0 ? 210 : 82;
      this.x += (dx / Math.max(distance, 1)) * speed * dt;
      this.y += (dy / Math.max(distance, 1)) * speed * dt;
      this.dashCooldown -= dt;
      if (this.dashCooldown <= 0) {
        this.dashTime = 0.35;
        this.dashCooldown = 2.6;
      }
      this.shootCooldown -= dt;
      if (this.shootCooldown <= 0) {
        game.projectiles.push(new BossProjectile(this.x + this.w / 2, this.y + this.h / 2, player.x + player.w / 2, player.y + player.h / 2));
        game.addFloatingText("Paragon!", this.x + this.w / 2, this.y - 16, "#ffd166");
        this.shootCooldown = 1.25 + Math.random() * 0.65;
      }
    } else {
      this.x += Math.cos(performance.now() / 760) * 42 * dt;
      this.y = this.baseY + Math.sin(performance.now() / 520) * 42;
    }

    if (this.dashTime > 0) this.dashTime -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  takeHit(game) {
    const player = game.player;
    this.x += player.x < this.x ? 22 : -22;
    super.takeHit(game);
  }

  render(ctx, camera) {
    super.render(ctx, camera);
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    if (x + this.w < -80 || x > ctx.canvas.width + 80) return;
    ctx.save();
    ctx.fillStyle = "#f7d774";
    ctx.fillRect(x + 17, y + 16, this.w - 34, 18);
    ctx.fillStyle = "#251900";
    ctx.font = canvasFont(800, 10);
    ctx.textAlign = "center";
    ctx.fillText("RYNEK", x + this.w / 2, y + 29);
    ctx.fillStyle = "#fff7dd";
    ctx.fillRect(x + 20, y + 43, 18, 14);
    ctx.fillRect(x + this.w - 38, y + 43, 18, 14);
    ctx.restore();
  }
}

class BossProjectile {
  constructor(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;
    this.w = 24;
    this.h = 16;
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const speed = 235;
    this.vx = dx / distance * speed;
    this.vy = dy / distance * speed;
    this.life = 4;
    this.dead = false;
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(dt, game) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
    if (!this.dead && rectsOverlap(this.bounds, game.player.bounds)) {
      this.dead = true;
      game.player.damage(this.x, 1);
    }
  }

  render(ctx, camera) {
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    ctx.save();
    ctx.fillStyle = "#fff2b2";
    ctx.fillRect(x, y, this.w, this.h);
    ctx.strokeStyle = "#7a3f18";
    ctx.strokeRect(x, y, this.w, this.h);
    ctx.fillStyle = "#7a3f18";
    ctx.font = canvasFont(800, 8);
    ctx.textAlign = "center";
    ctx.fillText("VAT", x + this.w / 2, y + 11);
    ctx.restore();
  }
}

class EnemyProjectile {
  constructor(x, y, direction, type = "fit") {
    this.x = x;
    this.y = y;
    this.type = type;
    this.dir = direction;
    this.w = type === "andziaks" ? 22 : 38;
    this.h = type === "andziaks" ? 22 : 18;
    this.vx = (type === "andziaks" ? 215 : 255) * direction;
    this.vy = type === "andziaks" ? -95 : -18;
    this.life = type === "andziaks" ? 4.2 : 3.2;
    this.dead = false;
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(dt, game) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 80 * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
    if (!this.dead && rectsOverlap(this.bounds, game.player.bounds)) {
      this.dead = true;
      if (this.type === "andziaks") {
        game.player.damage(this.x, 1);
        game.addFloatingText("Andziaks trafia!", game.player.x, game.player.y - 42, "#ffd166");
      } else {
        game.player.receiveOzempic(this.x);
      }
    }
  }

  render(ctx, camera) {
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    const ozempicFrames = ENEMY_IMAGES.get("ozempic") || [];
    if (this.type === "fit" && ozempicFrames.length) {
      const img = ozempicFrames[0];
      const drawH = this.h;
      const drawW = Math.min(70, drawH * (img.width / img.height));
      const drawX = x + this.w / 2 - drawW / 2;
      const drawY = y + this.h / 2 - drawH / 2;
      ctx.save();
      if (this.dir < 0) {
        ctx.translate(x + this.w / 2, y + this.h / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      } else {
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      }
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.fillStyle = this.type === "andziaks" ? "#ffd166" : "#9cffb7";
    ctx.beginPath();
    ctx.roundRect(x, y, this.w, this.h, this.type === "andziaks" ? 11 : 5);
    ctx.fill();
    ctx.strokeStyle = this.type === "andziaks" ? "#7a3f18" : "#185c31";
    ctx.strokeRect(x, y, this.w, this.h);
    ctx.fillStyle = this.type === "andziaks" ? "#7a3f18" : "#185c31";
    ctx.font = canvasFont(800, 8);
    ctx.textAlign = "center";
    ctx.fillText(this.type === "andziaks" ? "BT" : "OZ", x + this.w / 2, y + (this.type === "andziaks" ? 14 : 12));
    ctx.restore();
  }
}

class TestBossProjectile {
  constructor(x, y, targetX, targetY, variant = "bolt") {
    this.x = x;
    this.y = y;
    this.variant = variant;
    this.w = variant === "wide" ? 34 : 24;
    this.h = variant === "wide" ? 14 : 18;
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const speed = variant === "lob" ? 210 : variant === "wide" ? 285 : 250;
    this.vx = dx / distance * speed;
    this.vy = dy / distance * speed + (variant === "lob" ? -155 : 0);
    this.life = 4.4;
    this.dead = false;
    this.phase = Math.random() * Math.PI * 2;
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(dt, game) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.variant === "lob") this.vy += 440 * dt;
    if (this.variant === "wave") this.y += Math.sin(game.time * 10 + this.phase) * 75 * dt;
    this.life -= dt;
    if (this.life <= 0 || this.y > CONFIG.height + 160) this.dead = true;
    if (!this.dead && rectsOverlap(this.bounds, game.player.bounds)) {
      this.dead = true;
      game.player.damage(this.x, 1);
      game.hunger.add(-120);
      game.addFloatingText("-120 kcal", game.player.x, game.player.y - 38, "#ff8fab");
    }
  }

  render(ctx, camera) {
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    ctx.save();
    ctx.fillStyle = this.variant === "lob" ? "#ffd166" : this.variant === "wave" ? "#45d4ff" : "#ef476f";
    ctx.beginPath();
    ctx.roundRect(x, y, this.w, this.h, 7);
    ctx.fill();
    ctx.strokeStyle = "#211713";
    ctx.strokeRect(x, y, this.w, this.h);
    ctx.fillStyle = "#211713";
    ctx.font = canvasFont(800, 8);
    ctx.textAlign = "center";
    ctx.fillText(this.variant === "wide" ? "!!!" : ">", x + this.w / 2, y + 11);
    ctx.restore();
  }
}

class TestArenaBossEnemy extends EnemyBase {
  constructor(x, y) {
    super(x, y, { name: "TEST BOSS", hp: 8, damage: 1, w: 84, h: 78, vx: 155, color: "#ef476f", patrol: 520 });
    this.dir = -1;
    this.jumpTimer = 0.55;
    this.shootCooldown = 0.9;
    this.attackIndex = 0;
    this.arenaMin = 82;
    this.arenaMax = 1200;
  }

  update(dt, game) {
    const player = game.player;
    this.dir = player.x + player.w / 2 > this.x + this.w / 2 ? 1 : -1;
    const speed = this.hp <= 3 ? 205 : 155;
    this.vx = speed * this.dir;
    this.jumpTimer -= dt;
    if (this.onGround && this.jumpTimer <= 0) {
      this.vy = -(this.hp <= 3 ? 650 : 560);
      this.jumpTimer = (this.hp <= 3 ? 0.75 : 1.05) + Math.random() * 0.55;
    }

    super.update(dt, game);
    if (this.x < this.arenaMin) {
      this.x = this.arenaMin;
      this.vx = Math.abs(this.vx);
    }
    if (this.x + this.w > this.arenaMax) {
      this.x = this.arenaMax - this.w;
      this.vx = -Math.abs(this.vx);
    }

    this.shootCooldown -= dt;
    if (this.shootCooldown <= 0) {
      this.firePattern(game);
      this.shootCooldown = (this.hp <= 3 ? 0.72 : 1.05) + Math.random() * 0.35;
    }
  }

  firePattern(game) {
    const player = game.player;
    const startX = this.x + this.w / 2;
    const startY = this.y + 24;
    const targetX = player.x + player.w / 2;
    const targetY = player.y + player.h / 2;
    const pattern = this.attackIndex % 3;
    this.attackIndex += 1;
    if (pattern === 0) {
      game.projectiles.push(new TestBossProjectile(startX, startY, targetX, targetY, "bolt"));
    } else if (pattern === 1) {
      game.projectiles.push(new TestBossProjectile(startX - 10, startY, targetX - 80, targetY, "wide"));
      game.projectiles.push(new TestBossProjectile(startX + 10, startY, targetX + 80, targetY, "wide"));
    } else {
      game.projectiles.push(new TestBossProjectile(startX, startY, targetX, targetY, "lob"));
      game.projectiles.push(new TestBossProjectile(startX, startY + 10, targetX, targetY, "wave"));
    }
    game.addFloatingText("TEST ATTACK!", startX, this.y - 18, "#ffd166");
  }

  takeHit(game) {
    super.takeHit(game);
    this.vy = -260;
    this.x += game.player.x < this.x ? 28 : -28;
  }

  render(ctx, camera) {
    if (this.dead) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    ctx.save();
    ctx.fillStyle = this.hitFlash > 0 ? "#fff6a6" : "#ef476f";
    ctx.beginPath();
    ctx.roundRect(x, y, this.w, this.h, 8);
    ctx.fill();
    ctx.strokeStyle = "#211713";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#251900";
    ctx.fillRect(x + 14, y + 20, 14, 12);
    ctx.fillRect(x + this.w - 28, y + 20, 14, 12);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(x + 17, y + 52, this.w - 34, 8);
    drawNameTag(ctx, this.name, x + this.w / 2, y - 18, 19);
    ctx.fillStyle = "#111";
    ctx.fillRect(x, y + this.h + 5, this.w, 7);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(x, y + this.h + 5, this.w * (this.hp / this.maxHp), 7);
    ctx.restore();
  }
}

class TwinkChaseTarget extends EnemyBase {
  constructor(x, y) {
    super(x, y, { name: "Gej Twink", hp: 1, damage: 0, w: 42, h: 70, vx: 230, color: "#ff8bd1", patrol: 99999 });
    this.dir = 1;
    this.jumpCooldown = 0.2;
    this.panic = 0;
  }

  update(dt, game) {
    const player = game.player;
    const lead = this.x - player.x;
    const close = lead < 300;
    const tooFar = lead > 760;
    const desiredSpeed = tooFar ? 155 : close ? 312 : 232;
    this.panic = clamp(1 - lead / 580, 0, 1);
    this.vx = lerp(this.vx, desiredSpeed, 1 - Math.pow(0.008, dt));

    this.jumpCooldown -= dt;
    if (this.onGround && this.jumpCooldown <= 0 && this.shouldJump(game)) {
      this.vy = -CONFIG.player.jumpForce * (close ? 1.05 : 0.92);
      this.onGround = false;
      this.jumpCooldown = 0.45 + Math.random() * 0.22;
    }

    super.update(dt, game);

    if (this.x + this.w > game.level.width - 140) this.x = game.level.width - 140 - this.w;
  }

  shouldJump(game) {
    const probe = {
      x: this.x + this.w,
      y: this.y + 8,
      w: 118 + this.panic * 40,
      h: this.h - 8
    };
    return game.level.platforms.some((platform) => platform.kind === "chaseObstacle" && rectsOverlap(probe, platform));
  }

  handlePlayerCollision(game) {
    if (this.dead) return;
    if (!rectsOverlap(this.bounds, game.player.bounds)) return;
    this.dead = true;
    game.addFloatingText("ZŁAPANY!", this.x + this.w / 2, this.y - 24, "#ffd166");
    game.completeLevel();
  }

  render(ctx, camera) {
    if (this.dead) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    ctx.save();
    ctx.fillStyle = "#ff8bd1";
    ctx.strokeStyle = "#2b1521";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, this.w, this.h, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f8e7f0";
    ctx.fillRect(x + 9, y + 9, this.w - 18, 14);
    ctx.fillStyle = "#5b2443";
    ctx.fillRect(x + 10, y + this.h - 13, this.w - 20, 5);
    drawNameTag(ctx, this.name, x + this.w / 2, y - 14, 18);
    ctx.restore();
  }
}

  window.ODYSEJA_ENEMIES = Object.freeze({
    EnemyBase,
    WalkerEnemy,
    FastWalkerEnemy,
    JumperEnemy,
    TankEnemy,
    FlyerEnemy,
    ChargerEnemy,
    BossFlyingTrackerEnemy,
    EnemyProjectile,
    BossProjectile,
    TestBossProjectile,
    TestArenaBossEnemy,
    TwinkChaseTarget,
  });
})();
