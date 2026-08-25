const DataDragon = require("../../services/dataDragon");
const { EmbedBuilder } = require("discord.js");
const { createErrorEmbed, createCooldownEmbed, formatStats, deferInteraction, replyInteraction } = require("../../utils/embed");
const cooldownManager = require("../../utils/cooldown");

const COMMAND_NAME = "counter";
const COOLDOWN_MS = 2000;

// Sample counter data - in production, this would come from an external API
const COUNTER_DATA = {
  default: {
    counters: [
      { name: "Champion 1", winRate: "65.2%", difficulty: "★★★☆☆" },
      { name: "Champion 2", winRate: "62.8%", difficulty: "★★☆☆☆" },
      { name: "Champion 3", winRate: "60.5%", difficulty: "★★★★☆" },
    ],
    tips: [
      "• Tránh gặp tête-à-tête ở lane\n",
      "• Hợp tác với support để gank\n",
      "• Focus vào farm an toàn\n",
      "• Tìm cơ hội roam hoặc gank lane khác",
    ],
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
      const counterData = COUNTER_DATA.default;

      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle(`⚔️ ${champion.name.toUpperCase()} - COUNTERS`)
        .setDescription(`Counter tham khảo cho **${champion.name}**\nVị trí: **${role}** | Queue: **${queue}** | Region: **${region}**`)
        .addFields(
          {
            name: "🥇 TOP COUNTERS",
            value: "Tướng khắc chế đề xuất",
            inline: false,
          },
          ...counterData.counters.map((counter, index) => ({
            name: `${index + 1}. ${counter.name}`,
            value: formatStats([`Win Rate: ${counter.winRate}`, `Difficulty: ${counter.difficulty}`]),
            inline: true,
          })),
          {
            name: "💡 TIPS VÀ TRICS",
            value: counterData.tips.join(""),
            inline: false,
          }
        )
        .addFields({
          name: "📝 Ghi chú",
          value: "Dữ liệu counter hiện là template, chưa phải dữ liệu meta live.",
          inline: false,
        })
        .setTimestamp();

      await replyInteraction(interaction, { embeds: [embed] });
    } catch (error) {
      console.error("Counter command error:", error);
      await replyInteraction(interaction, { 
        embeds: [createErrorEmbed(error.message)],
        flags: 64
      });
    }
  },
};
