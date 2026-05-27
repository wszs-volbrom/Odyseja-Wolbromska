(function () {
  "use strict";

  const ODYSEJA_CONFIG = window.ODYSEJA_CONFIG;
  if (!ODYSEJA_CONFIG) {
    throw new Error("Level config failed to load. Make sure js/config.runtime.js is included before js/levels.runtime.js.");
  }

  const { CAMPAIGN_LEVELS, FUTURE_TEST_FIGHT_LEVEL } = ODYSEJA_CONFIG;

  function getCampaignLevel(index) {
    return CAMPAIGN_LEVELS[index] || CAMPAIGN_LEVELS[CAMPAIGN_LEVELS.length - 1];
  }

  function getCampaignLevelForNumber(levelNumber) {
    return CAMPAIGN_LEVELS[Math.min(levelNumber - 1, CAMPAIGN_LEVELS.length - 1)];
  }

  function getNextCampaignLevelIndex(index) {
    return Math.min(index + 1, CAMPAIGN_LEVELS.length - 1);
  }

  function hasNextCampaignLevel(index) {
    return index < CAMPAIGN_LEVELS.length - 1;
  }

  window.ODYSEJA_LEVELS = Object.freeze({
    CAMPAIGN_LEVELS,
    FUTURE_TEST_FIGHT_LEVEL,
    getCampaignLevel,
    getCampaignLevelForNumber,
    getNextCampaignLevelIndex,
    hasNextCampaignLevel,
  });
})();
