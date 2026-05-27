// Static game configuration extracted from game.js.
// Keep gameplay logic in game.js during the incremental refactor.

export const CONFIG = {
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

export const GAME_FONT = "\"VT323\", monospace";

export const CAMPAIGN_LEVELS = [
  { label: "1-1", world: "PRZEDMIEŚCIA WOLBROMIA", difficulty: 0.08, length: 9000, boss: false, theme: "suburbs" },
  { label: "1-2", world: "WOLBROM CENTRUM", difficulty: 0.2, length: 6400, boss: false, theme: "centerNight", music: "lonelyJourney" },
  { label: "1-3", world: "OSIEDLE WOLBROM", difficulty: 0.36, length: 7200, boss: false, theme: "blocks" },
  { label: "2-1", world: "RYNEK WOLBROM", difficulty: 0.52, length: 7600, boss: false, theme: "market" },
  { label: "2-2", world: "RYNEK WOLBROM", difficulty: 0.7, length: 8400, boss: false, theme: "market" },
  { label: "2-3", world: "RYNEK WOLBROM", difficulty: 0.9, length: 7000, boss: true, theme: "market" },
  { label: "2-4", world: "ZŁAP GEJA TWINKA", difficulty: 1, length: 999999, boss: false, twinkChase: true, theme: "center" }
];

// ## Test fight for future
// The old 2-4 TEST BOSS FIGHT prototype is intentionally preserved here for later reuse.
export const FUTURE_TEST_FIGHT_LEVEL = { label: "2-4", world: "TEST BOSS FIGHT", difficulty: 1, length: 1280, boss: true, bossFight: true, fixedCamera: true, theme: "bossfight" };

export const THEME_PALETTES = {
  suburbs: { skyTop: "#f1a46f", skyMid: "#d38b73", skyBottom: "#738e7d", far: "rgba(110, 81, 67, 0.38)", near: "rgba(80, 95, 72, 0.62)" },
  center: { skyTop: "#b4bdc8", skyMid: "#909aa8", skyBottom: "#6f7884", far: "rgba(90, 96, 105, 0.5)", near: "rgba(63, 68, 76, 0.7)" },
  centerNight: { skyTop: "#171d2d", skyMid: "#252f44", skyBottom: "#4d5c68", far: "rgba(29, 37, 52, 0.58)", near: "rgba(33, 43, 55, 0.72)" },
  blocks: { skyTop: "#a9b0ba", skyMid: "#858d98", skyBottom: "#646b75", far: "rgba(78, 84, 94, 0.58)", near: "rgba(48, 54, 63, 0.76)" },
  market: { skyTop: "#c2b9aa", skyMid: "#a99e8e", skyBottom: "#7d746b", far: "rgba(100, 82, 70, 0.5)", near: "rgba(70, 55, 49, 0.74)" },
  bossfight: { skyTop: "#3f304d", skyMid: "#28203a", skyBottom: "#171421", far: "rgba(255, 209, 102, 0.16)", near: "rgba(239, 71, 111, 0.28)" }
};

export const DEFAULT_SKIN_ID = "kloda-purple";

export const INITIAL_SKIN_WALLET = 50000;

export const PLAYER_SKINS = {
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
        "assets/player/skins/kloda-purple/static.png",
        "assets/player/skins/kloda-purple/walk3.png"
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

export const PLAYER_ANIMATION_FPS = {
  idle: 1,
  walk: 8,
  sprint: 13,
  jump: 1,
  fall: 1
};

export const COLLECTIBLE_TYPES = [
  { name: "Lays Chips", short: "Lays", hunger: 540, color: "#f6c44f", weight: 34, speedBoost: 0, image: "assets/collectibles/lays.png" },
  { name: "Lindor Pralines", short: "Lindor", hunger: 230, color: "#dc4b4b", weight: 10, speedBoost: 0, image: "assets/collectibles/lindor.png" },
  { name: "Delicje", short: "Delicje", hunger: 160, color: "#8b5cf6", weight: 20, speedBoost: 0, image: "assets/collectibles/delicje.png" },
  { name: "Zestaw McD Powiększony", short: "McD+", hunger: 850, color: "#e07a2f", weight: 7, speedBoost: 0, image: "assets/collectibles/mcd.png" },
  { name: "Energy Drink", short: "Coca Cola", hunger: 120, color: "#45d4ff", weight: 16, speedBoost: 5, image: "assets/collectibles/cola.png" },
  { name: "Kinder Bueno", short: "Kinder Bueno", hunger: 200, color: "#45d4ff", weight: 16, speedBoost: 5, image: "assets/collectibles/kinder.png" },
  { name: "Schoko Bons", short: "Szokobonsy", hunger: 420, color: "#45d4ff", weight: 16, speedBoost: 8, image: "assets/collectibles/schokobons.png" },
  { name: "Kubełek KFC", short: "KFC", hunger: 900, color: "#ff4fd8", weight: 3, speedBoost: 0, image: "assets/collectibles/kubelek.png" }
];

// Add new audio here: put background tracks in music-bg and one-shot effects in sfx-effects.
export const AUDIO_ASSETS = {
  musicBg: {
    levelLoop: "assets/audio/music-bg/gameloop-music-main.mp3",
    lonelyJourney: "assets/audio/music-bg/Lonely_Journey.mp3"
  },
  sfxEffects: {
    jump: "assets/audio/SFX-effects/kloda-jump.mp3",
    enemyHit: "assets/audio/SFX-effects/enemy-bt.mp3",
    enemyDefeated: "assets/audio/SFX-effects/enemy-defeated.mp3",
    collectible: "assets/audio/SFX-effects/pysznosci.mp3",
    hungerWarning: "assets/audio/SFX-effects/dajmijesc.mp3"
  }
};

export const BUILDING_ASSETS = {
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
  centerNight: {
    // ! IN PREVIEW ONLY ONE FLAT AVAILABLE, MAKE SURE TO ADD NEW ONES ASAP.
    flats: [
      "assets/buildings/center-night/flat01.png"
    ],
    moon: ["assets/sky/luna.png"],
    clouds: [
      "assets/sky/cld1.png",
      "assets/sky/cld2.png",
      "assets/sky/cld3.png",
      "assets/sky/cld4.png"
    ]
  },
  sky: {
    sun: ["assets/sky/noul.png"],
    clouds: [
      "assets/sky/cld1.png",
      "assets/sky/cld2.png",
      "assets/sky/cld3.png",
      "assets/sky/cld4.png"
    ]
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

export const PLATFORM_ASSETS = {
  platform1: {
    chunks: [
      "assets/platforms/platform1/platform1chunk1.png",
      "assets/platforms/platform1/platform1chunk2.png",
      "assets/platforms/platform1/platform1chunk3.png",
      "assets/platforms/platform1/platform1chunk4.png",
      "assets/platforms/platform1/platform1chunk5.png",
      "assets/platforms/platform1/platform1chunk6.png",
      "assets/platforms/platform1/platform1chunk7.png"
    ],
    // Add more platform1 ending PNGs here later; the renderer picks one and mirrors it for the right edge.
    endings: [
      "assets/platforms/platform1/platform1ending.png"
    ]
  }
};

export const UI_ASSETS = {
  live: "assets/mobile-buttons/live.png"
};

export const ENEMY_SPRITES = {
  volbromMouse: [
    "assets/enemies/volbrommice-flying-1.png",
    "assets/enemies/volbrommice-flying-2.png"
  ],
  fitInfluencerWalk: [
    "assets/enemies/fitinflu1.png",
    "assets/enemies/fitinflu2.png"
  ],
  fitInfluencerThrow: [
    "assets/enemies/fitinflu3.png",
    "assets/enemies/fitinflu4.png"
  ],
  ozempic: [
    "assets/enemies/ozempic.png"
  ]
};
