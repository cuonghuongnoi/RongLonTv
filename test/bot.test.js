const test = require("node:test");
const assert = require("node:assert/strict");
const { parseRiotId } = require("../utils/riotId");
const RiotApi = require("../services/riotApi");
const notifications = require("../services/gameNotifications");
const { LIMITS, getRouteKey } = require("../utils/riotRateLimiter");

test("parses Riot ID with an explicit server tag", () => {
  assert.deepEqual(parseRiotId("Player Name#MIXII", "VN2"), {
    gameName: "Player Name",
    tagLine: "MIXII",
    server: "VN2",
  });
});

test("requires a full Riot ID for VN2", () => {
  assert.throws(() => parseRiotId("Player Name", "VN2"), /VN2/);
});

test("keeps the supplied tagline when a region is selected", () => {
  assert.deepEqual(parseRiotId("Player Name#VN2", "VN2"), {
    gameName: "Player Name",
    tagLine: "VN2",
    server: "VN2",
  });
});

test("handles zero-duration matches without Infinity", () => {
  const api = Object.create(RiotApi.prototype);
  assert.equal(api.getCSPerMin({ totalMinionsKilled: 100 }, 0), "N/A");
});

test("keeps notification channel configuration stable", () => {
  assert.deepEqual(Object.keys(notifications.CHANNELS), ["patch", "balance", "skins", "esports"]);
});

test("classifies Riot endpoints with the documented route limits", () => {
  assert.equal(getRouteKey("https://vn1.api.riotgames.com/riot/account/v1/accounts/by-riot-id/A/B"), "account");
  assert.equal(getRouteKey("https://vn1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/x"), "summoner");
  assert.equal(getRouteKey("https://americas.api.riotgames.com/lol/match/v5/matches/x"), "match");
  assert.equal(getRouteKey("https://vn2.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/puuid"), "spectator");
  assert.equal(getRouteKey("https://ddragon.leagueoflegends.com/api/versions.json"), null);
  assert.deepEqual(LIMITS.spectator, { max: 3000, windowMs: 10_000 });
});
