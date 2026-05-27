ODYSEJA WOLBROMSKA
Developer README

STATUS
Early browser-game prototype / work in progress.

OVERVIEW
Odyseja Wolbromska is a playable 2D side-scrolling platformer prototype built with
HTML5 Canvas, vanilla JavaScript, HTML, and CSS. The game mixes procedural
platforming, small-town Polish scenery, calorie-based survival, collectibles,
enemy AI, player skins, audio, mobile controls, and experimental campaign flow.

The project intentionally avoids external JavaScript frameworks. Most gameplay
systems have been split out of the original single-file game into focused files
under js/.

HOW TO RUN
Open index.html in a modern browser.

The local file:// path uses classic runtime scripts:
  js/*.runtime.js

The ES module versions:
  js/*.js

exist for hosted/server usage and future tooling. Browsers usually block module
imports from file://, so index.html currently loads the runtime scripts to keep
the game playable by double-clicking index.html.

MAIN ENTRY POINTS
index.html
  The browser entry point. It loads the runtime scripts and contains the canvas
  shell, overlays, menus, and controls markup.

js/main.runtime.js
  Starts the local file:// version of the game.

js/main.js
  ES module entry point for hosted/server usage.

js/game-core.runtime.js
  Exposes the runtime GameManager on window.ODYSEJA_GAME.

js/game-core.js
  Exports the module Game class.

game.js
  Compatibility shim only. It exists for older pages that still include the old
  root game.js script. Do not add gameplay code there.

PROJECT DOCUMENTATION
See:
  docs/PROJECT_STRUCTURE.md

That file explains the refactored module layout, where to change common systems,
where assets are configured, and what to test after edits.

IMPORTANT DEVELOPMENT NOTE
Until a build step is added, module files and runtime files must stay in sync:

  js/config.js          <-> js/config.runtime.js
  js/player.js          <-> js/player.runtime.js
  js/game-core.js       <-> js/game-core.runtime.js
  etc.

If you update only the module file, index.html may still run old behavior because
it loads the runtime file. If you update only the runtime file, hosted module
usage may drift.

KNOWN ISSUES / TODO
- Procedural level balance is still experimental.
- Some enemies and bosses still use placeholders.
- Some hitboxes may not perfectly match visible sprites.
- Some level themes need more building and foliage variants.
- Mobile controls work, but small-screen layout should keep being tested.
- Audio is browser-policy dependent and starts after user interaction.
- The unlock token system is a gameplay gate, not real anti-cheat security.
- Future chapters, final bosses, and more worlds are planned.

ASSET NOTES
Keep asset paths stable. If an asset file is renamed or moved, update the
corresponding config entry. Do not rely on browser-side code for secure unlocks,
payments, or anti-cheat logic.
