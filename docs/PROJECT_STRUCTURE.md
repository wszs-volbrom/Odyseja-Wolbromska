# Odyseja Wolbromska Project Structure

## 1. Overview

Odyseja Wolbromska is a vanilla browser 2D platformer prototype. It uses HTML5 Canvas for rendering, JavaScript classes for game systems, CSS/HTML overlays for menus and mobile controls, localStorage for saves, and local image/audio assets for sprites, backgrounds, collectibles, and sounds.

The project was refactored from a single large `game.js` file into smaller files under `js/`. The codebase currently has two parallel script formats:

- `js/*.js`: ES module files for hosted/server usage and future tooling.
- `js/*.runtime.js`: classic browser scripts loaded by `index.html` so the game still works when opened directly from `file://`.

The current local startup flow is:

1. `index.html` loads all `js/*.runtime.js` files in dependency order.
2. `js/game-core.runtime.js` exposes `GameManager` through `window.ODYSEJA_GAME`.
3. `js/main.runtime.js` creates and starts the game.

The module startup flow is:

1. `js/main.js` imports `Game` from `js/game-core.js`.
2. `js/main.js` creates and starts the game.

Important: browsers usually block ES module imports from `file://`, so `index.html` currently uses the runtime scripts for local double-click play.

## 2. File Structure

### Root Files

#### `index.html`
Responsible for the browser shell: canvas, overlay panels, disclaimer, menu, shop panel, controls guide, pause/result screens, mobile controls, and runtime script loading.

Put here: static HTML structure and script tags.

Do not put here: gameplay logic, procedural generation, player physics, or asset tables.

#### `style.css`
Responsible for page layout, overlay styling, menu/shop styling, mobile controls layout, responsive behavior, and custom font usage.

Put here: CSS for the page, panels, buttons, HUD DOM elements, and mobile overlays.

Do not put here: Canvas drawing rules or gameplay values.

#### `game.js`
Compatibility shim for older HTML that may still load the old root script.

Put here: only backward-compatibility loading glue.

Do not put here: new gameplay code.

### JavaScript Modules

Each ES module has a matching `.runtime.js` file. Until a build step exists, keep both versions in sync.

#### `js/config.js` / `js/config.runtime.js`
Responsible for pure constants and static data:

- `CONFIG`
- `GAME_FONT`
- `CAMPAIGN_LEVELS`
- `FUTURE_TEST_FIGHT_LEVEL`
- `THEME_PALETTES`
- `DEFAULT_SKIN_ID`
- `INITIAL_SKIN_WALLET`
- `PLAYER_SKINS`
- `PLAYER_ANIMATION_FPS`
- `COLLECTIBLE_TYPES`
- `AUDIO_ASSETS`
- `BUILDING_ASSETS`
- `PLATFORM_ASSETS`
- `UI_ASSETS`
- `ENEMY_SPRITES`

Put here: static tuning values, asset paths, level definitions, skin definitions, collectible definitions, theme palettes, and audio path definitions.

Do not put here: classes, DOM code, runtime state, update loops, or Canvas drawing functions.

#### `js/utils.js` / `js/utils.runtime.js`
Responsible for small general helpers such as:

- `clamp`
- `lerp`
- `rectsOverlap`
- `formatTime`
- `canvasFont`
- `drawNameTag`
- `makeEdgeTransparentCanvas`
- `detectTouchDevice`

Put here: stateless utility functions used by multiple systems.

Do not put here: game state, event listeners, level generation, or gameplay rules.

#### `js/save.js` / `js/save.runtime.js`
Responsible for `SaveSystem`, localStorage reads/writes, best times, skin wallet, owned skins, and selected skin persistence.

Put here: save/load helpers and localStorage key handling.

Do not put here: UI rendering, player movement, collectible behavior, or campaign generation.

#### `js/unlocks.js` / `js/unlocks.runtime.js`
Responsible for future unlock/progress tokens:

- `createUnlockToken(progressData)`
- `verifyUnlockToken(token)`
- `savePart2Unlock(progressData)`
- `hasPart2Unlock()`

Put here: isolated future progress gate logic.

Do not put here: real anti-cheat assumptions, campaign flow rewrites, or gameplay blocking unless a future feature explicitly uses it.

#### `js/input.js` / `js/input.runtime.js`
Responsible for `InputManager`: keyboard input, virtual/mobile button state, double-tap sprint detection, and input flags shared by gameplay.

Put here: input event handling and action state mapping.

Do not put here: physics, player acceleration formulas, collision, or rendering.

#### `js/systems.js` / `js/systems.runtime.js`
Responsible for shared gameplay systems:

- `SpeedrunTimer`
- `HungerSystem`
- `CameraSystem`
- `CollisionSystem`

Put here: timer logic, calorie drain/spending, camera bounds/follow behavior, and AABB collision helpers.

Do not put here: player sprite selection, enemy AI classes, level generation, or UI menus.

#### `js/assets.js` / `js/assets.runtime.js`
Responsible for image loading and loaded image maps:

- `COLLECTIBLE_IMAGES`
- `ENEMY_IMAGES`
- `UI_IMAGES`
- `SpriteLoader`
- `LevelAssetManager`
- `loadCollectibleImages`
- `loadEnemyImages`
- `loadUiImages`

Put here: image loading, sprite loader behavior, per-level asset loading/unloading, and transparency cleanup calls.

Do not put here: asset path definitions. Those belong in `config.js`.

#### `js/player.js` / `js/player.runtime.js`
Responsible for `PlayerController`: movement, acceleration, sprinting, jump, double jump, calorie spending, damage, invulnerability, checkpoint respawn, Ozempic/small-player state, sprite animation, and player drawing.

Put here: player-specific behavior and rendering.

Do not put here: enemy classes, level generation, save keys, or shop UI.

#### `js/collectibles.js` / `js/collectibles.runtime.js`
Responsible for `CollectibleItem`: pickup collision, calorie rewards, consumed kcal, speed boost, wallet reward hooks, and collectible drawing.

Put here: behavior of collectible instances.

Do not put here: the list of collectible types or asset paths. Those belong in `COLLECTIBLE_TYPES`.

#### `js/enemies.js` / `js/enemies.runtime.js`
Responsible for enemy and projectile classes:

- `EnemyBase`
- `WalkerEnemy`
- `FastWalkerEnemy`
- `JumperEnemy`
- `TankEnemy`
- `FlyerEnemy`
- `ChargerEnemy`
- `BossFlyingTrackerEnemy`
- enemy projectile classes
- boss/test/chase enemy-related classes if present

Put here: enemy AI, enemy damage rules, enemy rendering, projectile behavior, and boss-like enemy behavior.

Do not put here: procedural placement rules or level definitions.

#### `js/audio.js` / `js/audio.runtime.js`
Responsible for audio playback, music/SFX categories, volume settings, looping music, and one-shot effects.

Put here: audio manager logic and playback rules.

Do not put here: asset path tables except imported `AUDIO_ASSETS`.

#### `js/skins.js` / `js/skins.runtime.js`
Responsible for skin helper exports and skin-related glue around `PLAYER_SKINS`.

Put here: small skin helper functions if needed.

Do not put here: shop UI or save-key migration logic.

#### `js/shop.js` / `js/shop.runtime.js`
Responsible for shop UI and skin purchasing/selection behavior.

Put here: skin shop rendering, wallet display, buy/select button behavior, and calls into `SaveSystem`.

Do not put here: player physics, skin asset path definitions, or localStorage key definitions.

#### `js/levels.js` / `js/levels.runtime.js`
Responsible for campaign/static level lookup and level selection helpers.

Put here: helper functions around `CAMPAIGN_LEVELS` and future/test level lookup.

Do not put here: procedural generation internals or rendering code.

#### `js/procedural.js` / `js/procedural.runtime.js`
Responsible for procedural generation:

- platform layout generation
- gap placement
- obstacle placement
- collectible placement
- enemy placement
- checkpoint and finish placement
- generated background/building scenery placement
- boss/chase arena generation when it is part of level layout

Put here: level-generation algorithms and placement rules.

Do not put here: core constants that should be in config, input handling, or Canvas rendering helpers that can live in `rendering.js`.

#### `js/rendering.js` / `js/rendering.runtime.js`
Responsible for reusable drawing helpers:

- background rendering
- parallax visual helpers
- platform drawing helpers
- HUD/UI drawing helpers where safe
- visual helpers that do not own gameplay state

Put here: Canvas drawing utilities and visual helper functions.

Do not put here: game state transitions, player/enemy AI, input handling, or procedural placement decisions.

#### `js/game-core.js` / `js/game-core.runtime.js`
Responsible for the main `GameManager`/`Game` orchestration: game state, startup, screen flow, level loading, main update/render loop, menus, pause, game over, completion, restart, shop/settings wiring, and cross-system coordination.

Put here: high-level game orchestration.

Do not put here: large static config tables, low-level utility functions, or class definitions already split into their own modules.

#### `js/main.js` / `js/main.runtime.js`
Responsible for startup only.

Put here: minimal bootstrapping that creates and starts the game.

Do not put here: gameplay systems or rendering logic.

## 3. Common Changes Guide

When editing gameplay values, remember to update both module and runtime files unless a build step is added.

### Player speed
Change player movement values in `CONFIG` inside `js/config.js` and `js/config.runtime.js`. If the behavior itself changes, update `PlayerController` in `js/player.js` and `js/player.runtime.js`.

### Jump force
Change jump force values in `CONFIG`. Player jump behavior lives in `PlayerController`.

### Hunger/calorie drain
Change calorie drain values in `CONFIG` or `HungerSystem`, depending on whether you are tuning values or changing the drain algorithm.

### Double jump cost
Change the double jump calorie cost in `CONFIG`. The spending behavior is handled by `PlayerController` and `HungerSystem`.

### Campaign levels
Change `CAMPAIGN_LEVELS` in `js/config.js` and `js/config.runtime.js`. Level lookup helpers live in `js/levels.js`.

### Level difficulty
Change level difficulty fields in `CAMPAIGN_LEVELS`. Difficulty interpretation and placement effects live in `js/procedural.js`.

### Level length
Change level length fields in `CAMPAIGN_LEVELS`. The procedural generator uses those values when building layouts.

### Background themes
Change theme definitions in `THEME_PALETTES` and related background asset entries in `BUILDING_ASSETS`. Rendering helpers live in `js/rendering.js`; placement lives in `js/procedural.js`.

### Music per level
Define music files in `AUDIO_ASSETS`. Assign per-level music through level config if the current level object supports it, then confirm playback rules in `js/audio.js` and level startup in `js/game-core.js`.

### Collectible types
Change `COLLECTIBLE_TYPES` in `config.js`. Individual collectible behavior lives in `js/collectibles.js`.

### Enemy types
Add or change enemy classes in `js/enemies.js`. Add spawn rules or weighting in `js/procedural.js`. Add sprite paths in `ENEMY_SPRITES`.

### Platform assets
Configure platform chunks/endings in `PLATFORM_ASSETS`. Generation decisions live in `js/procedural.js`; drawing helpers live in `js/rendering.js`.

### Building/background assets
Configure building, house, tree, sky, moon, sun, cloud, and background props in `BUILDING_ASSETS` and theme-related config. Placement lives in `js/procedural.js`.

### Player skins
Configure skins in `PLAYER_SKINS`. Skin helper exports live in `js/skins.js`, purchasing lives in `js/shop.js`, and selected skin loading is saved through `SaveSystem`.

### Skin prices
Change the price field in `PLAYER_SKINS`.

### Shop logic
Change shop UI and buy/select behavior in `js/shop.js`. Do not change save keys there.

### Save/localStorage keys
Change only in `js/save.js` and `js/save.runtime.js`. If a key changes, write a migration so existing saves do not break.

### Unlock/progress logic
Use `js/unlocks.js`. Current unlock tokens are only a future gameplay gate.

## 4. Asset Guide

Asset paths are configured in `js/config.js` and `js/config.runtime.js`.

### Player sprites
Configured in `PLAYER_SKINS`. Each skin should define static, walk, jump, and fall sprites as needed by the player animation loader.

### Collectibles
Configured in `COLLECTIBLE_TYPES`. Each collectible can define display text, calorie value, color, spawn weight, speed boost duration, and image path.

### Enemies
Configured through `ENEMY_SPRITES` for image assets and `js/enemies.js` for behavior.

### Buildings
Configured in `BUILDING_ASSETS`. These include front shops, background buildings, houses, trees, city blocks, and theme-specific scenery.

### Sky assets
Configured with the background/building/theme assets, including moon, sun, clouds, and sky props.

### Platform chunks
Configured in `PLATFORM_ASSETS`. Chunks should match the expected platform style and dimensions.

### Platform endings
Configured in `PLATFORM_ASSETS`. Endings may be mirrored if only one side exists, but future custom endings can be added explicitly.

### Audio, music, and SFX
Configured in `AUDIO_ASSETS`. Keep music and SFX categorized clearly so volume controls can target them separately.

## 5. Adding New Content

The examples below show the intended locations. Keep runtime files in sync.

### Adding a new player skin

Add a skin entry in `PLAYER_SKINS`:

```js
{
  id: "new_skin_id",
  name: "New Skin",
  price: 2500,
  sprites: {
    idle: "assets/player-new/static.png",
    walk: [
      "assets/player-new/walk1.png",
      "assets/player-new/walk2.png"
    ],
    jump: "assets/player-new/jump.png",
    fall: "assets/player-new/fall.png"
  }
}
```

Then test the shop, purchase flow, selected skin persistence, and in-game animation.

### Adding a new collectible

Add a collectible entry in `COLLECTIBLE_TYPES`:

```js
{
  name: "New Snack",
  short: "Snack",
  hunger: 300,
  color: "#ffd166",
  weight: 12,
  speedBoost: 0,
  image: "assets/collectibles/new-snack.png"
}
```

Then test spawn, pickup, kcal gain, consumed kcal, and image rendering.

### Adding a new level

Add an entry to `CAMPAIGN_LEVELS`:

```js
{
  label: "2-5",
  worldName: "New Area",
  theme: "center",
  length: 6500,
  difficulty: 5,
  enemyDensity: 1.2,
  collectibleDensity: 0.75
}
```

Then check level order, level completion, restart, skip-level cheat, music, and generation fairness.

### Adding new platform chunks

Add paths under `PLATFORM_ASSETS`:

```js
platform1: {
  chunks: [
    "assets/platforms-generator/platforms/platform1chunk1.png",
    "assets/platforms-generator/platforms/platform1chunk-new.png"
  ],
  endings: [
    "assets/platforms-generator/platforms/platform1ending.png"
  ]
}
```

Then verify that chunks tile cleanly, match collision dimensions, and do not visually clash with background art.

### Adding new background buildings

Add a path to the correct `BUILDING_ASSETS` group:

```js
suburbs: {
  houses: [
    "assets/buildings/lvl1house1.png",
    "assets/buildings/lvl1house-new.png"
  ]
}
```

Then check scale, ground alignment, parallax grouping, and whether trees/buildings feel anchored together.

### Adding a new music track

Add the file in `AUDIO_ASSETS`:

```js
music: {
  defaultLoop: "assets/audio/music-bg/gameloop-music-main.mp3",
  newArea: "assets/audio/music-bg/new-area.mp3"
}
```

Then assign it to a level if supported and test volume settings, looping, and transition behavior.

## 6. Important Warnings

- Do not rename asset paths unless you update the matching config entry.
- Do not change localStorage keys unless you also migrate existing saves.
- Procedural generation depends on platform chunks/endings matching the expected size, collision shape, and visual style.
- Browser JavaScript is client-side. Unlock tokens are useful as gameplay/progress gates, but they are not real anti-cheat security.
- Keep `.js` and `.runtime.js` files in sync until a build process replaces the manual runtime copies.
- Do not put new gameplay logic into root `game.js`; it is only a compatibility shim.

## 7. Testing Checklist

After gameplay, asset, or refactor changes, manually test:

- Open `index.html` directly from disk and confirm the game loads.
- Confirm the browser console has no startup errors.
- Start a new game from the menu.
- Move left/right with keyboard.
- Jump, double jump, sprint, and double-tap sprint.
- Pause and resume, including mobile pause buttons.
- Restart the current level.
- Toggle fullscreen and confirm desktop/mobile layout remains usable.
- Test mobile controls in Auto, On, and Off modes.
- Collect several collectible types and verify kcal gain, consumed kcal, sounds, and images.
- Trigger low-kcal warning behavior.
- Take enemy damage, stomp enemies, and test enemy projectiles.
- Test Fit Influencerka/Ozempic behavior if that enemy appears.
- Fall into a gap and confirm respawn/checkpoint behavior.
- Finish a normal level and confirm transition to the next level.
- Test the 2-4 chase level if campaign flow reaches it.
- Test game over flow.
- Open the shop, buy/select skins, reload the page, and confirm selected skin persists.
- Test music and SFX volume controls.
- Test best time saving.
- If changing hosted/module startup, also test from a local server instead of file://.
