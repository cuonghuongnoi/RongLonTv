const { EmbedBuilder } = require("discord.js");

function createErrorEmbed(message) {
  return new EmbedBuilder().setColor(0xff4d4d).setDescription(`❌ ${message}`);
}

function formatStats(lines) {
  return `\`\`\`\n${lines.join("\n")}\n\`\`\``;
}

/**
 * Create a loading embed
 * @param {string} message - Loading message
 * @returns {EmbedBuilder}
 */
function createLoadingEmbed(message = "Đang tải dữ liệu...") {
  return new EmbedBuilder()
    .setColor(0x3498db)
    .setDescription(`⏳ ${message}`);
}

/**
 * Create a success embed
 * @param {string} message - Success message
 * @returns {EmbedBuilder}
 */
function createSuccessEmbed(message) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setDescription(`✅ ${message}`);
}

/**
 * Create a cooldown message embed
 * @param {string} commandName - Command name
 * @param {number} remainingSeconds - Remaining seconds
 * @returns {EmbedBuilder}
 */
function createCooldownEmbed(commandName, remainingSeconds) {
  return new EmbedBuilder()
    .setColor(0xf39c12)
    .setDescription(`⏱️ Lệnh \`${commandName}\` đang trên cooldown.\nVui lòng thử lại sau **${remainingSeconds}** giây.`);
}

/**
 * Create a server unavailable embed
 * @param {string} server - Server name
 * @returns {EmbedBuilder}
 */
function createServerUnavailableEmbed(server) {
  return new EmbedBuilder()
    .setColor(0xff6b6b)
    .setTitle("⚠️ Server không khả dụng")
    .setDescription(`Server **${server}** không hỗ trợ API này.\nVui lòng thử server khác.`);
}

async function deferInteraction(interaction) {
  if (!interaction.deferred && !interaction.replied) {
    try {
      if (interaction.isButton?.()) {
        await interaction.deferUpdate();
      } else {
        await interaction.deferReply();
      }
      return true;
    } catch (error) {
      if (error.code === 10062 || error.code === 40060) return false;
      throw error;
    }
  }
  return true;
}

async function replyInteraction(interaction, payload) {
  try {
    if (interaction.deferred) return await interaction.editReply(payload);
    if (interaction.replied) return await interaction.followUp(payload);
    return await interaction.reply(payload);
  } catch (error) {
    if (error.code === 10062 || error.code === 40060) return null;
    throw error;
  }
}

module.exports = {
  createErrorEmbed,
  formatStats,
  createLoadingEmbed,
  createSuccessEmbed,
  createCooldownEmbed,
  createServerUnavailableEmbed,
  deferInteraction,
  replyInteraction,
};
