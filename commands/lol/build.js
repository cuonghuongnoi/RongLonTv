const DataDragon = require("../../services/dataDragon");
const { EmbedBuilder } = require("discord.js");
const { createErrorEmbed, createCooldownEmbed, formatStats, deferInteraction, replyInteraction } = require("../../utils/embed");
const cooldownManager = require("../../utils/cooldown");

const COMMAND_NAME = "build";
const COOLDOWN_MS = 2000;

// Sample build data - in production, this would come from an API like Champion.gg or external data
const BUILD_DATA = {
  default: {
    start: ["Doran's Ring", "Health Potion"],
    core: ["Luden's Companion", "Shadowflame", "Rabadon's Deathcap"],
    boots: "Sorcerer's Shoes",
    runes: {
      primary: "Electrocute",
      secondary: "Precision",
      shards: ["Attack Speed", "Adaptive Force", "Magic Resist"],
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

      const { version, champion } = await dataDragon.getChampionData(championName);
      
      // Get build data (currently uses default, can be extended to fetch from external APIs)
      const buildData = BUILD_DATA.default;

      const embed = new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle(`🦊 ${champion.name.toUpperCase()} - BUILD GUIDE`)
        .setDescription(`📊 Build tham khảo cho **${champion.name}**\nVị trí: **${role}** | Queue: **${queue}** | Region: **${region}**`)
        .addFields(
          {
            name: "🛍️ STARTER",
            value: formatStats(buildData.start),
            inline: true,
          },
          {
            name: "💎 CORE ITEMS",
            value: formatStats(buildData.core),
            inline: true,
          },
          {
            name: "👢 BOOTS",
            value: formatStats([buildData.boots]),
            inline: true,
          },
          {
            name: "🔮 RUNES",
            value: formatStats([
              `Primary: ${buildData.runes.primary}`,
              `Secondary: ${buildData.runes.secondary}`,
              `Shards: ${buildData.runes.shards.join(", ")}`,
            ]),
            inline: false,
          }
        )
        .addFields({
          name: "ℹ️ Lưu ý",
          value: "Dữ liệu build hiện là template, chưa phải dữ liệu meta live. Điều chỉnh theo trận đấu thực tế.",
          inline: false,
        })
        .setTimestamp();

      const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.id}.png`;
      embed.setThumbnail(imageUrl);

      await replyInteraction(interaction, { embeds: [embed] });
    } catch (error) {
      console.error("Build command error:", error);
      await replyInteraction(interaction, { 
        embeds: [createErrorEmbed(error.message)],
        flags: 64
      });
    }
  },
};
