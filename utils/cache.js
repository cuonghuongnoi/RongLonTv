/**
 * Simple cache system with TTL (Time To Live)
 * Reduces API calls and improves performance
 */
class Cache {
  constructor() {
    this.data = new Map();
    this.ttl = new Map();
  }

  /**
   * Set a value in cache with TTL in milliseconds
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlMs - Time to live in milliseconds (default: 1 hour)
   */
  set(key, value, ttlMs = 3600000) {
    this.data.set(key, value);
    
    // Clear old timeout if exists
    if (this.ttl.has(key)) {
      clearTimeout(this.ttl.get(key));
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      this.data.delete(key);
      this.ttl.delete(key);
    }, ttlMs);

    this.ttl.set(key, timeoutId);
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    return this.data.get(key) || null;
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.data.has(key);
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.ttl.has(key)) {
      clearTimeout(this.ttl.get(key));
      this.ttl.delete(key);
    }
    this.data.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.ttl.forEach((timeoutId) => clearTimeout(timeoutId));
    this.data.clear();
    this.ttl.clear();
  }

  /**
   * Get cache statistics
   */
  stats() {
    return {
      size: this.data.size,
      keys: Array.from(this.data.keys()),
    };
  }
}

module.exports = new Cache();
