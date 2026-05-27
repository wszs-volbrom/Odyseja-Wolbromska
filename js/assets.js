import {
  PLAYER_SKINS,
  DEFAULT_SKIN_ID,
  PLAYER_ANIMATION_FPS,
  COLLECTIBLE_TYPES,
  ENEMY_SPRITES,
  UI_ASSETS,
} from "./config.js";
import { makeEdgeTransparentCanvas } from "./utils.js";

export const COLLECTIBLE_IMAGES = new Map();

export const ENEMY_IMAGES = new Map();

export const UI_IMAGES = new Map();

















export class SpriteLoader {
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



export class LevelAssetManager {
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
        if (this.shouldUseEdgeCleanup(path)) {
          try {
            processed = makeEdgeTransparentCanvas(img);
          } catch {
            processed = img;
          }
        }
        this.images.set(path, processed);
        resolve(processed);
      };
      img.onerror = () => resolve(null);
      img.src = path;
    });
  }

  shouldUseEdgeCleanup(path) {
    return !String(path).includes("assets/sky/");
  }

  unloadInactive() {
    for (const path of this.images.keys()) {
      if (!this.activePaths.has(path)) this.images.delete(path);
    }
  }
}

export function loadCollectibleImages() {
  for (const type of COLLECTIBLE_TYPES) {
    if (!type.image || COLLECTIBLE_IMAGES.has(type.name)) continue;
    const img = new Image();
    img.onload = () => {
      COLLECTIBLE_IMAGES.set(type.name, img);
    };
    img.src = type.image;
  }
}

export function loadEnemyImages() {
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

export function loadUiImages() {
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

