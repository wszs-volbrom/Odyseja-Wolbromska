"use strict";

// Compatibility shim for older pages that still include the root game.js file.
// The actual Game class now lives in js/game-core.js, with a classic runtime
// copy in js/game-core.runtime.js for file:// preview without module CORS.
document.write('<script src="js/game-core.runtime.js?v=1"><\\/script>');
