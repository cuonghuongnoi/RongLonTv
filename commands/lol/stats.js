const DataDragon = require("../../services/dataDragon");
const { EmbedBuilder } = require("discord.js");
const { createErrorEmbed, createCooldownEmbed, formatStats, deferInteraction, replyInteraction } = require("../../utils/embed");
const cooldownManager = require("../../utils/cooldown");

const COMMAND_NAME = "stats";
const COOLDOWN_MS = 2000;

// Sample statistics data - in production, this would come from an external API like Champion.gg
const STATS_DATA = {
  default: {
    pickRate: "7.2%",
    banRate: "4.8%",
    winRate: "51.6%",
    topRole: "Mid",
    avgKDA: "3.5",
    popularity: "Tier 2",
    patch: "14.2",
    roleStats: {
      "Mid Lane": { pickRate: "45.2%", winRate: "52.1%" },
      "Support": { pickRate: "30.1%", winRate: "49.8%" },
      "ADC": { pickRate: "15.2%", winRate: "51.3%" },
      "Top": { pickRate: "8.5%", winRate: "48.2%" },
      "Jungle": { pickRate: "1.0%", winRate: "45.0%" },
    },
  },
};

module.exports = {
  async execute(interaction) {
    try {
      // Check cooldown
      const cooldown = cooldownManager.checkCooldown(interaction.user.id, COMMAND_NAME, COOLDOWN_MS);
      if (cooldown.isOnCooldown) {
        await interaction.reply({
          embeds: [createCooldownEmbed(COMMAND_NAME, cooldown.remainingSeconds)],
          flags: 64,
        });
        return;
      }

      await deferInteraction(interaction);

      const championName = interaction.options.getString("champion");
      const role = interaction.options.getString("role") || "all";
      const queue = interaction.options.getString("queue") || "solo";
      const region = interaction.options.getString("region") || "global";
      const dataDragon = new DataDragon();

      const { champion } = await dataDragon.getChampionData(championName);
      const stats = STATS_DATA.default;

      // Build role stats text
      const roleStatsFields = Object.entries(stats.roleStats).map(([role, data]) => ({
        name: role,
        value: formatStats([`Pick: ${data.pickRate}`, `Win rate: ${data.winRate}`]),
        inline: true,
      }));

      const embed = new EmbedBuilder()
        .setColor(0xf39c12)
        .setTitle(`📊 ${champion.name.toUpperCase()} - STATISTICS`)
        .setDescription(`Thống kê tham khảo (Patch template ${stats.patch})\nVị trí: **${role}** | Queue: **${queue}** | Region: **${region}**`)
        .addFields(
          {
            name: "📈 TỔNG THỂ",
            value: formatStats([
              `Pick Rate: ${stats.pickRate}`,
              `Ban Rate: ${stats.banRate}`,
              `Win Rate: ${stats.winRate}`,
              `Avg KDA: ${stats.avgKDA}`,
            ]),
            inline: true,
          },
          {
            name: "🎯 ĐỘC LẬP",
            value: formatStats([`Top Role: ${stats.topRole}`, `Popularity: ${stats.popularity}`]),
            inline: true,
          },
          {
            name: "🎮 PHÂN BỐ THEO VỊ TRÍ",
            value: "Số liệu theo vị trí",
            inline: false,
          },
          ...roleStatsFields,
        )
        .addFields({
          name: "ℹ️ Ghi chú",
          value: "Dữ liệu stats hiện là template, chưa phải dữ liệu meta live.",
          inline: false,
        })
        .setTimestamp();

      await replyInteraction(interaction, { embeds: [embed] });
    } catch (error) {
      console.error("Stats command error:", error);
      await replyInteraction(interaction, { 
        embeds: [createErrorEmbed(error.message)],
        flags: 64
      });
    }
  },
};
