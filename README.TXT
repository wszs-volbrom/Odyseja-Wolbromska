ODYSEJA WOLBROMSKA
Early Prototype README

OVERVIEW
Odyseja Wolbromska is an early playable 2D side-scrolling platformer prototype built around absurd local satire, Polish small-town scenery, procedural levels, collectibles, enemies, checkpoints, and a calorie-based survival meter.

The player controls Kłoda through a sequence of generated platforming stages inspired by classic side-scrolling platformers. The game uses original/placeholder visuals, custom player sprites, local collectible PNG assets, enemy placeholders, and HTML5 Canvas rendering.

This is a development preview. Mechanics, balance, level generation, animations, enemy AI, visuals, and audio are expected to change.


HOW TO RUN
Open index.html in a modern desktop browser.

No server is required.
No external JavaScript framework is required.
Mobile and touch devices are supported through optional on-screen controls.


PROJECT STRUCTURE
index.html
Main HTML entry point. Contains the canvas, disclaimer, menu overlays, controls guide, pause screen, and result screens.

style.css
Styles for the game shell, overlay panels, menu buttons, disclaimer, controls guide, and responsive layout.

game.js
Main game code. Contains the game loop, player controller, procedural level generation, collision system, enemies, collectibles, UI rendering, save system, camera, audio manager, and gameplay state handling.

assets/player/
Source player animation PNG files.

assets/player/processed/
Processed player sprites used in-game.

assets/collectibles/
PNG assets for collectible food/calorie items.

assets/enemies/
Enemy sprite assets, currently including the flying Wolbrom mouse animation.

assets/buildings/
Level-specific building sprites for front shops and background houses. These are loaded per level and unloaded when no longer needed.

assets/foliage/
Background tree sprites used in parallax suburb layers.

assets/mobile-buttons/
PNG assets for touch controls and HUD life icons.

assets/audio/
Local music and sound effects used by the game.

assets/audio/music-bg/
Background music and looping tracks.

assets/audio/SFX-effects/
One-shot sound effects for jumps, enemies, collectibles, UI, and other gameplay events.


ENGINE / TECHNICAL NOTES
The game is built as a vanilla browser project using:
- HTML5 Canvas for rendering
- JavaScript classes for gameplay systems
- requestAnimationFrame for the main loop
- delta time based movement
- AABB collision checks
- localStorage for best time persistence
- HTMLAudioElement for music and sound effects

There are no external dependencies.


MAIN SYSTEMS
GameManager
Owns the main loop, state transitions, level loading, restart flow, completion flow, game over flow, and high-level gameplay coordination.

LevelAssetManager
Loads only the building sprites required by the current generated level, reports loading progress to the loading screen, and unloads inactive level assets.

PlayerController
Handles player movement, acceleration, sprinting, jumping, double jumping, damage, invulnerability, respawning, and sprite animation.

ProceduralLevelGenerator
Builds playable side-scrolling levels from generated platform segments, gaps, collectibles, enemies, checkpoints, sprint gaps, background scenery, and finish zones.

CollisionSystem
Handles AABB collision and platform resolution for player and ground-based enemies.

EnemyBase and Enemy Classes
Base enemy behavior plus several enemy AI types such as walkers, jumpers, chargers, flyers, and boss-style enemies.

CollectibleItem
Represents calorie pickups. Items restore calories, can trigger boosts, increase consumed kcal, and may grant extra lives through the reward system.

HungerSystem
Currently works as the calorie meter. Calories drain over time, drain faster while sprinting, and are spent by jumping/double jumping.

UIManager
Draws the top HUD and controls menu/disclaimer/pause/result overlays.

MobileControls
Maps multi-touch on-screen buttons to the same input flags used by keyboard controls. Supports holding movement, sprint, and jump at the same time.

AudioManager
Controls gameplay music, sound effects, and separate music/SFX volume settings.

CameraSystem
Follows the player through the side-scrolling level while staying inside level bounds.

SaveSystem
Stores best completion time in localStorage.


CURRENT GAMEPLAY FEATURES
- Side-scrolling platform movement
- Acceleration and friction
- Sprinting by Shift or double-tapping movement direction
- Jump and calorie-cost double jump
- Procedural stages with increasing difficulty
- Gaps and sprint-required jumps
- Checkpoints
- Collectible calorie items with PNG assets
- Extra life every 15,000 consumed kcal
- Enemy roster with varied behavior
- Flying mouse enemy sprite animation
- Boss placeholder encounter
- Music loop during levels
- Jump sound effect
- Pause, restart, level completion, and game over screens
- Disclaimer and first-start controls guide
- Per-level loading screen for level building assets
- Parallax suburb backdrops with houses and trees
- Optional on-screen touch controls with Auto / On / Off setting


KNOWN ISSUES
- Level generation balance is still experimental.
- Some generated sections may feel too easy, too sparse, or too chaotic.
- Enemy art is mostly placeholder except selected custom assets.
- Some enemy hitboxes may not perfectly match the visible sprite.
- Enemy AI is not fully developed and may appear buggish
- Audio volume and looping may need further tuning.
- Browser audio autoplay rules require the game to be started by user interaction.
- Touch controls are new and may need tuning on unusual mobile screen sizes.
- UI layout may need further polishing on very small screens.
- Sprite background cleanup is automatic and may need manual refinement for future PNG assets.
- No custom sound for drinkables (e.g. coca cola)


TODO
- Add final art for all enemies.
- Add more tilesets and environment props per world.
- Improve procedural level templates and difficulty curves.
- Add more boss attacks and boss phases.
- Add collectible spawn tuning per level type.
- Add better checkpoint visual feedback.
- Add more settings for control size, opacity, and handedness.
- Add optional debug overlay for hitboxes and generated segments.
- Improve death, respawn, and level transition animations.
- Add proper title screen art.
- Add end-of-preview screen.
- Some level building and foliage sprites still need additional variants.


ASSET NOTES
All game assets should be original, user-provided, placeholder, or otherwise cleared for use.


STATUS
Prototype / work in progress.
