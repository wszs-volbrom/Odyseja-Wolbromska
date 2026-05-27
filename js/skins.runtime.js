(function () {
  "use strict";

  const ODYSEJA_CONFIG = window.ODYSEJA_CONFIG;
  if (!ODYSEJA_CONFIG) {
    throw new Error("Skin config failed to load. Make sure js/config.runtime.js is included before js/skins.runtime.js.");
  }

  const { DEFAULT_SKIN_ID, INITIAL_SKIN_WALLET, PLAYER_SKINS } = ODYSEJA_CONFIG;

  window.ODYSEJA_SKINS = Object.freeze({
    DEFAULT_SKIN_ID,
    INITIAL_SKIN_WALLET,
    PLAYER_SKINS,
  });
})();
