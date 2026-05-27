# Change Guide

This guide is for editing the game safely without needing to understand the whole codebase.

Important: the project currently has two JavaScript versions:

- `js/*.js` files are ES modules.
- `js/*.runtime.js` files are loaded by `index.html` when the game is opened directly from disk.

If you want the game to work after double-clicking `index.html`, update the matching `.runtime.js` file too. Example:

- edit `js/config.js`
- also edit `js/config.runtime.js`

Do not change gameplay code unless the change really needs it.

## I want to add a new level - where do I go?

File:

- `js/config.js`
- `js/config.runtime.js`

Look for:

- `CAMPAIGN_LEVELS`

What to edit:

Add a new level object to the campaign list. A level usually has a label, world name, theme, length, difficulty, enemy density, and collectible density.

Example:

```js
{
  label: "2-5",
  worldName: "NEW WOLBROM AREA",
  theme: "center",
  length: 7000,
  difficulty: 5,
  enemyDensity: 1.2,
  collectibleDensity: 0.7
}
```

What not to touch:

- Do not reorder existing levels unless you want campaign flow to change.
- Do not remove special flags from existing special levels.
- Do not edit procedural generation code just to add a normal level.

## I want to change difficulty - where do I go?

Files:

- `js/config.js`
- `js/config.runtime.js`
- sometimes `js/procedural.js`
- sometimes `js/procedural.runtime.js`

Look for:

- `CAMPAIGN_LEVELS`
- `difficulty`
- `enemyDensity`
- `collectibleDensity`
- level length fields

What to edit:

For simple balance, change numbers in the level config.

Example:

```js
{
  label: "1-2",
  difficulty: 2,
  enemyDensity: 0.75,
  collectibleDensity: 1.0
}
```

Higher enemy density means more enemies. Lower collectible density means fewer food pickups.

What not to touch:

- Do not change collision code to make a level harder.
- Do not change player physics just to tune one level.
- Do not make level 1-1 too hard; it should stay friendly.

## I want to add a new skin - where do I go?

Files:

- `js/config.js`
- `js/config.runtime.js`
- `js/shop.js`
- `js/shop.runtime.js`

Look for:

- `PLAYER_SKINS`
- `SkinShop`

What to edit:

Most skin work happens in `PLAYER_SKINS`. Add the skin name, price, and sprite paths.

Example:

```js
{
  id: "new_skin",
  name: "New Character",
  price: 5000,
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

Only edit `SkinShop` if you want to change how the shop screen behaves.

What not to touch:

- Do not change save keys in `SaveSystem` just to add a skin.
- Do not rename an existing skin `id` unless you also migrate saves.
- Do not place skin prices inside player movement code.

## I want to add a new platform tile - where do I go?

Files:

- `js/config.js`
- `js/config.runtime.js`
- sometimes `js/procedural.js`
- sometimes `js/procedural.runtime.js`
- sometimes `js/rendering.js`
- sometimes `js/rendering.runtime.js`

Look for:

- `PLATFORM_ASSETS`

What to edit:

Add the new image path to the correct platform set.

Example:

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

What not to touch:

- Do not change collision sizes unless the new tile size requires it.
- Do not mix platform art with very different heights unless the generator supports it.
- Do not delete fallback drawing unless every level has reliable tile assets.

## I want to add new background buildings - where do I go?

Files:

- `js/config.js`
- `js/config.runtime.js`
- `js/procedural.js`
- `js/procedural.runtime.js`
- `js/rendering.js`
- `js/rendering.runtime.js`

Look for:

- `BUILDING_ASSETS`
- background placement logic in `ProceduralLevelGenerator`
- background drawing helpers in `rendering`

What to edit:

Add the building path to the correct theme group.

Example:

```js
suburbs: {
  houses: [
    "assets/buildings/lvl1house1.png",
    "assets/buildings/lvl1house-new.png"
  ],
  shops: [
    "assets/buildings/piekarnia.png",
    "assets/buildings/new-shop.png"
  ]
}
```

What not to touch:

- Do not place front buildings inside gaps.
- Do not place big buildings directly in front of the finish flag.
- Do not make trees move separately from the buildings if they should feel anchored.

## I want to add music to a level - where do I go?

Files:

- `js/config.js`
- `js/config.runtime.js`
- `js/audio.js`
- `js/audio.runtime.js`
- sometimes `js/game-core.js`
- sometimes `js/game-core.runtime.js`

Look for:

- `AUDIO_ASSETS`
- `AudioManager`
- the level music selection code

What to edit:

Add the music file path to `AUDIO_ASSETS`, then assign it to a level if the level config supports a music field.

Example:

```js
music: {
  defaultLoop: "assets/audio/music-bg/gameloop-music-main.mp3",
  nightLevel: "assets/audio/music-bg/Lonely_Journey.mp3"
}
```

Possible level example:

```js
{
  label: "1-2",
  music: "nightLevel"
}
```

What not to touch:

- Do not put audio paths directly inside random gameplay code.
- Do not remove browser user-interaction checks for audio.
- Do not mix music and SFX categories if volume sliders should stay separate.

## I want to change hunger/sprint/jump values - where do I go?

Files:

- `js/config.js`
- `js/config.runtime.js`
- `js/player.js`
- `js/player.runtime.js`
- `js/systems.js`
- `js/systems.runtime.js`

Look for:

- `CONFIG`
- `PlayerController`
- `HungerSystem`

What to edit:

For normal tuning, change values in `CONFIG`.

Example:

```js
player: {
  speed: 220,
  sprintSpeed: 340,
  jumpForce: 520,
  doubleJumpCost: 500
}
```

For calorie drain tuning, check `HungerSystem`.

Example:

```js
hunger: {
  normalDrain: 2,
  sprintDrainMultiplier: 2
}
```

What not to touch:

- Do not edit collision code to change jump height.
- Do not edit collectible code to change normal calorie drain.
- Do not change player hitbox unless you are also testing every platform and enemy.

## I want to add a new enemy - where do I go?

Files:

- `js/enemies.js`
- `js/enemies.runtime.js`
- `js/procedural.js`
- `js/procedural.runtime.js`
- `js/config.js`
- `js/config.runtime.js`

Look for:

- `EnemyBase`
- existing enemy classes like `WalkerEnemy`, `FlyerEnemy`, `ChargerEnemy`
- `ENEMY_SPRITES`
- enemy placement rules in `ProceduralLevelGenerator`

What to edit:

Create a new enemy class in `enemies`, add sprite paths in `ENEMY_SPRITES`, then add spawn rules in `procedural`.

Example:

```js
class NewEnemy extends EnemyBase {
  constructor(x, y) {
    super(x, y, {
      name: "New Enemy",
      hp: 2,
      damage: 1,
      w: 42,
      h: 42,
      vx: 80,
      color: "#ff6688"
    });
  }

  update(dt, level, player) {
    super.update(dt, level, player);
    // Add simple AI here.
  }
}
```

What not to touch:

- Do not put enemy AI inside `GameManager`.
- Do not hardcode new enemy paths inside rendering code.
- Do not spawn enemies directly on the player start position.

## I want to add part 2 / continuation - where do I go?

Files:

- `js/config.js`
- `js/config.runtime.js`
- `js/levels.js`
- `js/levels.runtime.js`
- `js/unlocks.js`
- `js/unlocks.runtime.js`
- `js/game-core.js`
- `js/game-core.runtime.js`

Look for:

- `CAMPAIGN_LEVELS`
- `createUnlockToken`
- `verifyUnlockToken`
- `savePart2Unlock`
- `hasPart2Unlock`
- campaign completion flow in `GameManager`

What to edit:

Add new part 2 levels to config, then use the unlock helpers when the game is ready to gate the continuation.

Example:

```js
await savePart2Unlock({
  completedLevels: ["1-1", "1-2", "1-3", "2-1", "2-2", "2-3", "2-4"],
  consumedKcal: 50000,
  timestamp: Date.now()
});
```

Then later:

```js
const canPlayPart2 = await hasPart2Unlock();
```

What not to touch:

- Do not treat unlock tokens as real security. Browser JavaScript is visible to players.
- Do not break existing saves when adding new campaign progress.
- Do not block the current preview campaign unless the new part 2 flow is fully tested.

## Safe Editing Checklist

Before changing anything:

- Find the config value first.
- Check whether the matching `.runtime.js` file also needs the same edit.
- Make one small change at a time.

After changing anything:

- Open `index.html`.
- Check the browser console.
- Start the game.
- Test the edited feature.
- Restart the level.
- Change level if the edit affects campaign flow.
- Reload the page and check saves if the edit touches shop, skins, best time, or unlocks.
