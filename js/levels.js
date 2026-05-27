import { CAMPAIGN_LEVELS, FUTURE_TEST_FIGHT_LEVEL } from "./config.js";

export { CAMPAIGN_LEVELS, FUTURE_TEST_FIGHT_LEVEL };

export function getCampaignLevel(index) {
  return CAMPAIGN_LEVELS[index] || CAMPAIGN_LEVELS[CAMPAIGN_LEVELS.length - 1];
}

export function getCampaignLevelForNumber(levelNumber) {
  return CAMPAIGN_LEVELS[Math.min(levelNumber - 1, CAMPAIGN_LEVELS.length - 1)];
}

export function getNextCampaignLevelIndex(index) {
  return Math.min(index + 1, CAMPAIGN_LEVELS.length - 1);
}

export function hasNextCampaignLevel(index) {
  return index < CAMPAIGN_LEVELS.length - 1;
}
