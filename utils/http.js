const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const riotRateLimiter = require("./riotRateLimiter");

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRIES = 2;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function request(url, options = {}, config = {}) {
  const timeoutMs = config.timeoutMs || DEFAULT_TIMEOUT_MS;
  const retries = config.retries ?? DEFAULT_RETRIES;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    await riotRateLimiter.acquire(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === retries) return response;

      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 500 * (attempt + 1);
      await wait(Math.min(delay, 5000));
    } catch (error) {
      clearTimeout(timeout);
      if (attempt === retries) {
        throw new Error(error.name === "AbortError" ? `Request timeout sau ${timeoutMs}ms.` : `Không thể kết nối dịch vụ: ${error.message}`);
      }
      await wait(500 * (attempt + 1));
    }
  }

  throw new Error("Request thất bại sau nhiều lần thử.");
}

module.exports = { request };
