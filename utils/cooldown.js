/**
 * Command cooldown and rate limiting system
 * Prevents abuse and manages command execution frequency
 */
class CooldownManager {
  constructor() {
    this.cooldowns = new Map();
    this.globalCooldowns = new Map();
  }

  /**
   * Check and set cooldown for a user
   * @param {string} userId - Discord user ID
   * @param {string} commandName - Command name
   * @param {number} cooldownMs - Cooldown duration in milliseconds
   * @returns {object} - { isOnCooldown: boolean, remainingMs: number }
   */
  checkCooldown(userId, commandName, cooldownMs = 3000) {
    const key = `${userId}:${commandName}`;

    if (this.cooldowns.has(key)) {
      const expirationTime = this.cooldowns.get(key);
      const now = Date.now();
      const remainingMs = expirationTime - now;

      if (remainingMs > 0) {
        return {
          isOnCooldown: true,
          remainingMs,
          remainingSeconds: Math.ceil(remainingMs / 1000),
        };
      }

      // Cooldown expired
      this.cooldowns.delete(key);
    }

    // Set new cooldown
    this.cooldowns.set(key, Date.now() + cooldownMs);

    return {
      isOnCooldown: false,
      remainingMs: 0,
      remainingSeconds: 0,
    };
  }

  /**
   * Check global cooldown (across all users)
   * @param {string} commandName - Command name
   * @param {number} cooldownMs - Cooldown duration in milliseconds
   * @returns {object}
   */
  checkGlobalCooldown(commandName, cooldownMs = 5000) {
    if (this.globalCooldowns.has(commandName)) {
      const expirationTime = this.globalCooldowns.get(commandName);
      const now = Date.now();
      const remainingMs = expirationTime - now;

      if (remainingMs > 0) {
        return {
          isOnCooldown: true,
          remainingMs,
          remainingSeconds: Math.ceil(remainingMs / 1000),
        };
      }

      this.globalCooldowns.delete(commandName);
    }

    this.globalCooldowns.set(commandName, Date.now() + cooldownMs);

    return {
      isOnCooldown: false,
      remainingMs: 0,
      remainingSeconds: 0,
    };
  }

  /**
   * Clear cooldown for user command
   * @param {string} userId - Discord user ID
   * @param {string} commandName - Command name
   */
  clearCooldown(userId, commandName) {
    const key = `${userId}:${commandName}`;
    this.cooldowns.delete(key);
  }

  /**
   * Get all active cooldowns for a user
   * @param {string} userId - Discord user ID
   * @returns {array} - Array of { commandName: string, remainingSeconds: number }
   */
  getUserCooldowns(userId) {
    const userCooldowns = [];
    const now = Date.now();

    this.cooldowns.forEach((expirationTime, key) => {
      if (key.startsWith(userId)) {
        const remainingMs = expirationTime - now;
        if (remainingMs > 0) {
          const commandName = key.split(":")[1];
          userCooldowns.push({
            commandName,
            remainingSeconds: Math.ceil(remainingMs / 1000),
          });
        }
      }
    });

    return userCooldowns;
  }

  /**
   * Clear all cooldowns
   */
  clearAll() {
    this.cooldowns.clear();
    this.globalCooldowns.clear();
  }
}

module.exports = new CooldownManager();
