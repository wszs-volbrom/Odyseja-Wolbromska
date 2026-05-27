import { CONFIG, COLLECTIBLE_TYPES, BUILDING_ASSETS } from "./config.js";
import { clamp } from "./utils.js";
import { getCampaignLevelForNumber } from "./levels.js";
import { CollectibleItem } from "./collectibles.js";
import {
  WalkerEnemy,
  FastWalkerEnemy,
  JumperEnemy,
  TankEnemy,
  FlyerEnemy,
  ChargerEnemy,
  BossFlyingTrackerEnemy,
  TestArenaBossEnemy,
  TwinkChaseTarget,
} from "./enemies.js";
export class ProceduralLevelGenerator {
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
    const config = levelConfig || getCampaignLevelForNumber(levelNumber);
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

    const level = {
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

    return level;
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
      { x: 220, y: CONFIG.groundY - 188, w: 360, h: 54, type: "tutorial", text: "DOGOŃ TWINKA! >>>" }
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
    if (theme === "centerNight") {
      const moonPath = this.pickAsset(BUILDING_ASSETS.centerNight.moon);
      backdrops.push({
        x: 520,
        y: 88,
        w: 128,
        h: 128,
        type: "night-moon",
        assetPath: moonPath,
        parallax: 0.015,
        alpha: 0.92
      });

      for (let x = -280; x < length + 760; x += this.rand(520, 850)) {
        const cloudH = this.rand(42, 76);
        const cloudW = cloudH * this.rand(2.2, 3.4);
        backdrops.push({
          x: Math.round(x + this.rand(-80, 120)),
          y: Math.round(this.rand(64, 165)),
          w: Math.round(cloudW),
          h: Math.round(cloudH),
          type: "night-cloud",
          assetPath: this.pickAsset(BUILDING_ASSETS.centerNight.clouds),
          parallax: this.rand(0.08, 0.16),
          alpha: this.rand(0.42, 0.68),
          phase: this.rand(0, Math.PI * 2)
        });
      }

      for (let x = -220; x < length + 760; x += this.rand(390, 540)) {
        const flatH = this.rand(315, 440);
        const flatW = flatH * this.rand(0.62, 0.82);
        const baseX = Math.round(x + this.rand(-46, 46));
        const parallax = this.rand(0.2, 0.3);
        if (this.random() < 0.5) {
          const treeH = this.rand(118, 190);
          const treeW = treeH * this.rand(0.48, 0.72);
          backdrops.push({
            x: Math.round(baseX - treeW * this.rand(0.18, 0.5)),
            y: Math.round(CONFIG.groundY - 16 - treeH),
            w: Math.round(treeW),
            h: Math.round(treeH),
            type: "backdrop-tree",
            assetPath: this.pickAsset(BUILDING_ASSETS.foliage.trees),
            parallax,
            alpha: 0.48
          });
        }
        backdrops.push({
          x: baseX,
          y: Math.round(CONFIG.groundY - 22 - flatH),
          w: Math.round(flatW),
          h: Math.round(flatH),
          type: "night-flat",
          assetPath: this.pickAsset(BUILDING_ASSETS.centerNight.flats),
          parallax,
          alpha: this.rand(0.62, 0.82)
        });
        if (this.random() < 0.58) {
          const treeH = this.rand(130, 210);
          const treeW = treeH * this.rand(0.46, 0.7);
          backdrops.push({
            x: Math.round(baseX + flatW - treeW * this.rand(0.24, 0.62)),
            y: Math.round(CONFIG.groundY - 12 - treeH),
            w: Math.round(treeW),
            h: Math.round(treeH),
            type: "backdrop-tree",
            assetPath: this.pickAsset(BUILDING_ASSETS.foliage.trees),
            parallax,
            alpha: 0.58
          });
        }
      }
      return;
    }

    if (theme !== "suburbs") return;
    backdrops.push({
      x: 280,
      y: CONFIG.groundY - 286,
      w: 260,
      h: 150,
      type: "sunset-sun",
      assetPath: this.pickAsset(BUILDING_ASSETS.sky.sun),
      parallax: 0.06,
      alpha: 0.9
    });

    for (let x = -320; x < length + 780; x += this.rand(560, 880)) {
      const cloudH = this.rand(36, 68);
      const cloudW = cloudH * this.rand(2.25, 3.45);
      backdrops.push({
        x: Math.round(x + this.rand(-120, 160)),
        y: Math.round(this.rand(72, 178)),
        w: Math.round(cloudW),
        h: Math.round(cloudH),
        type: "sunset-cloud",
        assetPath: this.pickAsset(BUILDING_ASSETS.sky.clouds),
        parallax: this.rand(0.1, 0.18),
        alpha: this.rand(0.42, 0.64),
        phase: this.rand(0, Math.PI * 2)
      });
    }

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
    if ((theme === "center" || theme === "centerNight") && label.includes("ABKA")) return this.pickAsset(BUILDING_ASSETS.center.frogshopSmall);
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
