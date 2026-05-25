"use strict";

const CONFIG = {
  width: 960,
  height: 540,
  gravity: 1400,
  tile: 48,
  groundY: 438,
  enableDoubleJump: true,
  debugNames: false,
  player: {
    speed: 220,
    sprintSpeed: 340,
    jumpForce: 520,
    lives: 3,
    drawHeight: 96,
    invulnerability: 1.15
  },
  hunger: {
    max: 2200,
    normalDrain: 48,
    sprintMultiplier: 3.25,
    sprintExtraDrain: 42,
    speedrunMultiplier: 1.25,
    jumpCost: 35,
    doubleJumpCost: 500
  }
};

const GAME_FONT = "\"VT323\", monospace";
const canvasFont = (weight, size) => `${weight} ${size}px ${GAME_FONT}`;

function drawNameTag(ctx, text, x, y, size = 18) {
  ctx.save();
  ctx.font = canvasFont(800, size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const padX = 8;
  const padY = 4;
  const metrics = ctx.measureText(text);
  const boxW = Math.ceil(metrics.width + padX * 2);
  const boxH = Math.ceil(size + padY * 2);
  const boxX = Math.round(x - boxW / 2);
  const boxY = Math.round(y - boxH);
  ctx.fillStyle = "rgba(18, 22, 28, 0.78)";
  ctx.strokeStyle = "#fff7dd";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#201900";
  ctx.fillStyle = "#fff7dd";
  ctx.strokeText(text, x, boxY + boxH / 2 + 1);
  ctx.fillText(text, x, boxY + boxH / 2 + 1);
  ctx.restore();
}

const CAMPAIGN_LEVELS = [
  { label: "1-1", world: "PRZEDMIEŚCIA WOLBROMIA", difficulty: 0.08, length: 5600, boss: false, theme: "suburbs" },
  { label: "1-2", world: "WOLBROM CENTRUM", difficulty: 0.2, length: 6400, boss: false, theme: "center" },
  { label: "1-3", world: "OSIEDLE WOLBROM", difficulty: 0.36, length: 7200, boss: false, theme: "blocks" },
  { label: "2-1", world: "RYNEK WOLBROM", difficulty: 0.52, length: 7600, boss: false, theme: "market" },
  { label: "2-2", world: "RYNEK WOLBROM", difficulty: 0.7, length: 8400, boss: false, theme: "market" },
  { label: "2-3", world: "RYNEK WOLBROM", difficulty: 0.9, length: 7000, boss: true, theme: "market" },
  { label: "2-4", world: "ZŁAP GEJA TWINKA", difficulty: 1, length: 999999, boss: false, twinkChase: true, theme: "center" }
];

// ## Test fight for future
// The old 2-4 TEST BOSS FIGHT prototype is intentionally preserved in generateBossArena().
const FUTURE_TEST_FIGHT_LEVEL = { label: "2-4", world: "TEST BOSS FIGHT", difficulty: 1, length: 1280, boss: true, bossFight: true, fixedCamera: true, theme: "bossfight" };

const THEME_PALETTES = {
  suburbs: { skyTop: "#b7c9c1", skyMid: "#91a99b", skyBottom: "#6f846f", far: "rgba(84, 105, 88, 0.42)", near: "rgba(80, 95, 72, 0.62)" },
  center: { skyTop: "#b4bdc8", skyMid: "#909aa8", skyBottom: "#6f7884", far: "rgba(90, 96, 105, 0.5)", near: "rgba(63, 68, 76, 0.7)" },
  blocks: { skyTop: "#a9b0ba", skyMid: "#858d98", skyBottom: "#646b75", far: "rgba(78, 84, 94, 0.58)", near: "rgba(48, 54, 63, 0.76)" },
  market: { skyTop: "#c2b9aa", skyMid: "#a99e8e", skyBottom: "#7d746b", far: "rgba(100, 82, 70, 0.5)", near: "rgba(70, 55, 49, 0.74)" },
  bossfight: { skyTop: "#3f304d", skyMid: "#28203a", skyBottom: "#171421", far: "rgba(255, 209, 102, 0.16)", near: "rgba(239, 71, 111, 0.28)" }
};

const DEFAULT_SKIN_ID = "kloda-purple";
const INITIAL_SKIN_WALLET = 50000;

const PLAYER_SKINS = {
  "kloda-purple": {
    id: "kloda-purple",
    name: "Kłoda Classic",
    label: "Fioletowa sukienka",
    price: 0,
    preview: "assets/player/skins/kloda-purple/static.png",
    sprites: {
      idle: ["assets/player/skins/kloda-purple/static.png"],
      walk: [
        "assets/player/skins/kloda-purple/static.png",
        "assets/player/skins/kloda-purple/walk1.png",
        "assets/player/skins/kloda-purple/static.png",
        "assets/player/skins/kloda-purple/walk2.png",
        "assets/player/skins/kloda-purple/walk1.png"
      ],
      jump: ["assets/player/skins/kloda-purple/jump1.png"],
      fall: ["assets/player/skins/kloda-purple/fall.png"],
      sprint: [
        "assets/player/skins/kloda-purple/walk1.png",
        "assets/player/skins/kloda-purple/walk2.png",
        "assets/player/skins/kloda-purple/walk3.png",
        "assets/player/skins/kloda-purple/walk2.png"
      ]
    }
  },
  "tss-blue": {
    id: "tss-blue",
    name: "TSS Blue",
    label: "Niebieski drip",
    price: 12000,
    preview: "assets/player/skins/tss-blue/static.png",
    sprites: {
      idle: ["assets/player/skins/tss-blue/static.png"],
      walk: [
        "assets/player/skins/tss-blue/static.png",
        "assets/player/skins/tss-blue/walk.png",
        "assets/player/skins/tss-blue/static.png",
        "assets/player/skins/tss-blue/static.png",
        "assets/player/skins/tss-blue/walk1.png"
      ],
      jump: ["assets/player/skins/tss-blue/jump1.png"],
      fall: ["assets/player/skins/tss-blue/fall.png"],
      sprint: [
        "assets/player/skins/tss-blue/walk.png",
        "assets/player/skins/tss-blue/walk1.png",
        "assets/player/skins/tss-blue/static.png",
        "assets/player/skins/tss-blue/walk.png"
      ]
    }
  }
};

const PLAYER_ANIMATION_FPS = {
  idle: 1,
  walk: 8,
  sprint: 13,
  jump: 1,
  fall: 1
};

const COLLECTIBLE_TYPES = [
  { name: "Lays Chips", short: "Lays", hunger: 540, color: "#f6c44f", weight: 34, speedBoost: 0, image: "assets/collectibles/lays.png" },
  { name: "Lindor Pralines", short: "Lindor", hunger: 230, color: "#dc4b4b", weight: 10, speedBoost: 0, image: "assets/collectibles/lindor.png" },
  { name: "Delicje", short: "Delicje", hunger: 160, color: "#8b5cf6", weight: 20, speedBoost: 0, image: "assets/collectibles/delicje.png" },
  { name: "Zestaw McD Powiększony", short: "McD+", hunger: 850, color: "#e07a2f", weight: 7, speedBoost: 0, image: "assets/collectibles/mcd.png" },
  { name: "Energy Drink", short: "Coca Cola", hunger: 120, color: "#45d4ff", weight: 16, speedBoost: 5, image: "assets/collectibles/cola.png" },
  { name: "Kinder Bueno", short: "Kinder Bueno", hunger: 200, color: "#45d4ff", weight: 16, speedBoost: 5, image: "assets/collectibles/kinder.png" },
  { name: "Schoko Bons", short: "Szokobonsy", hunger: 420, color: "#45d4ff", weight: 16, speedBoost: 8, image: "assets/collectibles/schokobons.png" },
  { name: "Kubełek KFC", short: "KFC", hunger: 900, color: "#ff4fd8", weight: 3, speedBoost: 0, image: "assets/collectibles/kubelek.png" }
];

const COLLECTIBLE_IMAGES = new Map();
const ENEMY_SPRITES = {
  volbromMouse: [
    "assets/enemies/volbrommice-flying-1.png",
    "assets/enemies/volbrommice-flying-2.png"
  ]
};
const ENEMY_IMAGES = new Map();
const UI_ASSETS = {
  live: "assets/mobile-buttons/live.png"
};
const UI_IMAGES = new Map();

// Add new audio here. Use musicBg for looping/background tracks and sfxEffects for one-shot gameplay sounds.
const AUDIO_ASSETS = {
  musicBg: {
    levelLoop: "assets/audio/music-bg/gameloop-music-main.mp3"
  },
  sfxEffects: {
    jump: "assets/audio/SFX-effects/kloda-jump.mp3",
    enemyHit: "assets/audio/SFX-effects/enemy-bt.mp3",
    enemyDefeated: "assets/audio/SFX-effects/enemy-defeated.mp3",
    collectible: "assets/audio/SFX-effects/pysznosci.mp3",
    hungerWarning: "assets/audio/SFX-effects/dajmijesc.mp3"
  }
};

const BUILDING_ASSETS = {
  center: {
    frogshopSmall: [
      "assets/buildings/center/frogshop-small.png",
      "assets/buildings/center/frogshop-small2.png",
      "assets/buildings/center/frogshop-small3.png"
    ]
  },
  blocks: {
    frogshopCity: [
      "assets/buildings/blocks/frogshop-city.png",
      "assets/buildings/blocks/frogshop-city2.png"
    ]
  },
  suburbs: {
    house: [
      "assets/buildings/suburbs/lvl1house1.png",
      "assets/buildings/suburbs/lvl1house2.png",
      "assets/buildings/suburbs/lvl1house3.png",
      "assets/buildings/suburbs/lvl1house4.png",
      "assets/buildings/suburbs/lvl1house5.png",
      "assets/buildings/suburbs/lvl1house6.png"
    ],
    piekarnia: ["assets/buildings/suburbs/piekarnia.png"],
    cukiernia: ["assets/buildings/suburbs/cukiernia.png"],
    warzywniak: ["assets/buildings/suburbs/warzywniak.png"],
    sklepuani: ["assets/buildings/suburbs/sklepuani.png"],
    arabskiMasaz: ["assets/buildings/suburbs/arabski-masaz.png"]
  },
  foliage: {
    trees: [
      "assets/foliage/tree01.png",
      "assets/foliage/tree02.png",
      "assets/foliage/tree03.png",
      "assets/foliage/tree04.png",
      "assets/foliage/tree05.png"
    ]
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "--:--.--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
}

function makeEdgeTransparentCanvas(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;

  const width = canvas.width;
  const height = canvas.height;
  const visited = new Uint8Array(width * height);
  const stack = [];
  const isBackground = (idx) => {
    const i = idx * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const greenScreen = g > 145 && r < 120 && b < 125;
    const whiteScreen = r > 242 && g > 242 && b > 242;
    const checkerLight = r > 226 && g > 226 && b > 226;
    const checkerGray = Math.abs(r - g) < 5 && Math.abs(g - b) < 5 && r > 215;
    return a < 8 || greenScreen || whiteScreen || checkerLight || checkerGray;
  };

  for (let x = 0; x < width; x += 1) {
    stack.push(x, (height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    stack.push(y * width, y * width + width - 1);
  }

  while (stack.length) {
    const idx = stack.pop();
    if (visited[idx] || !isBackground(idx)) continue;
    visited[idx] = 1;
    data[idx * 4 + 3] = 0;
    const x = idx % width;
    const y = Math.floor(idx / width);
    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }

  ctx.putImageData(pixels, 0, 0);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 12) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (minX > maxX || minY > maxY) return canvas;

  const padding = 2;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);
  const trimmed = document.createElement("canvas");
  trimmed.width = maxX - minX + 1;
  trimmed.height = maxY - minY + 1;
  trimmed.getContext("2d").drawImage(canvas, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  return trimmed;
}

class InputManager {
  constructor() {
    this.keys = new Set();
    this.virtualKeys = new Set();
    this.pressed = new Set();
    this.virtualPressed = new Set();
    this.handlers = new Map();
    this.lastTap = { left: -Infinity, right: -Infinity };
    this.sprintDirection = 0;
    this.sprintTimer = 0;

    window.addEventListener("keydown", (event) => {
      const code = event.code;
      if (["Space", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(code)) {
        event.preventDefault();
      }
      if (!this.keys.has(code)) {
        this.pressed.add(code);
        this.detectDoubleTap(code);
      }
      this.keys.add(code);
      const handler = this.handlers.get(code);
      if (handler && !event.repeat) handler(event);
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    window.addEventListener("blur", () => {
      this.keys.clear();
      this.virtualKeys.clear();
      this.virtualPressed.clear();
    });
  }

  bind(code, fn) {
    this.handlers.set(code, fn);
  }

  update(dt = 0) {
    if (this.sprintTimer > 0) {
      this.sprintTimer -= dt;
      if (this.sprintTimer <= 0) this.sprintDirection = 0;
    }
    this.pressed.clear();
    this.virtualPressed.clear();
  }

  pressVirtual(code) {
    if (!this.virtualKeys.has(code)) this.virtualPressed.add(code);
    this.virtualKeys.add(code);
  }

  releaseVirtual(code) {
    this.virtualKeys.delete(code);
  }

  clearVirtual() {
    this.virtualKeys.clear();
    this.virtualPressed.clear();
  }

  detectDoubleTap(code) {
    const now = performance.now() / 1000;
    const tapWindow = 0.3;
    if (code === "KeyD" || code === "ArrowRight") {
      if (now - this.lastTap.right < tapWindow) {
        this.sprintDirection = 1;
        this.sprintTimer = 0.75;
      }
      this.lastTap.right = now;
    }
    if (code === "KeyA" || code === "ArrowLeft") {
      if (now - this.lastTap.left < tapWindow) {
        this.sprintDirection = -1;
        this.sprintTimer = 0.75;
      }
      this.lastTap.left = now;
    }
  }

  sprintingFor(direction) {
    return direction !== 0 && this.sprintDirection === direction && this.sprintTimer > 0;
  }

  down(...codes) {
    return codes.some((code) => this.keys.has(code) || this.virtualKeys.has(code));
  }

  justPressed(...codes) {
    return codes.some((code) => this.pressed.has(code) || this.virtualPressed.has(code));
  }
}

class SaveSystem {
  static key(speedrun) {
    return speedrun ? "odysejaWolbromska.bestTime.speedrun" : "odysejaWolbromska.bestTime.casual";
  }

  static storageGet(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : raw;
    } catch {
      return fallback;
    }
  }

  static storageSet(key, value) {
    try {
      localStorage.setItem(key, String(value));
      return true;
    } catch {
      return false;
    }
  }

  static getBestTime(speedrun) {
    try {
      const raw = localStorage.getItem(SaveSystem.key(speedrun));
      return raw ? Number(raw) : null;
    } catch {
      return null;
    }
  }

  static setBestTime(speedrun, value) {
    const current = SaveSystem.getBestTime(speedrun);
    if (!current || value < current) {
      try {
        localStorage.setItem(SaveSystem.key(speedrun), String(value));
      } catch {
        return false;
      }
      return true;
    }
    return false;
  }

  static resetBestTime() {
    try {
      localStorage.removeItem(SaveSystem.key(true));
      localStorage.removeItem(SaveSystem.key(false));
    } catch {
      // Local files can block storage in some browsers; the game should still run.
    }
  }

  static getSkinWallet() {
    const raw = SaveSystem.storageGet("odysejaWolbromska.skinWallet", null);
    if (raw === null) {
      SaveSystem.storageSet("odysejaWolbromska.skinWallet", INITIAL_SKIN_WALLET);
      return INITIAL_SKIN_WALLET;
    }
    return Number.isFinite(Number(raw)) ? Number(raw) : INITIAL_SKIN_WALLET;
  }

  static setSkinWallet(value) {
    SaveSystem.storageSet("odysejaWolbromska.skinWallet", Math.max(0, Math.floor(value)));
  }

  static getSelectedSkin() {
    const id = SaveSystem.storageGet("odysejaWolbromska.selectedSkin", DEFAULT_SKIN_ID);
    return PLAYER_SKINS[id] ? id : DEFAULT_SKIN_ID;
  }

  static setSelectedSkin(id) {
    if (PLAYER_SKINS[id]) SaveSystem.storageSet("odysejaWolbromska.selectedSkin", id);
  }

  static getOwnedSkins() {
    const raw = SaveSystem.storageGet("odysejaWolbromska.ownedSkins", DEFAULT_SKIN_ID);
    const owned = new Set(String(raw).split(",").filter((id) => PLAYER_SKINS[id]));
    owned.add(DEFAULT_SKIN_ID);
    return owned;
  }

  static setOwnedSkins(owned) {
    const ids = [...owned].filter((id) => PLAYER_SKINS[id]);
    if (!ids.includes(DEFAULT_SKIN_ID)) ids.unshift(DEFAULT_SKIN_ID);
    SaveSystem.storageSet("odysejaWolbromska.ownedSkins", ids.join(","));
  }
}

class SpeedrunTimer {
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

class HungerSystem {
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

class CameraSystem {
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

class CollisionSystem {
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

class SpriteLoader {
  constructor() {
    this.frames = new Map();
    this.skinId = null;
    this.ready = false;
    this.failed = [];
  }

  async load(skinId = DEFAULT_SKIN_ID) {
    const skin = PLAYER_SKINS[skinId] || PLAYER_SKINS[DEFAULT_SKIN_ID];
    if (this.ready && this.skinId === skin.id) return;
    this.frames = new Map();
    this.failed = [];
    this.ready = false;
    this.skinId = skin.id;
    const entries = Object.entries(skin.sprites);
    await Promise.all(entries.map(async ([state, paths]) => {
      const frames = await Promise.all(paths.map((path) => this.loadImage(path)));
      this.frames.set(state, frames.filter(Boolean));
    }));
    this.ready = true;
  }

  loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let processed = img;
        try {
          processed = this.makeTransparentCanvas(img);
        } catch {
          processed = img;
        }
        resolve(processed);
      };
      img.onerror = () => {
        this.failed.push(src);
        resolve(null);
      };
      img.src = src;
    });
  }

  makeTransparentCanvas(img) {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = pixels.data;

    const width = canvas.width;
    const height = canvas.height;
    const visited = new Uint8Array(width * height);
    const stack = [];
    const isBackground = (idx) => {
      const i = idx * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const greenScreen = g > 145 && r < 120 && b < 125;
      const whiteScreen = r > 242 && g > 242 && b > 242;
      return greenScreen || whiteScreen;
    };

    for (let x = 0; x < width; x += 1) {
      stack.push(x, (height - 1) * width + x);
    }
    for (let y = 0; y < height; y += 1) {
      stack.push(y * width, y * width + width - 1);
    }

    while (stack.length) {
      const idx = stack.pop();
      if (visited[idx] || !isBackground(idx)) continue;
      visited[idx] = 1;
      data[idx * 4 + 3] = 0;
      const x = idx % width;
      const y = Math.floor(idx / width);
      if (x > 0) stack.push(idx - 1);
      if (x < width - 1) stack.push(idx + 1);
      if (y > 0) stack.push(idx - width);
      if (y < height - 1) stack.push(idx + width);
    }

    ctx.putImageData(pixels, 0, 0);
    return canvas;
  }

  getFrame(state, time) {
    const frames = this.frames.get(state) || this.frames.get("idle") || [];
    if (!frames.length) return null;
    const fps = PLAYER_ANIMATION_FPS[state] || 8;
    const index = Math.floor(time * fps) % frames.length;
    return frames[index];
  }
}

function detectTouchDevice() {
  return Boolean(
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
    "ontouchstart" in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    window.innerWidth <= 760
  );
}

class LevelAssetManager {
  constructor() {
    this.images = new Map();
    this.activePaths = new Set();
  }

  getImage(path) {
    return this.images.get(path) || null;
  }

  async loadForLevel(level, onProgress = () => {}) {
    const levelVisuals = [...(level.details || []), ...(level.backdrops || [])];
    const paths = [...new Set(levelVisuals.map((detail) => detail.assetPath).filter(Boolean))];
    this.activePaths = new Set(paths);
    if (!paths.length) {
      onProgress(1, 0, 0);
      this.unloadInactive();
      return;
    }

    let done = 0;
    onProgress(0, done, paths.length);
    await Promise.all(paths.map((path) => this.loadImage(path).finally(() => {
      done += 1;
      onProgress(done / paths.length, done, paths.length);
    })));
    this.unloadInactive();
  }

  loadImage(path) {
    if (this.images.has(path)) return Promise.resolve(this.images.get(path));
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let processed = img;
        try {
          processed = makeEdgeTransparentCanvas(img);
        } catch {
          processed = img;
        }
        this.images.set(path, processed);
        resolve(processed);
      };
      img.onerror = () => resolve(null);
      img.src = path;
    });
  }

  unloadInactive() {
    for (const path of this.images.keys()) {
      if (!this.activePaths.has(path)) this.images.delete(path);
    }
  }
}

function loadCollectibleImages() {
  for (const type of COLLECTIBLE_TYPES) {
    if (!type.image || COLLECTIBLE_IMAGES.has(type.name)) continue;
    const img = new Image();
    img.onload = () => {
      COLLECTIBLE_IMAGES.set(type.name, img);
    };
    img.src = type.image;
  }
}

function loadEnemyImages() {
  for (const [key, paths] of Object.entries(ENEMY_SPRITES)) {
    if (ENEMY_IMAGES.has(key)) continue;
    const frames = [];
    ENEMY_IMAGES.set(key, frames);
    paths.forEach((path) => {
      const img = new Image();
      img.onload = () => {
        try {
          frames.push(makeEdgeTransparentCanvas(img));
        } catch {
          frames.push(img);
        }
      };
      img.src = path;
    });
  }
}

function loadUiImages() {
  for (const [key, path] of Object.entries(UI_ASSETS)) {
    if (UI_IMAGES.has(key)) continue;
    const img = new Image();
    img.onload = () => {
      try {
        UI_IMAGES.set(key, makeEdgeTransparentCanvas(img));
      } catch {
        UI_IMAGES.set(key, img);
      }
    };
    img.src = path;
  }
}

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

class CollectibleItem {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.w = 42;
    this.h = 42;
    this.type = type;
    this.collected = false;
    this.floatOffset = Math.random() * Math.PI * 2;
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(dt, game) {
    if (this.collected) return;
    if (rectsOverlap(this.bounds, game.player.bounds)) {
      this.collected = true;
      game.hunger.add(this.type.hunger);
      game.collectedCount += 1;
      game.consumedKcal += this.type.hunger;
      game.addSkinWalletKcal(this.type.hunger);
      game.checkExtraLifeReward();
      if (this.type.speedBoost) game.player.speedBoost = this.type.speedBoost;
      game.player.registerOzempicSnack();
      const label = this.type.speedBoost ? `+${this.type.hunger} kcal +boost` : `+${this.type.hunger} kcal`;
      game.addFloatingText(label, this.x, this.y - 12, this.type.color);
      game.audio.playCollectible();
    }
  }

  render(ctx, camera, time) {
    if (this.collected) return;
    const bob = Math.sin(time * 4 + this.floatOffset) * 4;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y + bob);
    ctx.save();
    const img = COLLECTIBLE_IMAGES.get(this.type.name);
    if (img) {
      const maxW = this.w + 14;
      const maxH = this.h + 14;
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(img, x + this.w / 2 - drawW / 2, y + this.h / 2 - drawH / 2, drawW, drawH);
    } else {
      ctx.fillStyle = this.type.color;
      ctx.strokeStyle = "#2b2113";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, this.w, this.h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#201900";
      ctx.font = canvasFont(700, 10);
      ctx.textAlign = "center";
      ctx.fillText(this.type.short, x + this.w / 2, y + 24);
    }
    ctx.restore();
  }
}

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
    super(x, y, { name: "Fit Influencerka", hp: 1, damage: 1, vx: 96, color: "#41c56d", patrol: 240 });
    this.pause = 0;
    this.shootCooldown = 1.2 + Math.random() * 0.8;
  }

  update(dt, game) {
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
      this.shootCooldown = 1.45 + Math.random() * 0.75;
    }
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
    this.name = "Burmistrz Paragonu";
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

class ProceduralLevelGenerator {
  constructor(seed = Date.now()) {
    this.seed = seed >>> 0;
  }

  random() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  rand(min, max) {
    return min + (max - min) * this.random();
  }

  pickWeighted(items) {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = this.random() * total;
    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) return item;
    }
    return items[0];
  }

  generate(levelNumber, speedrunMode, levelConfig = null) {
    const config = levelConfig || CAMPAIGN_LEVELS[Math.min(levelNumber - 1, CAMPAIGN_LEVELS.length - 1)];
    if (config && config.bossFight) return this.generateBossArena(levelNumber, speedrunMode, config);
    if (config && config.twinkChase) return this.generateTwinkChase(levelNumber, speedrunMode, config);
    const difficulty = config ? config.difficulty : Math.min(1, (levelNumber - 1) / 7);
    const length = config ? config.length : 5600 + (levelNumber - 1) * 850;
    const platforms = [];
    const details = [];
    const backdrops = [];
    const collectibles = [];
    const enemies = [];
    const checkpoints = [];
    const theme = config ? config.theme : "suburbs";
    const sprintGapTarget = length * this.rand(0.34, 0.58);
    let sprintGapPlaced = false;

    let x = 0;
    let y = CONFIG.groundY;
    platforms.push({ x: 0, y, w: 560, h: 92, kind: "ground" });
    this.addBackdropDetails(backdrops, length, theme);
    this.addTownDetails(details, 0, 560, y, false, theme);

    x = 560;


    while (x < length - 720) {
      const canSpawnPit = x > 780;
      const gapChance = 0.46 + difficulty * 0.24;
      const shouldForceSprintGap = canSpawnPit && !sprintGapPlaced && x >= sprintGapTarget;
      const hasGap = shouldForceSprintGap || (canSpawnPit && this.random() < gapChance);
      const maxFairGap = 168 + difficulty * 42;
      const gap = shouldForceSprintGap ? this.rand(222, 238) : hasGap ? this.rand(118, maxFairGap) : this.rand(6, 28);
      const width = this.rand(230, 500 - difficulty * 95);
      const minPlatformY = 246 + difficulty * 18;
      const verticalRise = hasGap ? 62 + difficulty * 8 : 82 + difficulty * 10;
      const verticalDrop = 72 + difficulty * 12;
      const nextY = clamp(y + this.rand(-verticalRise, verticalDrop), minPlatformY, CONFIG.groundY);
      const previousEnd = x;
      x += gap;

      const platform = { x: Math.round(x), y: Math.round(nextY), w: Math.round(width), h: 92, kind: "ground" };
      platforms.push(platform);
      const farFromFinish = platform.x + platform.w < length - 1100;
      const hasRoomForFront = platform.w >= (theme === "suburbs" ? 360 : 320);
      if (!hasGap && farFromFinish && hasRoomForFront) {
        this.addTownDetails(details, platform.x, platform.w, platform.y, false, theme);
      }

      if (hasGap) {
        this.addSingleCollectible(
          collectibles,
          previousEnd + gap * 0.5 - 18,
          Math.min(y, nextY) - this.rand(82, 120),
          speedrunMode
        );
        if (shouldForceSprintGap) {
          sprintGapPlaced = true;
          if (config && config.label === "1-1") {
            details.push({
              x: previousEnd + gap * 0.5 - 120,
              y: Math.min(y, nextY) - 150,
              w: 240,
              h: 44,
              type: "tutorial",
              text: "Użyj sprintu / doublejump! >>>"
            });
          }
        }
      }

      if (!shouldForceSprintGap && hasGap && (gap > 188 || nextY < y - 34) && this.random() < 0.18) {
        const bridge = {
          x: Math.round(previousEnd + gap * 0.5 - 34),
          y: Math.round(Math.min(y, nextY) - 92),
          w: 68,
          h: 18,
          kind: "floating"
        };
        platforms.push(bridge);
      }

      this.decoratePlatform(platform, collectibles, enemies, levelNumber, difficulty, speedrunMode, config);
      if (!hasGap && farFromFinish && platform.w >= 390 && this.random() < 0.22 + difficulty * 0.1) {
        this.addUpperPlatform(platforms, collectibles, platform, speedrunMode, difficulty);
      }

      if (x > checkpoints.length * 1300 + 1050) {
        checkpoints.push({ x: platform.x + 40, y: platform.y - CONFIG.player.drawHeight, active: false });
      }

      x += width;
      y = nextY;
    }

    const finishX = Math.round(Math.min(length - 420, x + this.rand(112, 160)));
    const finishPlatform = { x: finishX, y: CONFIG.groundY, w: 560, h: 92, kind: "ground" };
    platforms.push(finishPlatform);
    this.addSingleCollectible(collectibles, finishPlatform.x + 120, finishPlatform.y - 76, speedrunMode, "Zestaw McD Powiększony");
    this.addSingleCollectible(collectibles, finishPlatform.x + 330, finishPlatform.y - 92, speedrunMode, "Kubełek KFC");

    if (config && config.boss) {
      enemies.push(new BossFlyingTrackerEnemy(finishPlatform.x + 250, finishPlatform.y - 230));
    }

    return {
      width: finishPlatform.x + finishPlatform.w,
      platforms,
      details,
      backdrops,
      collectibles,
      enemies,
      checkpoints,
      finish: { x: finishPlatform.x + finishPlatform.w - 140, y: CONFIG.groundY - 148, w: 48, h: 148 },
      label: config ? config.label : String(levelNumber),
      world: config ? config.world : "WOLBROM",
      difficulty,
      boss: !!(config && config.boss)
    };
  }

  generateBossArena(levelNumber, speedrunMode, config) {
    const width = 1280;
    const ground = { x: 0, y: CONFIG.groundY, w: width, h: 92, kind: "ground" };
    const platforms = [
      ground,
      { x: -42, y: 0, w: 42, h: CONFIG.groundY + 92, kind: "wall" },
      { x: width, y: 0, w: 42, h: CONFIG.groundY + 92, kind: "wall" },
      { x: 155, y: 330, w: 150, h: 18, kind: "floating" },
      { x: 460, y: 292, w: 170, h: 18, kind: "floating" },
      { x: 780, y: 320, w: 170, h: 18, kind: "floating" },
      { x: 1030, y: 276, w: 145, h: 18, kind: "floating" }
    ];
    const details = [
      { x: 55, y: 98, w: 300, h: 120, type: "tutorial", text: "TEST BOSS FIGHT" },
      { x: 410, y: 126, w: 180, h: 180, type: "shop", theme: "bossfight", sign: "ARENA" },
      { x: 720, y: 110, w: 230, h: 205, type: "block", theme: "bossfight", sign: "BOSS" },
      { x: 1010, y: 138, w: 160, h: 145, type: "shop", theme: "bossfight", sign: "KCAL DROP" }
    ];
    const collectibles = [
      new CollectibleItem(210, 286, COLLECTIBLE_TYPES.find((item) => item.name === "Delicje") || COLLECTIBLE_TYPES[0]),
      new CollectibleItem(545, 246, COLLECTIBLE_TYPES.find((item) => item.name === "Energy Drink") || COLLECTIBLE_TYPES[0])
    ];
    const enemies = [new TestArenaBossEnemy(880, CONFIG.groundY - 78)];
    return {
      width,
      platforms,
      details,
      backdrops: [],
      collectibles,
      enemies,
      checkpoints: [],
      finish: { x: width + 500, y: CONFIG.groundY - 148, w: 48, h: 148 },
      label: config.label,
      world: config.world,
      difficulty: config.difficulty,
      boss: true,
      bossFight: true,
      fixedCamera: true,
      collectibleSpawnTimer: 2.4,
      spawn: { x: 92, y: CONFIG.groundY - CONFIG.player.drawHeight }
    };
  }

  generateTwinkChase(levelNumber, speedrunMode, config) {
    const width = config.length || 999999;
    const theme = config.theme || "center";
    const ground = { x: 0, y: CONFIG.groundY, w: width, h: 92, kind: "ground" };
    const platforms = [ground];
    const details = [
      { x: 220, y: CONFIG.groundY - 188, w: 360, h: 54, type: "tutorial", text: "DOGON TWINKA! >>>" }
    ];
    const backdrops = [];
    const collectibles = [];
    const enemies = [new TwinkChaseTarget(640, CONFIG.groundY - 70)];
    const checkpoints = [];

    for (let sectionX = 0; sectionX < 8200; sectionX += 520) {
      this.addTownDetails(details, sectionX, 500, CONFIG.groundY, false, theme);
    }

    let obstacleX = 920;
    while (obstacleX < 8200) {
      const obstacleW = this.rand(38, 76);
      const obstacleH = this.rand(34, 82);
      platforms.push({
        x: Math.round(obstacleX),
        y: Math.round(CONFIG.groundY - obstacleH),
        w: Math.round(obstacleW),
        h: Math.round(obstacleH),
        kind: "chaseObstacle"
      });

      if (this.random() < 0.34) {
        this.addSingleCollectible(collectibles, obstacleX + this.rand(110, 240), CONFIG.groundY - this.rand(82, 145), speedrunMode);
      }

      obstacleX += this.rand(390, 620);
    }

    for (let x = 420; x < 8200; x += this.rand(520, 760)) {
      if (this.random() < 0.28) this.addSingleCollectible(collectibles, x, CONFIG.groundY - this.rand(72, 135), speedrunMode);
    }

    return {
      width,
      platforms,
      details,
      backdrops,
      collectibles,
      enemies,
      checkpoints,
      finish: { x: width + 1000, y: CONFIG.groundY - 148, w: 48, h: 148 },
      label: config.label,
      world: config.world,
      difficulty: config.difficulty,
      boss: false,
      twinkChase: true,
      collectibleSpawnTimer: 3.6,
      chaseGeneratedUntil: 8200,
      escapeWarningCooldown: 0,
      spawn: { x: 82, y: CONFIG.groundY - CONFIG.player.drawHeight }
    };
  }

  extendTwinkChase(level, targetX, speedrunMode) {
    const theme = level.theme || "center";
    let x = level.chaseGeneratedUntil || 8200;
    while (x < targetX) {
      this.addTownDetails(level.details, x, 500, CONFIG.groundY, false, theme);

      const obstacleX = x + this.rand(180, 390);
      const obstacleW = this.rand(38, 82);
      const obstacleH = this.rand(34, 86);
      level.platforms.push({
        x: Math.round(obstacleX),
        y: Math.round(CONFIG.groundY - obstacleH),
        w: Math.round(obstacleW),
        h: Math.round(obstacleH),
        kind: "chaseObstacle"
      });

      if (this.random() < 0.22) {
        this.addSingleCollectible(level.collectibles, obstacleX + this.rand(140, 260), CONFIG.groundY - this.rand(82, 142), speedrunMode);
      }

      x += this.rand(520, 760);
    }
    level.chaseGeneratedUntil = x;
  }

  decoratePlatform(platform, collectibles, enemies, levelNumber, difficulty, speedrunMode, config = null) {
    const safeStart = platform.x < 680;
    this.addScatteredCollectibles(platform, collectibles, speedrunMode, difficulty);
    const enemyLimit = config && config.label === "1-1" ? 3 : Infinity;
    const canSpawnEnemy = enemies.length < enemyLimit;

    if (canSpawnEnemy && !safeStart && this.random() < 0.44 + difficulty * 0.5) {
      const enemyX = platform.x + this.rand(35, Math.max(55, platform.w - 80));
      const groundY = platform.y - 44;
      enemies.push(this.createEnemy(enemyX, groundY, levelNumber, difficulty));
    }

    if (enemies.length < enemyLimit && !safeStart && difficulty > 0.18 && this.random() < 0.16 + difficulty * 0.22) {
      enemies.push(new FlyerEnemy(platform.x + platform.w * 0.5, platform.y - this.rand(120, 190)));
    }

    if (enemies.length < enemyLimit && !safeStart && difficulty > 0.35 && this.random() < 0.1 + difficulty * 0.18) {
      enemies.push(new ChargerEnemy(platform.x + this.rand(60, Math.max(70, platform.w - 80)), platform.y - 46));
    }
  }

  addUpperPlatform(platforms, collectibles, basePlatform, speedrunMode, difficulty) {
    const margin = 116;
    const w = this.rand(96, 158);
    const maxStart = Math.max(margin + 1, basePlatform.w - margin - w);
    const x = basePlatform.x + this.rand(margin, maxStart);
    const lift = this.rand(118, 168 + difficulty * 18);
    const y = clamp(basePlatform.y - lift, 166, basePlatform.y - 112);
    const upper = {
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: 18,
      kind: "floating"
    };
    platforms.push(upper);

    if (this.random() < (speedrunMode ? 0.34 : 0.58)) {
      this.addSingleCollectible(
        collectibles,
        upper.x + upper.w / 2 - 18,
        upper.y - this.rand(54, 72),
        speedrunMode
      );
    }
  }

  createEnemy(x, y, levelNumber, difficulty) {
    const roster = [
      { weight: 30 - difficulty * 10, make: () => new WalkerEnemy(x, y) },
      { weight: 18 + difficulty * 18, make: () => new FastWalkerEnemy(x, y) },
      { weight: difficulty > 0.12 ? 18 + difficulty * 8 : 0, make: () => new JumperEnemy(x, y, false) },
      { weight: difficulty > 0.32 ? 13 + difficulty * 8 : 0, make: () => new JumperEnemy(x, y, true) },
      { weight: difficulty > 0.38 ? 10 + difficulty * 7 : 0, make: () => new TankEnemy(x, y - 18) },
      { weight: difficulty > 0.5 ? 12 + difficulty * 8 : 0, make: () => new ChargerEnemy(x, y) }
    ].filter((entry) => entry.weight > 0);
    return this.pickWeighted(roster).make();
  }

  addScatteredCollectibles(platform, collectibles, speedrunMode, difficulty) {
    const slotWidth = 145;
    const slots = Math.max(1, Math.floor(platform.w / slotWidth));
    const chance = clamp((speedrunMode ? 0.22 : 0.36) - difficulty * 0.18, 0.1, 0.36);

    for (let i = 0; i < slots; i += 1) {
      if (this.random() > chance) continue;
      const minX = platform.x + 42 + i * slotWidth;
      const maxX = Math.min(platform.x + platform.w - 42, minX + slotWidth - 28);
      if (maxX <= minX) continue;
      this.addSingleCollectible(
        collectibles,
        this.rand(minX, maxX),
        platform.y - this.rand(66, 118),
        speedrunMode
      );
    }
  }

  addSingleCollectible(collectibles, x, y, speedrunMode, forcedName = null) {
    const pool = COLLECTIBLE_TYPES.map((item) => ({
      ...item,
      weight: speedrunMode ? item.weight * (item.hunger > 700 ? 0.65 : 1) : item.weight
    }));
    const type = forcedName ? COLLECTIBLE_TYPES.find((item) => item.name === forcedName) || this.pickWeighted(pool) : this.pickWeighted(pool);
    collectibles.push(new CollectibleItem(x, y, type));
  }

  addTownDetails(details, x, w, groundY, finale = false, theme = "center") {
    if (!finale && w < (theme === "suburbs" ? 330 : 300)) return;
    const signSets = {
      suburbs: ["PIEKARNIA", "CUKIERNIA", "SKLEP U ANI", "WARZYWNIAK", "ARABSKI MASAŻ STOPY"],
      center: ["ŻABKA", "MONOPOLOWY", "PIEKARNIA", "CUKIERNIA", "LEWIATAN", "ROSSMANN"],
      blocks: ["BIEDRONKA", "LEWIATAN", "APTEKA", "ŻABKA", "LOMBARD", "PIZZA"],
      market: ["ŻABKA", "MONOPOLOWY", "ROSSMANN", "BIEDRONKA", "CUKIERNIA", "MC Donalds"]
    };
    const typeSets = {
      suburbs: ["shop", "shop", "shop", "stop"],
      center: ["shop", "block", "shop", "stop"],
      blocks: ["block", "block", "shop", "stop"],
      market: ["shop", "shop", "block", "stop"]
    };
    const signs = signSets[theme] || signSets.center;
    const types = typeSets[theme] || typeSets.center;
    const slot = theme === "suburbs" ? 255 : 235;
    const count = Math.max(1, Math.floor(w / slot));
    for (let i = 0; i < count; i += 1) {
      const type = types[Math.floor(this.rand(0, types.length))];
      const sign = finale ? "META" : signs[Math.floor(this.rand(0, signs.length))];
      const assetPath = this.resolveDetailAsset(theme, type, sign);
      const size = this.getDetailDimensions(theme, type, sign, assetPath);
      const slotX = x + i * slot;
      const centeredOffset = Math.max(10, (slot - size.w) * 0.5);
      details.push({
        x: Math.round(slotX + centeredOffset + this.rand(-10, 10)),
        y: Math.round(groundY - size.h),
        w: Math.round(size.w),
        h: Math.round(size.h),
        type,
        theme,
        sign,
        assetPath,
        parallax: type === "stop" ? 0.72 : 0.9
      });
    }
  }

  addBackdropDetails(backdrops, length, theme = "center") {
    if (theme !== "suburbs") return;
    const houseBaseline = CONFIG.groundY - 14;
    const treeBaseline = CONFIG.groundY - 8;
    for (let x = -260; x < length + 640; x += this.rand(390, 560)) {
      if (this.random() < 0.82) {
        const h = this.rand(285, 395);
        const w = this.rand(430, 650);
        const houseX = Math.round(x + this.rand(-34, 34));
        const parallax = this.rand(0.22, 0.32);
        const treePositions = [];
        if (this.random() < 0.62) treePositions.push("behind-left");
        if (this.random() < 0.5) treePositions.push("front-right");
        if (!treePositions.length && this.random() < 0.3) treePositions.push("behind-right");

        for (const position of treePositions.filter((position) => position.startsWith("behind"))) {
          const treeH = this.rand(140, 230);
          const treeW = treeH * this.rand(0.5, 0.78);
          const edgeX = position === "behind-left"
            ? houseX - treeW * this.rand(0.18, 0.42)
            : houseX + w - treeW * this.rand(0.58, 0.82);
          backdrops.push({
            x: Math.round(edgeX),
            y: Math.round(treeBaseline - treeH),
            w: Math.round(treeW),
            h: Math.round(treeH),
            type: "backdrop-tree",
            assetPath: this.pickAsset(BUILDING_ASSETS.foliage.trees),
            parallax,
            alpha: 0.5
          });
        }

        backdrops.push({
          x: houseX,
          y: Math.round(houseBaseline - h),
          w: Math.round(w),
          h: Math.round(h),
          type: "backdrop-house",
          assetPath: this.pickAsset(BUILDING_ASSETS.suburbs.house),
          parallax,
          alpha: 0.7
        });

        for (const position of treePositions.filter((position) => position.startsWith("front"))) {
          const treeH = this.rand(120, 195);
          const treeW = treeH * this.rand(0.5, 0.76);
          const edgeX = position === "front-right"
            ? houseX + w - treeW * this.rand(0.35, 0.68)
            : houseX - treeW * this.rand(0.08, 0.25);
          backdrops.push({
            x: Math.round(edgeX),
            y: Math.round(treeBaseline - treeH),
            w: Math.round(treeW),
            h: Math.round(treeH),
            type: "backdrop-tree",
            assetPath: this.pickAsset(BUILDING_ASSETS.foliage.trees),
            parallax,
            alpha: 0.68
          });
        }
      }
    }
  }

  resolveDetailAsset(theme, type, sign) {
    const label = String(sign || "").toUpperCase();
    if (theme === "suburbs" && label.includes("PIEK")) return this.pickAsset(BUILDING_ASSETS.suburbs.piekarnia);
    if (theme === "suburbs" && label.includes("CUK")) return this.pickAsset(BUILDING_ASSETS.suburbs.cukiernia);
    if (theme === "suburbs" && label.includes("WARZ")) return this.pickAsset(BUILDING_ASSETS.suburbs.warzywniak);
    if (theme === "suburbs" && label.includes("ANI")) return this.pickAsset(BUILDING_ASSETS.suburbs.sklepuani);
    if (theme === "suburbs" && label.includes("ARAB")) return this.pickAsset(BUILDING_ASSETS.suburbs.arabskiMasaz);
    if (theme === "center" && label.includes("ABKA")) return this.pickAsset(BUILDING_ASSETS.center.frogshopSmall);
    if ((theme === "blocks" || theme === "market") && label.includes("ABKA")) return this.pickAsset(BUILDING_ASSETS.blocks.frogshopCity);
    return null;
  }

  pickAsset(paths) {
    if (!paths || !paths.length) return null;
    return paths[Math.floor(this.rand(0, paths.length))];
  }

  getDetailDimensions(theme, type, sign, assetPath) {
    if (assetPath && assetPath.includes("frogshop-city")) return { w: 260, h: 305 };
    if (assetPath && assetPath.includes("frogshop-small")) return { w: 205, h: 168 };
    if (assetPath && assetPath.includes("lvl1house")) return { w: 172, h: 108 };
    if (assetPath && assetPath.includes("arabski-masaz")) return { w: 210, h: 225 };
    if (assetPath) return { w: theme === "suburbs" ? 198 : 210, h: theme === "suburbs" ? 170 : 185 };
    if (type === "house") return { w: this.rand(95, 145), h: this.rand(62, 96) };
    if (type === "block") return { w: this.rand(128, 178), h: this.rand(135, 225) };
    if (type === "stop") return { w: this.rand(105, 150), h: this.rand(62, 90) };
    return { w: this.rand(110, 176), h: this.rand(84, 175) };
  }
}

class MobileControls {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById("mobileControls");
    this.activePointers = new Map();
    this.actionToCode = {
      left: "ArrowLeft",
      right: "ArrowRight",
      jump: "Space",
      sprint: "ShiftLeft"
    };
    this.bind();
  }

  bind() {
    if (!this.root) return;
    this.root.querySelectorAll("[data-touch-action]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => this.handleDown(event, button));
      button.addEventListener("pointerup", (event) => this.handleUp(event, button));
      button.addEventListener("pointercancel", (event) => this.handleUp(event, button));
      button.addEventListener("lostpointercapture", (event) => this.handleUp(event, button));
      button.addEventListener("contextmenu", (event) => event.preventDefault());
    });
  }

  handleDown(event, button) {
    event.preventDefault();
    const action = button.dataset.touchAction;
    if (action === "pause") {
      if (this.game.state === "playing") this.game.pause();
      else if (this.game.state === "paused") this.game.resume();
      return;
    }
    const code = this.actionToCode[action];
    if (!code) return;
    button.setPointerCapture?.(event.pointerId);
    this.activePointers.set(event.pointerId, { action, code, button });
    button.classList.add("is-active");
    this.game.input.pressVirtual(code);
  }

  handleUp(event, button) {
    const active = this.activePointers.get(event.pointerId);
    if (!active) return;
    event.preventDefault();
    this.activePointers.delete(event.pointerId);
    active.button.classList.remove("is-active");
    const stillHeld = [...this.activePointers.values()].some((item) => item.code === active.code);
    if (!stillHeld) this.game.input.releaseVirtual(active.code);
  }

  clear() {
    this.activePointers.clear();
    this.root?.querySelectorAll(".is-active").forEach((button) => button.classList.remove("is-active"));
    this.game.input.clearVirtual();
  }

  setVisible(visible) {
    if (!this.root) return;
    this.root.classList.toggle("hidden", !visible);
    if (!visible) this.clear();
  }
}

class UIManager {
  constructor(game) {
    this.game = game;
    this.disclaimerOverlay = document.getElementById("disclaimerOverlay");
    this.menuOverlay = document.getElementById("menuOverlay");
    this.startGuideOverlay = document.getElementById("startGuideOverlay");
    this.chaseIntroOverlay = document.getElementById("chaseIntroOverlay");
    this.loadingOverlay = document.getElementById("loadingOverlay");
    this.pauseOverlay = document.getElementById("pauseOverlay");
    this.controlsOverlay = document.getElementById("controlsOverlay");
    this.settingsOverlay = document.getElementById("settingsOverlay");
    this.resultOverlay = document.getElementById("resultOverlay");
    this.resultTitle = document.getElementById("resultTitle");
    this.resultDetails = document.getElementById("resultDetails");
    this.bestTimeLabel = document.getElementById("bestTimeLabel");
    this.unlimitedLivesToggle = document.getElementById("unlimitedLivesToggle");
    this.skipLevelToggle = document.getElementById("skipLevelToggle");
    this.musicVolumeSlider = document.getElementById("musicVolumeSlider");
    this.sfxVolumeSlider = document.getElementById("sfxVolumeSlider");
    this.touchControlsModeSelect = document.getElementById("touchControlsMode");
    this.musicVolumeValue = document.getElementById("musicVolumeValue");
    this.sfxVolumeValue = document.getElementById("sfxVolumeValue");
    this.loadingTitle = document.getElementById("loadingTitle");
    this.loadingDetails = document.getElementById("loadingDetails");
    this.loadingBarFill = document.getElementById("loadingBarFill");
    this.skinWalletLabel = document.getElementById("skinWalletLabel");
    this.skinShopGrid = document.getElementById("skinShopGrid");
    this.screenControls = document.getElementById("screenControls");
    this.fullscreenButton = document.getElementById("fullscreenButton");
    this.screenPauseButton = document.getElementById("screenPauseButton");

    document.getElementById("acceptDisclaimerButton").addEventListener("click", () => this.showMenu());
    document.getElementById("startButton").addEventListener("click", () => {
      if (game.startGuideSeen) {
        game.startGame();
      } else {
        this.showStartGuide();
      }
    });
    document.getElementById("beginGameButton").addEventListener("click", () => {
      game.startGuideSeen = true;
      game.startGame();
    });
    document.getElementById("beginChaseButton")?.addEventListener("click", () => game.beginLoadedLevel());
    this.unlimitedLivesToggle.addEventListener("click", () => {
      game.unlimitedLives = !game.unlimitedLives;
      this.updateMenu();
    });
    this.skipLevelToggle.addEventListener("click", () => {
      game.skipLevelCheat = !game.skipLevelCheat;
      this.updateMenu();
    });
    document.getElementById("resetBestButton").addEventListener("click", () => {
      SaveSystem.resetBestTime();
      this.updateMenu();
    });
    document.getElementById("controlsButton").addEventListener("click", () => this.showShop());
    document.getElementById("settingsButton").addEventListener("click", () => this.showSettings());
    document.getElementById("backButton").addEventListener("click", () => this.showMenu());
    document.getElementById("settingsBackButton").addEventListener("click", () => this.showMenu());
    document.getElementById("nextLevelButton").addEventListener("click", () => game.nextLevel());
    document.getElementById("retryButton").addEventListener("click", () => game.restartLevel());
    document.getElementById("menuButton").addEventListener("click", () => game.returnToMenu());
    document.getElementById("resumeButton").addEventListener("click", () => game.resume());
    document.getElementById("pauseRestartButton").addEventListener("click", () => game.restartLevel());
    document.getElementById("pauseMenuButton").addEventListener("click", () => game.returnToMenu());
    this.fullscreenButton?.addEventListener("click", () => game.toggleFullscreen());
    this.screenPauseButton?.addEventListener("click", () => {
      if (game.state === "playing") game.pause();
      else if (game.state === "paused") game.resume();
    });
    this.musicVolumeSlider.addEventListener("input", () => {
      game.audio.setMusicVolume(Number(this.musicVolumeSlider.value) / 100);
      this.updateSettingsLabels();
    });
    this.sfxVolumeSlider.addEventListener("input", () => {
      game.audio.setSfxVolume(Number(this.sfxVolumeSlider.value) / 100);
      this.updateSettingsLabels();
    });
    this.touchControlsModeSelect.addEventListener("change", () => {
      game.setTouchControlsMode(this.touchControlsModeSelect.value);
      this.updateSettingsLabels();
    });
    this.skinShopGrid?.querySelectorAll(".skin-action").forEach((button) => {
      button.addEventListener("click", async () => {
        await game.handleSkinShopAction(button.dataset.skinId);
        this.updateShop();
        this.updateMenu();
      });
    });
    this.updateMenu();
    this.updateShop();
    this.syncSettingsControls();
    this.updateScreenControls();
  }

  updateMenu() {
    const best = SaveSystem.getBestTime(false);
    this.bestTimeLabel.textContent = best ? `Najlepszy czas: ${formatTime(best)}` : "Najlepszy czas: brak";
    this.unlimitedLivesToggle.textContent = `Unlimited lives: ${this.game.unlimitedLives ? "YES" : "NO"}`;
    this.skipLevelToggle.textContent = `Skip Level (O): ${this.game.skipLevelCheat ? "YES" : "NO"}`;
  }

  updateShop() {
    if (!this.skinWalletLabel || !this.skinShopGrid) return;
    this.skinWalletLabel.textContent = `Saldo: ${Math.floor(this.game.skinWallet)} kcal`;
    this.skinShopGrid.querySelectorAll(".skin-card").forEach((card) => {
      const id = card.dataset.skinId;
      const skin = PLAYER_SKINS[id];
      const owned = this.game.ownedSkins.has(id);
      const selected = this.game.selectedSkinId === id;
      const button = card.querySelector(".skin-action");
      card.classList.toggle("selected", selected);
      card.classList.toggle("locked", !owned);
      if (!button || !skin) return;
      if (selected) {
        button.textContent = "Wybrano";
        button.disabled = true;
      } else if (owned) {
        button.textContent = "Wybierz";
        button.disabled = false;
      } else {
        button.textContent = this.game.skinWallet >= skin.price ? `Kup za ${skin.price} kcal` : `Brakuje ${skin.price - this.game.skinWallet} kcal`;
        button.disabled = this.game.skinWallet < skin.price;
      }
    });
  }

  syncSettingsControls() {
    this.musicVolumeSlider.value = Math.round(this.game.audio.musicVolume * 100);
    this.sfxVolumeSlider.value = Math.round(this.game.audio.sfxVolume * 100);
    this.touchControlsModeSelect.value = this.game.touchControlsMode;
    this.updateSettingsLabels();
  }

  updateSettingsLabels() {
    this.musicVolumeValue.textContent = `${Math.round(this.game.audio.musicVolume * 100)}%`;
    this.sfxVolumeValue.textContent = `${Math.round(this.game.audio.sfxVolume * 100)}%`;
  }

  updateScreenControls() {
    if (!this.screenControls) return;
    const visible = this.game.state === "playing" || this.game.state === "paused";
    this.screenControls.classList.toggle("hidden", !visible);
  }

  showMenu() {
    this.disclaimerOverlay.classList.add("hidden");
    this.menuOverlay.classList.remove("hidden");
    this.startGuideOverlay.classList.add("hidden");
    this.chaseIntroOverlay.classList.add("hidden");
    this.loadingOverlay.classList.add("hidden");
    this.controlsOverlay.classList.add("hidden");
    this.settingsOverlay.classList.add("hidden");
    this.pauseOverlay.classList.add("hidden");
    this.resultOverlay.classList.add("hidden");
    this.updateMenu();
    this.syncSettingsControls();
  }

  showStartGuide() {
    this.disclaimerOverlay.classList.add("hidden");
    this.menuOverlay.classList.add("hidden");
    this.startGuideOverlay.classList.remove("hidden");
    this.chaseIntroOverlay.classList.add("hidden");
    this.loadingOverlay.classList.add("hidden");
    this.controlsOverlay.classList.add("hidden");
    this.settingsOverlay.classList.add("hidden");
    this.pauseOverlay.classList.add("hidden");
    this.resultOverlay.classList.add("hidden");
  }

  hideAll() {
    this.disclaimerOverlay.classList.add("hidden");
    this.menuOverlay.classList.add("hidden");
    this.startGuideOverlay.classList.add("hidden");
    this.chaseIntroOverlay.classList.add("hidden");
    this.loadingOverlay.classList.add("hidden");
    this.controlsOverlay.classList.add("hidden");
    this.settingsOverlay.classList.add("hidden");
    this.pauseOverlay.classList.add("hidden");
    this.resultOverlay.classList.add("hidden");
  }

  showChaseIntro() {
    this.disclaimerOverlay.classList.add("hidden");
    this.menuOverlay.classList.add("hidden");
    this.startGuideOverlay.classList.add("hidden");
    this.loadingOverlay.classList.add("hidden");
    this.controlsOverlay.classList.add("hidden");
    this.settingsOverlay.classList.add("hidden");
    this.pauseOverlay.classList.add("hidden");
    this.resultOverlay.classList.add("hidden");
    this.chaseIntroOverlay.classList.remove("hidden");
    this.updateScreenControls();
  }

  showShop() {
    this.menuOverlay.classList.add("hidden");
    this.settingsOverlay.classList.add("hidden");
    this.controlsOverlay.classList.remove("hidden");
    this.updateShop();
  }

  showLoading(levelLabel = "") {
    this.disclaimerOverlay.classList.add("hidden");
    this.menuOverlay.classList.add("hidden");
    this.startGuideOverlay.classList.add("hidden");
    this.chaseIntroOverlay.classList.add("hidden");
    this.controlsOverlay.classList.add("hidden");
    this.settingsOverlay.classList.add("hidden");
    this.pauseOverlay.classList.add("hidden");
    this.resultOverlay.classList.add("hidden");
    this.loadingTitle.textContent = levelLabel ? `Ładowanie ${levelLabel}` : "Ładowanie poziomu";
    this.loadingDetails.textContent = "Przygotowywanie assetów...";
    this.loadingBarFill.style.width = "0%";
    this.loadingOverlay.classList.remove("hidden");
  }

  updateLoading(progress, done, total) {
    const pct = Math.round(clamp(progress, 0, 1) * 100);
    this.loadingBarFill.style.width = `${pct}%`;
    this.loadingDetails.textContent = total ? `Assety poziomu: ${done}/${total}` : "Gotowe.";
  }

  showSettings() {
    this.menuOverlay.classList.add("hidden");
    this.controlsOverlay.classList.add("hidden");
    this.settingsOverlay.classList.remove("hidden");
    this.syncSettingsControls();
  }

  showPause(show) {
    this.pauseOverlay.classList.toggle("hidden", !show);
  }

  showResult(title, details, nextEnabled = true) {
    this.resultTitle.textContent = title;
    this.resultDetails.innerHTML = details;
    document.getElementById("nextLevelButton").style.display = nextEnabled ? "block" : "none";
    this.resultOverlay.classList.remove("hidden");
  }

  render(ctx) {
    const game = this.game;
    const kcal = game.hunger.value;
    const mobileHud = game.isTouchHud();
    const barW = mobileHud ? Math.min(188, Math.max(150, game.canvas.width * 0.42)) : 300;
    const barH = mobileHud ? 22 : 26;
    const x = mobileHud ? 14 : 24;
    const y = mobileHud ? 27 : 32;
    const ratio = kcal / CONFIG.hunger.max;
    const lowPulse = ratio < 0.25 ? 0.7 + Math.sin(game.time * 12) * 0.3 : 1;
    const kcalColor = ratio > 0.6 ? "#5fd068" : ratio > 0.3 ? "#ffd166" : `rgba(239, 71, 111, ${lowPulse})`;

    ctx.save();
    ctx.fillStyle = "rgba(15, 18, 22, 0.66)";
    ctx.fillRect(0, 0, game.canvas.width, mobileHud ? 70 : 82);
    ctx.fillStyle = "#f4f0df";
    ctx.fillStyle = "#2e323a";
    ctx.fillRect(x, y - 15, barW, barH);
    ctx.fillStyle = kcalColor;
    ctx.fillRect(x, y - 15, barW * ratio, barH);
    ctx.strokeStyle = "#f4f0df";
    ctx.strokeRect(x, y - 15, barW, barH);
    ctx.fillStyle = "#201900";
    ctx.font = canvasFont(800, mobileHud ? 17 : 21);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.ceil(kcal)} kcal`, x + barW / 2, y - 15 + barH / 2 + 1);
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = "#f4f0df";
    ctx.textAlign = "left";
    if (mobileHud) {
      const secondY = 56;
      this.drawLifeIcon(ctx, x, secondY - 15, 20);
      ctx.font = canvasFont(800, 14);
      ctx.fillText(`x ${game.player.lives}`, x + 26, secondY);
      ctx.fillText(`POZIOM: ${game.currentLevel.label}`, x + 82, secondY);
      const eatenX = Math.min(game.canvas.width - 166, x + 214);
      ctx.fillText(`ZJEDZONE: ${game.consumedKcal} kcal`, eatenX, secondY);
    } else {
      ctx.font = canvasFont(700, 20);
      this.drawLifeIcon(ctx, 360, y - 21, 24);
      ctx.fillText(`x ${game.player.lives}`, 392, y);
      ctx.fillText(`Czas: ${formatTime(game.timer.time)}`, 470, y);
      ctx.fillText(`${game.currentLevel.label}`, 610, y);
      ctx.fillText(`Zjedzone: ${game.consumedKcal} kcal`, 690, y);
      ctx.font = canvasFont(700, 17);
      ctx.fillText(game.currentLevel.world, 24, 66);
      ctx.fillText(`Best: ${formatTime(SaveSystem.getBestTime(false))}`, 360, 66);
      ctx.fillText(`Pyszności: ${game.collectedCount}`, 535, 66);
    }
    ctx.restore();
  }

  drawLifeIcon(ctx, x, y, size) {
    const heart = UI_IMAGES.get("live");
    if (heart) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(heart, x, y, size, size);
      ctx.restore();
      return;
    }
    ctx.fillStyle = "#ef476f";
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + size);
    ctx.bezierCurveTo(x - size * 0.2, y + size * 0.55, x, y, x + size * 0.38, y + size * 0.25);
    ctx.bezierCurveTo(x + size * 0.5, y, x + size * 0.92, y, x + size, y + size * 0.25);
    ctx.bezierCurveTo(x + size * 1.15, y + size * 0.62, x + size * 0.62, y + size * 0.85, x + size / 2, y + size);
    ctx.fill();
  }
}

class AudioManager {
  constructor() {
    this.musicVolume = this.loadVolume("music", 1);
    this.sfxVolume = this.loadVolume("sfx", 1);
    this.musicBaseVolume = 0.36;
    this.music = new Audio(AUDIO_ASSETS.musicBg.levelLoop);
    this.music.loop = true;
    this.applyMusicVolume();
    this.jumpPool = this.createPool(AUDIO_ASSETS.sfxEffects.jump, 5, 0.62);
    this.enemyHitPool = this.createPool(AUDIO_ASSETS.sfxEffects.enemyHit, 4, 0.62);
    this.enemyDefeatedPool = this.createPool(AUDIO_ASSETS.sfxEffects.enemyDefeated, 4, 0.68);
    this.collectiblePool = this.createPool(AUDIO_ASSETS.sfxEffects.collectible, 5, 0.58);
    this.hungerWarningPool = this.createPool(AUDIO_ASSETS.sfxEffects.hungerWarning, 2, 0.72);
    this.jumpIndex = 0;
    this.enemyHitIndex = 0;
    this.enemyDefeatedIndex = 0;
    this.collectibleIndex = 0;
    this.hungerWarningIndex = 0;
  }

  createPool(src, count, volume) {
    return Array.from({ length: count }, () => {
      const sound = new Audio(src);
      sound.baseVolume = volume;
      sound.volume = volume * this.sfxVolume;
      return sound;
    });
  }

  loadVolume(type, fallback) {
    try {
      const raw = localStorage.getItem(`odysejaWolbromska.volume.${type}`);
      return raw === null ? fallback : clamp(Number(raw), 0, 1);
    } catch {
      return fallback;
    }
  }

  saveVolume(type, value) {
    try {
      localStorage.setItem(`odysejaWolbromska.volume.${type}`, String(value));
    } catch {
      // Storage can be blocked for local files; volume still works for the current session.
    }
  }

  setMusicVolume(value) {
    this.musicVolume = clamp(value, 0, 1);
    this.applyMusicVolume();
    this.saveVolume("music", this.musicVolume);
  }

  setSfxVolume(value) {
    this.sfxVolume = clamp(value, 0, 1);
    this.updateSfxVolumes();
    this.saveVolume("sfx", this.sfxVolume);
  }

  applyMusicVolume() {
    this.music.volume = this.musicBaseVolume * this.musicVolume;
  }

  updateSfxVolumes() {
    const pools = [this.jumpPool, this.enemyHitPool, this.enemyDefeatedPool, this.collectiblePool, this.hungerWarningPool].filter(Boolean);
    pools.flat().forEach((sound) => {
      sound.volume = (sound.baseVolume || 1) * this.sfxVolume;
    });
  }

  playFromPool(pool, indexKey) {
    const sound = pool[this[indexKey]];
    this[indexKey] = (this[indexKey] + 1) % pool.length;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }

  playMusic() {
    if (!this.music.paused) return;
    this.music.play().catch(() => {
      // Browser may block audio until the next direct user gesture.
    });
  }

  pauseMusic() {
    this.music.pause();
  }

  playJump() {
    this.playFromPool(this.jumpPool, "jumpIndex");
  }

  playEnemyHit() {
    this.playFromPool(this.enemyHitPool, "enemyHitIndex");
  }

  playEnemyDefeated() {
    this.playFromPool(this.enemyDefeatedPool, "enemyDefeatedIndex");
  }

  playCollectible() {
    this.playFromPool(this.collectiblePool, "collectibleIndex");
  }

  playHungerWarning() {
    this.playFromPool(this.hungerWarningPool, "hungerWarningIndex");
  }
}

class GameManager {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.input = new InputManager();
    this.sprites = new SpriteLoader();
    this.camera = new CameraSystem(this.canvas);
    this.levelAssets = new LevelAssetManager();
    this.player = new PlayerController(this);
    this.hunger = new HungerSystem(this);
    this.timer = new SpeedrunTimer();
    this.audio = new AudioManager();
    this.speedrunMode = false;
    this.touchControlsMode = this.loadTouchControlsMode();
    this.ownedSkins = SaveSystem.getOwnedSkins();
    this.selectedSkinId = SaveSystem.getSelectedSkin();
    if (!this.ownedSkins.has(this.selectedSkinId)) this.selectedSkinId = DEFAULT_SKIN_ID;
    this.skinWallet = SaveSystem.getSkinWallet();
    this.ui = new UIManager(this);
    this.mobileControls = new MobileControls(this);
    this.levelGenerator = new ProceduralLevelGenerator();
    this.levelIndex = 0;
    this.levelNumber = 1;
    this.currentLevel = CAMPAIGN_LEVELS[this.levelIndex];
    this.level = this.levelGenerator.generate(1, false, this.currentLevel);
    this.state = "menu";
    this.startGuideSeen = false;
    this.unlimitedLives = false;
    this.skipLevelCheat = false;
    this.collectedCount = 0;
    this.consumedKcal = 0;
    this.nextExtraLifeKcal = 15000;
    this.floatingTexts = [];
    this.projectiles = [];
    this.finishWarningCooldown = 0;
    this.dimAlpha = 0;
    this.dimTarget = 0;
    this.sceneFreezeTime = null;
    this.lastTime = 0;
    this.time = 0;
    this.dt = 0;

    this.bindControls();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    document.addEventListener("fullscreenchange", () => this.resize());
    document.addEventListener("webkitfullscreenchange", () => this.resize());
    const coarsePointerQuery = window.matchMedia ? window.matchMedia("(pointer: coarse)") : null;
    coarsePointerQuery?.addEventListener?.("change", () => this.updateTouchControlsVisibility());

    this.sprites.load(this.selectedSkinId);
    loadCollectibleImages();
    loadEnemyImages();
    loadUiImages();
    document.fonts?.load(`12px ${GAME_FONT}`).catch(() => {});
    requestAnimationFrame((now) => this.loop(now));
  }

  bindControls() {
    this.input.bind("Escape", () => {
      if (this.state === "playing") this.pause();
      else if (this.state === "paused") this.resume();
    });
    this.input.bind("KeyR", () => {
      if (["playing", "paused", "complete", "gameover"].includes(this.state)) this.restartLevel();
    });
    this.input.bind("KeyO", () => {
      if (this.skipLevelCheat && this.state === "playing") this.skipLevel();
    });
  }

  resize() {
    const box = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(320, Math.floor(box.width));
    this.canvas.height = Math.max(320, Math.floor(box.height));
    this.updateTouchControlsVisibility();
  }

  getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  toggleFullscreen() {
    const target = document.querySelector(".game-shell") || this.canvas;
    const current = this.getFullscreenElement();
    if (current || target.classList.contains("is-faux-fullscreen")) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (current) exit?.call(document);
      target.classList.remove("is-faux-fullscreen");
      this.resize();
      return;
    }

    const request = target.requestFullscreen || target.webkitRequestFullscreen;
    if (!request) {
      target.classList.add("is-faux-fullscreen");
      this.resize();
      return;
    }
    request.call(target)?.catch?.(() => {
      target.classList.add("is-faux-fullscreen");
      this.resize();
    });
  }

  loadTouchControlsMode() {
    try {
      const raw = localStorage.getItem("odysejaWolbromska.touchControlsMode");
      return ["auto", "on", "off"].includes(raw) ? raw : "auto";
    } catch {
      return "auto";
    }
  }

  setTouchControlsMode(mode) {
    this.touchControlsMode = ["auto", "on", "off"].includes(mode) ? mode : "auto";
    try {
      localStorage.setItem("odysejaWolbromska.touchControlsMode", this.touchControlsMode);
    } catch {
      // Local file storage can be unavailable; the setting still applies this session.
    }
    this.updateTouchControlsVisibility();
  }

  addSkinWalletKcal(amount) {
    this.skinWallet = Math.floor(this.skinWallet + Math.max(0, amount));
    SaveSystem.setSkinWallet(this.skinWallet);
  }

  async handleSkinShopAction(skinId) {
    const skin = PLAYER_SKINS[skinId];
    if (!skin) return false;

    if (!this.ownedSkins.has(skinId)) {
      if (this.skinWallet < skin.price) return false;
      this.skinWallet -= skin.price;
      this.ownedSkins.add(skinId);
      SaveSystem.setSkinWallet(this.skinWallet);
      SaveSystem.setOwnedSkins(this.ownedSkins);
    }

    this.selectedSkinId = skinId;
    SaveSystem.setSelectedSkin(skinId);
    await this.sprites.load(skinId);
    return true;
  }

  shouldShowTouchControls() {
    if (this.touchControlsMode === "on") return true;
    if (this.touchControlsMode === "off") return false;
    return detectTouchDevice();
  }

  updateTouchControlsVisibility() {
    const stateAllowsControls = this.state === "playing";
    this.mobileControls?.setVisible(stateAllowsControls && this.shouldShowTouchControls());
    this.ui?.updateScreenControls();
  }

  isTouchHud() {
    return this.canvas.width <= 700 || (this.shouldShowTouchControls() && detectTouchDevice());
  }

  async startGame() {
    this.levelIndex = 0;
    this.levelNumber = 1;
    this.currentLevel = CAMPAIGN_LEVELS[this.levelIndex];
    this.collectedCount = 0;
    this.consumedKcal = 0;
    this.nextExtraLifeKcal = 15000;
    this.player.clearOzempicStatus(false);
    this.state = "loading";
    this.ui.showLoading(`${this.currentLevel.world} ${this.currentLevel.label}`);
    this.generateLevel();
    await this.loadCurrentLevelAssets();
    this.player.reset();
    this.hunger.reset();
    this.timer.reset();
    this.dimAlpha = 0;
    this.dimTarget = 0;
    this.sceneFreezeTime = null;
    if (this.currentLevel.twinkChase) {
      this.state = "chaseintro";
      this.ui.showChaseIntro();
      return;
    }
    this.beginLoadedLevel();
  }

  generateLevel() {
    this.currentLevel = CAMPAIGN_LEVELS[this.levelIndex] || CAMPAIGN_LEVELS[CAMPAIGN_LEVELS.length - 1];
    this.levelNumber = this.levelIndex + 1;
    this.levelGenerator = new ProceduralLevelGenerator(Date.now() + this.levelNumber * 99991);
    this.level = this.levelGenerator.generate(this.levelNumber, this.speedrunMode, this.currentLevel);
    this.camera.x = 0;
    this.camera.y = 0;
    this.floatingTexts = [];
    this.projectiles = [];
    this.finishWarningCooldown = 0;
    this.dimAlpha = 0;
    this.dimTarget = 0;
    this.sceneFreezeTime = null;
    this.player.spawnX = this.level.spawn ? this.level.spawn.x : 82;
    this.player.spawnY = this.level.spawn ? this.level.spawn.y : CONFIG.groundY - this.player.h;
    this.player.spawnHeight = this.level.spawn ? CONFIG.player.drawHeight : this.player.h;
    this.player.checkpoint = { x: this.player.spawnX, y: this.player.spawnY, standingHeight: this.player.spawnHeight };
  }

  async nextLevel() {
    this.levelIndex = Math.min(this.levelIndex + 1, CAMPAIGN_LEVELS.length - 1);
    this.collectedCount = 0;
    this.currentLevel = CAMPAIGN_LEVELS[this.levelIndex] || CAMPAIGN_LEVELS[CAMPAIGN_LEVELS.length - 1];
    this.state = "loading";
    this.ui.showLoading(`${this.currentLevel.world} ${this.currentLevel.label}`);
    this.generateLevel();
    await this.loadCurrentLevelAssets();
    const lives = this.player.lives;
    this.player.reset();
    this.player.lives = lives;
    this.hunger.reset();
    this.timer.reset();
    this.dimAlpha = 0;
    this.dimTarget = 0;
    this.sceneFreezeTime = null;
    if (this.currentLevel.twinkChase) {
      this.state = "chaseintro";
      this.ui.showChaseIntro();
      return;
    }
    this.beginLoadedLevel();
  }

  skipLevel() {
    this.addFloatingText("Skip level!", this.player.x + this.player.w / 2, this.player.y - 42, "#ffd166");
    if (this.levelIndex >= CAMPAIGN_LEVELS.length - 1) {
      this.completeLevel();
      return;
    }
    this.nextLevel();
  }

  async restartLevel() {
    this.collectedCount = 0;
    this.consumedKcal = 0;
    this.nextExtraLifeKcal = 15000;
    this.state = "loading";
    this.ui.showLoading(`${this.currentLevel.world} ${this.currentLevel.label}`);
    this.generateLevel();
    await this.loadCurrentLevelAssets();
    this.player.reset();
    this.hunger.reset();
    this.timer.reset();
    this.dimAlpha = 0;
    this.dimTarget = 0;
    this.sceneFreezeTime = null;
    if (this.currentLevel.twinkChase) {
      this.state = "chaseintro";
      this.ui.showChaseIntro();
      return;
    }
    this.beginLoadedLevel();
  }

  beginLoadedLevel() {
    this.state = "playing";
    this.ui.hideAll();
    this.timer.start();
    this.audio.playMusic();
    this.updateTouchControlsVisibility();
  }

  async loadCurrentLevelAssets() {
    await this.levelAssets.loadForLevel(this.level, (progress, done, total) => {
      this.ui.updateLoading(progress, done, total);
    });
  }

  returnToMenu() {
    this.state = "menu";
    this.timer.stop();
    this.audio.pauseMusic();
    this.dimAlpha = 0;
    this.dimTarget = 0;
    this.sceneFreezeTime = null;
    this.ui.showMenu();
  }

  pause() {
    this.state = "paused";
    this.timer.stop();
    this.audio.pauseMusic();
    this.ui.showPause(true);
    this.updateTouchControlsVisibility();
  }

  resume() {
    this.state = "playing";
    this.timer.start();
    this.audio.playMusic();
    this.ui.showPause(false);
    this.updateTouchControlsVisibility();
  }

  playerDie(fromPit) {
    if (this.state !== "playing") return;
    if (!this.unlimitedLives) this.player.lives -= 1;
    if (fromPit) this.addFloatingText("Przepaść!", this.player.x, this.player.y - 20, "#ef476f");
    this.audio.playEnemyDefeated();
    if (this.player.lives <= 0) {
      this.gameOver();
    } else {
      this.projectiles = [];
      this.player.respawnAtCheckpoint();
    }
  }

  gameOver() {
    this.state = "gameover";
    this.timer.stop();
    this.audio.pauseMusic();
    this.dimTarget = 0.82;
    this.sceneFreezeTime = this.time;
    this.ui.showResult(
      "Game Over",
      `NIE UDAŁO CI SIĘ DOTRZEĆ DO DUBAJU.<br>Czas: ${formatTime(this.timer.time)}<br>Skonsumowane: ${this.consumedKcal} kcal<br>Pyszności: ${this.collectedCount}`,
      false
    );
  }

  checkExtraLifeReward() {
    while (this.consumedKcal >= this.nextExtraLifeKcal) {
      this.player.lives += 1;
      this.addFloatingText("+1 życie!", this.player.x + this.player.w / 2, this.player.y - 28, "#5fd068");
      this.nextExtraLifeKcal += 15000;
    }
  }

  completeLevel() {
    if (this.state !== "playing") return;
    this.state = "complete";
    this.timer.stop();
    this.audio.pauseMusic();
    this.dimTarget = 0.74;
    this.sceneFreezeTime = this.time;
    const bestBefore = SaveSystem.getBestTime(this.speedrunMode);
    const newRecord = SaveSystem.setBestTime(this.speedrunMode, this.timer.time);
    const bestAfter = SaveSystem.getBestTime(this.speedrunMode);
    const recordLine = newRecord && bestBefore ? "Pobito rekord!" : newRecord ? "Pierwszy rekord zapisany." : "Rekord bez zmian.";
    const hasNext = this.levelIndex < CAMPAIGN_LEVELS.length - 1;
    this.ui.showResult(
      "Poziom ukończony",
      `${this.currentLevel.world} ${this.currentLevel.label}<br>Czas: ${formatTime(this.timer.time)}<br>Najlepszy: ${formatTime(bestAfter)}<br>${recordLine}<br>Skonsumowane: ${this.consumedKcal} kcal<br>Pyszności: ${this.collectedCount}`,
      hasNext
    );
  }

  addFloatingText(text, x, y, color = "#fff7dd") {
    this.floatingTexts.push({ text, x, y, color, life: 1.05, vy: -34 });
  }

  loop(now) {
    const seconds = now / 1000;
    this.dt = Math.min(0.033, seconds - (this.lastTime || seconds));
    this.lastTime = seconds;
    this.time += this.dt;

    if (this.state === "playing") this.update(this.dt);
    this.dimAlpha = lerp(this.dimAlpha, this.dimTarget, 1 - Math.pow(0.0005, this.dt));
    this.updateTouchControlsVisibility();
    this.render();
    this.input.update(this.dt);
    requestAnimationFrame((next) => this.loop(next));
  }

  update(dt) {
    this.timer.update(dt);
    this.player.update(dt);
    if (this.level.fixedCamera) {
      this.camera.x = 0;
      this.camera.y = 0;
    }
    else this.camera.update(dt, this.player, this.level.width);

    for (const item of this.level.collectibles) item.update(dt, this);
    this.level.collectibles = this.level.collectibles.filter((item) => !item.collected);

    for (const enemy of this.level.enemies) {
      enemy.update(dt, this);
      enemy.handlePlayerCollision(this);
    }
    this.level.enemies = this.level.enemies.filter((enemy) => !enemy.dead);

    for (const projectile of this.projectiles) projectile.update(dt, this);
    this.projectiles = this.projectiles.filter((projectile) => !projectile.dead);
    if (this.finishWarningCooldown > 0) this.finishWarningCooldown -= dt;
    if (this.level.bossFight) this.updateBossArena(dt);
    if (this.level.twinkChase) this.updateTwinkChase(dt);

    for (const checkpoint of this.level.checkpoints) {
      if (!checkpoint.active && Math.abs(this.player.x - checkpoint.x) < 44 && this.player.y < checkpoint.y + 110) {
        checkpoint.active = true;
        this.player.checkpoint = { x: checkpoint.x, y: checkpoint.y, standingHeight: CONFIG.player.drawHeight };
        this.addFloatingText("Checkpoint", checkpoint.x, checkpoint.y - 22, "#45d4ff");
      }
    }

    if (!this.level.twinkChase && rectsOverlap(this.player.bounds, this.level.finish)) {
      const bossAlive = this.level.boss && this.level.enemies.some((enemy) => enemy instanceof BossFlyingTrackerEnemy || enemy instanceof TestArenaBossEnemy);
      if (bossAlive) {
        if (this.finishWarningCooldown <= 0) {
          this.addFloatingText("Najpierw boss!", this.player.x, this.player.y - 30, "#ffd166");
          this.finishWarningCooldown = 0.8;
        }
      } else {
        this.completeLevel();
      }
    }

    for (const text of this.floatingTexts) {
      text.y += text.vy * dt;
      text.life -= dt;
    }
    this.floatingTexts = this.floatingTexts.filter((text) => text.life > 0);
  }

  updateBossArena(dt) {
    const bossAlive = this.level.enemies.some((enemy) => enemy instanceof TestArenaBossEnemy);
    if (!bossAlive) {
      this.completeLevel();
      return;
    }
    this.level.collectibleSpawnTimer = (this.level.collectibleSpawnTimer || 0) - dt;
    if (this.level.collectibleSpawnTimer > 0 || this.level.collectibles.length >= 4) return;

    const reachableSpots = [
      { x: 155, y: 330 },
      { x: 460, y: 292 },
      { x: 780, y: 320 },
      { x: 1030, y: 276 },
      { x: 180, y: CONFIG.groundY },
      { x: 610, y: CONFIG.groundY },
      { x: 1040, y: CONFIG.groundY }
    ];
    const spot = reachableSpots[Math.floor(Math.random() * reachableSpots.length)];
    const fancyPool = ["Lays Chips", "Delicje", "Energy Drink", "Kinder Bueno", "Schoko Bons"];
    if (Math.random() < 0.16) fancyPool.push("Kubełek KFC");
    const name = fancyPool[Math.floor(Math.random() * fancyPool.length)];
    const type = COLLECTIBLE_TYPES.find((item) => item.name === name) || COLLECTIBLE_TYPES[0];
    this.level.collectibles.push(new CollectibleItem(spot.x + Math.random() * 70, spot.y - 72 - Math.random() * 32, type));
    this.addFloatingText("KCAL DROP!", spot.x + 35, spot.y - 95, "#ffd166");
    this.level.collectibleSpawnTimer = 3.2 + Math.random() * 2.4;
  }

  updateTwinkChase(dt) {
    const twink = this.level.enemies.find((enemy) => enemy instanceof TwinkChaseTarget);
    if (!twink) return;
    this.levelGenerator.extendTwinkChase(this.level, this.player.x + this.canvas.width * 3.2, this.speedrunMode);

    const keepAfterX = Math.max(0, this.player.x - 900);
    const ground = this.level.platforms[0];
    this.level.platforms = [ground, ...this.level.platforms.slice(1).filter((platform) => platform.x + platform.w > keepAfterX)];
    this.level.details = this.level.details.filter((detail) => detail.x + detail.w > keepAfterX);
    this.level.collectibles = this.level.collectibles.filter((item) => !item.collected && item.x + item.w > keepAfterX);

    const lead = twink.x - this.player.x;
    if (lead > 900) {
      this.level.escapeWarningCooldown = (this.level.escapeWarningCooldown || 0) - dt;
      if (this.level.escapeWarningCooldown <= 0) {
        this.addFloatingText("UCIEKA!", this.player.x + this.player.w / 2, this.player.y - 38, "#ef476f");
        this.level.escapeWarningCooldown = 1.1;
      }
    }

    this.level.collectibleSpawnTimer = (this.level.collectibleSpawnTimer || 0) - dt;
    if (this.level.collectibleSpawnTimer > 0 || this.level.collectibles.length >= 5) return;
    const spawnX = this.player.x + this.canvas.width * this.levelGenerator.rand(0.52, 0.86);
    const spawnY = CONFIG.groundY - this.levelGenerator.rand(82, 132);
    this.levelGenerator.addSingleCollectible(this.level.collectibles, spawnX, spawnY, this.speedrunMode);
    this.level.collectibleSpawnTimer = this.levelGenerator.rand(3.4, 5.2);
  }

  render() {
    const ctx = this.ctx;
    const renderTime = this.sceneFreezeTime ?? this.time;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.renderBackground(ctx);
    this.renderWorld(ctx);
    this.level.collectibles.forEach((item) => item.render(ctx, this.camera, renderTime));
    this.level.enemies.forEach((enemy) => enemy.render(ctx, this.camera));
    this.projectiles.forEach((projectile) => projectile.render(ctx, this.camera));
    this.player.render(ctx, this.camera, this.sprites, renderTime);
    this.renderFloatingTexts(ctx);
    this.ui.render(ctx);
    this.renderDim(ctx);
  }

  renderDim(ctx) {
    if (this.dimAlpha <= 0.01) return;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${this.dimAlpha})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  renderBackground(ctx) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cam = this.camera.x;
    const theme = this.currentLevel ? this.currentLevel.theme : "center";
    const palette = THEME_PALETTES[theme] || THEME_PALETTES.center;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, palette.skyTop);
    sky.addColorStop(0.65, palette.skyMid);
    sky.addColorStop(1, palette.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    if (theme === "bossfight") {
      ctx.fillStyle = "rgba(255, 209, 102, 0.16)";
      for (let x = 0; x < w; x += 92) {
        ctx.fillRect(x, 96, 44, 310);
      }
      ctx.fillStyle = "rgba(239, 71, 111, 0.26)";
      ctx.fillRect(0, 118, w, 8);
      ctx.fillRect(0, 372, w, 10);
      ctx.fillStyle = "#ffd166";
      ctx.font = canvasFont(900, 24);
      ctx.textAlign = "center";
      ctx.fillText("TEST BOSS FIGHT", w / 2, 178);
      ctx.font = canvasFont(800, 9);
      ctx.fillText("STOMP THE BOSS - SURVIVE THE TEST ATTACKS", w / 2, 204);
      return;
    }

    const hasSuburbBackdrops = theme === "suburbs" && this.level && this.level.backdrops && this.level.backdrops.length;
    if (hasSuburbBackdrops) this.renderBackdropLayer(ctx);

    ctx.fillStyle = palette.far;
    const farStep = theme === "suburbs" ? 230 : 260;
    if (!hasSuburbBackdrops) {
      for (let x = -((cam * 0.18) % farStep); x < w + farStep; x += farStep) {
        const bx = Math.round(x);
        if (theme === "suburbs") {
          ctx.fillRect(bx + 18, 285, 132, 82);
          ctx.beginPath();
          ctx.moveTo(bx + 4, 285);
          ctx.lineTo(bx + 84, 224);
          ctx.lineTo(bx + 164, 285);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "rgba(255, 235, 171, 0.38)";
          ctx.fillRect(bx + 52, 310, 20, 22);
          ctx.fillRect(bx + 102, 310, 20, 22);
          ctx.fillStyle = palette.far;
        } else {
          const blockH = theme === "market" ? 190 : 260;
          ctx.fillRect(bx, 118 + (260 - blockH), 145, blockH);
          ctx.fillStyle = "rgba(230, 222, 163, 0.45)";
          for (let row = 0; row < 5; row += 1) {
            for (let col = 0; col < 3; col += 1) {
              ctx.fillRect(bx + 20 + col * 36, 146 + row * 38 + (260 - blockH), 18, 18);
            }
          }
          ctx.fillStyle = palette.far;
        }
      }
    }

    ctx.fillStyle = palette.near;
    for (let x = -((cam * 0.35) % 320); x < w + 320; x += 320) {
      ctx.fillRect(Math.round(x + 80), 345, 110, 42);
      ctx.fillRect(Math.round(x + 80), 330, 8, 68);
      ctx.fillRect(Math.round(x + 178), 330, 8, 68);
      ctx.fillStyle = theme === "suburbs" ? "#d7c16e" : "#e8c85f";
      ctx.fillRect(Math.round(x + 91), 352, 72, 16);
      ctx.fillStyle = palette.near;
    }

    this.renderParallaxRoad(ctx, theme);
  }

  renderParallaxRoad(ctx, theme) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const groundY = Math.round(CONFIG.groundY - this.camera.y);
    const scroll = this.camera.x * 0.58;
    const slabW = theme === "suburbs" ? 86 : 74;
    const slabOffset = -((scroll) % slabW);
    const sidewalkY = groundY - 27;
    const sidewalkH = 34;
    const roadY = groundY + 18;

    ctx.save();

    const sidewalkBase = theme === "market" ? "#b7aa94" : theme === "blocks" ? "#9ea6a4" : "#a7b8ad";
    const sidewalkTop = theme === "market" ? "#d3c3a4" : "#c4d2c9";
    ctx.fillStyle = sidewalkBase;
    ctx.fillRect(0, sidewalkY, w, sidewalkH);
    ctx.fillStyle = sidewalkTop;
    ctx.fillRect(0, sidewalkY, w, 5);
    ctx.strokeStyle = "rgba(44, 55, 51, 0.38)";
    ctx.lineWidth = 1.5;
    for (let x = slabOffset - slabW; x < w + slabW; x += slabW) {
      const sx = Math.round(x);
      ctx.beginPath();
      ctx.moveTo(sx, sidewalkY + 5);
      ctx.lineTo(sx, sidewalkY + sidewalkH);
      ctx.stroke();
    }

    const roadGradient = ctx.createLinearGradient(0, roadY, 0, h);
    roadGradient.addColorStop(0, "rgba(34, 36, 34, 0.78)");
    roadGradient.addColorStop(1, "rgba(15, 15, 16, 0.86)");
    ctx.fillStyle = roadGradient;
    ctx.fillRect(0, roadY, w, Math.max(0, h - roadY));
    ctx.fillStyle = "rgba(185, 194, 179, 0.25)";
    ctx.fillRect(0, roadY, w, 3);

    ctx.restore();
  }

  renderBackdropLayer(ctx) {
    for (const d of this.level.backdrops || []) {
      const parallax = d.parallax ?? 0.26;
      const x = Math.round(d.x - this.camera.x * parallax);
      if (x + d.w < -120 || x > this.canvas.width + 120) continue;
      const y = Math.round(d.y - this.camera.y * 0.08);
      const assetImage = d.assetPath ? this.levelAssets.getImage(d.assetPath) : null;
      ctx.save();
      ctx.globalAlpha = d.alpha ?? 0.68;
      if (assetImage) {
        this.drawAssetInBox(ctx, assetImage, x, y, d.w, d.h);
      } else {
        ctx.fillStyle = d.type === "backdrop-tree" ? "#58745a" : "#889889";
        ctx.fillRect(x, y, d.w, d.h);
      }
      ctx.restore();
    }
  }

  drawAssetInBox(ctx, img, x, y, w, h) {
    ctx.imageSmoothingEnabled = false;
    const scale = Math.min(w / img.width, h / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = x + (w - drawW) / 2;
    const drawY = y + h - drawH;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  renderWorld(ctx) {
    this.renderDetails(ctx);
    for (const p of this.level.platforms) this.renderPlatform(ctx, p);
    this.renderCheckpoints(ctx);
    this.renderFinish(ctx);
  }

  renderDetails(ctx) {
    for (const d of this.level.details) {
      const parallax = d.type === "tutorial" ? 1 : d.parallax ?? 0.84;
      const x = Math.round(d.x - this.camera.x * parallax);
      const y = Math.round(d.y - this.camera.y);
      if (d.type === "tutorial") {
        ctx.save();
        ctx.font = canvasFont(800, 22);
        const text = d.text || "";
        const padX = 18;
        const padY = 10;
        const boxW = Math.max(d.w || 0, Math.ceil(ctx.measureText(text).width + padX * 2));
        const boxH = Math.max(d.h || 0, 44, Math.ceil(22 + padY * 2));
        const boxX = Math.round(x + ((d.w || boxW) - boxW) / 2);
        if (boxX + boxW < -80 || boxX > this.canvas.width + 80) {
          ctx.restore();
          continue;
        }
        ctx.fillStyle = "rgba(15, 18, 22, 0.76)";
        ctx.fillRect(boxX, y, boxW, boxH);
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, y, boxW, boxH);
        ctx.fillStyle = "#ffd166";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#201900";
        ctx.strokeText(text, boxX + boxW / 2, y + boxH / 2 + 1);
        ctx.fillText(text, boxX + boxW / 2, y + boxH / 2 + 1);
        ctx.restore();
        continue;
      }
      if (x + d.w < -80 || x > this.canvas.width + 80) continue;
      const assetImage = d.assetPath ? this.levelAssets.getImage(d.assetPath) : null;
      if (assetImage) {
        ctx.save();
        this.drawAssetInBox(ctx, assetImage, x, y, d.w, d.h);
        ctx.restore();
        continue;
      }
      if (d.type === "house") {
        ctx.fillStyle = d.theme === "suburbs" ? "#c9b08c" : "#bda58c";
        ctx.fillRect(x, y + d.h * 0.28, d.w, d.h * 0.72);
        ctx.fillStyle = "#7c4a3c";
        ctx.beginPath();
        ctx.moveTo(x - 8, y + d.h * 0.3);
        ctx.lineTo(x + d.w / 2, y);
        ctx.lineTo(x + d.w + 8, y + d.h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#f0db8c";
        ctx.fillRect(x + 18, y + d.h * 0.45, 22, 18);
        ctx.fillRect(x + d.w - 42, y + d.h * 0.45, 22, 18);
        ctx.fillStyle = "#594032";
        ctx.fillRect(x + d.w / 2 - 10, y + d.h - 34, 20, 34);
      } else if (d.type === "stop") {
        ctx.fillStyle = "#2f343a";
        ctx.fillRect(x, y + d.h - 16, d.w, 16);
        ctx.fillStyle = "#4c5964";
        ctx.fillRect(x + 14, y, d.w - 28, d.h);
        ctx.fillStyle = "rgba(180, 220, 230, 0.65)";
        ctx.fillRect(x + 24, y + 12, d.w - 48, d.h - 34);
      } else if (d.type === "shop") {
        ctx.fillStyle = d.theme === "market" ? "#695f58" : "#58606b";
        ctx.fillRect(x, y, d.w, d.h);
        ctx.fillStyle = "#2f343a";
        ctx.fillRect(x, y + d.h - 42, d.w, 42);
        ctx.fillStyle = "rgba(178, 224, 229, 0.68)";
        ctx.fillRect(x + 10, y + d.h - 34, d.w - 20, 24);
        ctx.fillStyle = d.sign === "ŻABKA" ? "#2bbf58" : d.sign === "BIEDRONKA" ? "#d92e2e" : d.sign === "ROSSMANN" ? "#dfe7f7" : "#f7d774";
        ctx.fillRect(x + 8, y + 10, d.w - 16, 20);
      } else {
        ctx.fillStyle = "#565d65";
        ctx.fillRect(x, y, d.w, d.h);
        ctx.fillStyle = "#30353c";
        ctx.fillRect(x, y + d.h - 28, d.w, 28);
        ctx.fillStyle = "#e8d47b";
        for (let wx = x + 14; wx < x + d.w - 16; wx += 30) {
          for (let wy = y + 16; wy < y + d.h - 42; wy += 32) ctx.fillRect(wx, wy, 14, 13);
        }
      }
      ctx.fillStyle = d.type === "shop" ? "rgba(255,255,255,0)" : "#f7d774";
      if (d.type !== "shop") ctx.fillRect(x + 8, y + d.h - 22, d.w - 16, 16);
      ctx.fillStyle = "#26200c";
      ctx.font = canvasFont(700, 7);
      ctx.textAlign = "center";
      ctx.fillText(d.sign, x + d.w / 2, d.type === "shop" ? y + 24 : y + d.h - 10);
    }
  }

  renderPlatform(ctx, p) {
    if (p.kind === "wall") return;
    const x = Math.round(p.x - this.camera.x);
    const y = Math.round(p.y - this.camera.y);
    const theme = this.currentLevel ? this.currentLevel.theme : "center";
    if (x + p.w < -80 || x > this.canvas.width + 80) return;
    if (p.kind === "floating") {
      ctx.fillStyle = theme === "suburbs" ? "#78806f" : "#7b817d";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = theme === "market" ? "#d3b98f" : "#c7c1aa";
      for (let tx = x; tx < x + p.w; tx += 24) ctx.strokeRect(tx, y, 24, p.h);
      return;
    }

    if (p.kind === "chaseObstacle") {
      ctx.fillStyle = "#745347";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#a77a57";
      ctx.fillRect(x + 4, y + 4, Math.max(4, p.w - 8), 8);
      ctx.strokeStyle = "#2e211d";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, p.w, p.h);
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(x + 6, y + 14, Math.max(4, p.w - 12), 3);
      return;
    }

    ctx.fillStyle = theme === "suburbs" ? "#5d634e" : theme === "market" ? "#66594d" : "#626868";
    ctx.fillRect(x, y, p.w, p.h);
    ctx.fillStyle = theme === "suburbs" ? "#9ba37f" : theme === "market" ? "#b5a28c" : "#a2a59a";
    ctx.fillRect(x, y, p.w, 18);
    ctx.strokeStyle = "#777b72";
    for (let tx = x; tx < x + p.w; tx += CONFIG.tile) {
      ctx.strokeRect(tx, y, CONFIG.tile, 18);
    }
    ctx.fillStyle = "#4b4035";
    ctx.fillRect(x, y + 18, p.w, p.h - 18);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let tx = x + 12; tx < x + p.w; tx += 64) ctx.fillRect(tx, y + 28, 30, 9);
  }

  renderCheckpoints(ctx) {
    for (const cp of this.level.checkpoints) {
      const x = Math.round(cp.x - this.camera.x);
      const y = Math.round(cp.y - this.camera.y);
      ctx.fillStyle = cp.active ? "#45d4ff" : "#f7d774";
      ctx.fillRect(x, y, 8, 74);
      ctx.fillStyle = cp.active ? "#9df3ff" : "#d94545";
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 4);
      ctx.lineTo(x + 54, y + 18);
      ctx.lineTo(x + 8, y + 34);
      ctx.closePath();
      ctx.fill();
    }
  }

  renderFinish(ctx) {
    if (this.level.bossFight) return;
    const f = this.level.finish;
    const x = Math.round(f.x - this.camera.x);
    const y = Math.round(f.y - this.camera.y);
    ctx.fillStyle = "#2d2d2d";
    ctx.fillRect(x, y, 10, f.h);
    ctx.fillStyle = "#f7d774";
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 8);
    ctx.lineTo(x + 74, y + 28);
    ctx.lineTo(x + 10, y + 50);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#251900";
    ctx.font = canvasFont(800, 10);
    ctx.fillText("META", x + 21, y + 33);
  }

  renderFloatingTexts(ctx) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = canvasFont(800, 11);
    for (const text of this.floatingTexts) {
      const x = Math.round(text.x - this.camera.x);
      const y = Math.round(text.y - this.camera.y);
      ctx.globalAlpha = clamp(text.life, 0, 1);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText(text.text, x + 1, y + 1);
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, x, y);
    }
    ctx.restore();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      this.moveTo(x + radius, y);
      this.arcTo(x + w, y, x + w, y + h, radius);
      this.arcTo(x + w, y + h, x, y + h, radius);
      this.arcTo(x, y + h, x, y, radius);
      this.arcTo(x, y, x + w, y, radius);
      return this;
    };
  }
  new GameManager();
});
