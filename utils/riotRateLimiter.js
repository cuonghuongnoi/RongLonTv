const LIMITS = {
  account: { max: 1000, windowMs: 60_000 },
  summoner: { max: 1600, windowMs: 60_000 },
  league: { max: 20_000, windowMs: 10_000 },
  match: { max: 2000, windowMs: 10_000 },
  spectator: { max: 3000, windowMs: 10_000 },
};

const requestTimes = new Map();

function getRouteKey(url) {
  const parsed = new URL(url);
  if (!parsed.hostname.endsWith("api.riotgames.com")) return null;

  const path = parsed.pathname;
  if (path.startsWith("/riot/account/v1/")) return "account";
  if (path.startsWith("/lol/summoner/v4/")) return "summoner";
  if (path.startsWith("/lol/league/v4/")) return "league";
  if (path.startsWith("/lol/match/v5/")) return "match";
  if (path.startsWith("/lol/spectator/v5/")) return "spectator";
  return null;
}

function prune(times, now, windowMs) {
  const firstValid = times.findIndex((timestamp) => now - timestamp < windowMs);
  if (firstValid > 0) times.splice(0, firstValid);
  if (firstValid === -1) times.length = 0;
}

async function acquire(url) {
  const routeKey = getRouteKey(url);
  if (!routeKey) return;

  const limit = LIMITS[routeKey];
  let times = requestTimes.get(routeKey);
  if (!times) {
    times = [];
    requestTimes.set(routeKey, times);
  }

  while (true) {
    const now = Date.now();
    prune(times, now, limit.windowMs);
    if (times.length < limit.max) {
      times.push(now);
      return;
    }

    const waitMs = Math.max(1, limit.windowMs - (now - times[0]) + 1);
    await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 60_000)));
  }
}

function clear() {
  requestTimes.clear();
}

module.exports = { LIMITS, getRouteKey, acquire, clear };
