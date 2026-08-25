const DataDragon = require("../../services/dataDragon");
const { EmbedBuilder } = require("discord.js");
const { createErrorEmbed, createCooldownEmbed, formatStats, deferInteraction, replyInteraction } = require("../../utils/embed");
const cooldownManager = require("../../utils/cooldown");

const COMMAND_NAME = "champion";
const COOLDOWN_MS = 2000;

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

      const championName = interaction.options.getString("name");
      const dataDragon = new DataDragon();

      const { version, champion } = await dataDragon.getChampionData(championName);
      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle(`🦸 ${champion.name}`)
        .setDescription(`**${champion.title}**`)
        .addFields(
          { 
            name: "🎯 Vai trò", 
            value: formatStats([champion.tags?.join(", ") || "N/A"]), 
            inline: true 
          },
          { 
            name: "📈 Độ khó", 
            value: formatStats([`Mức độ: ${champion.info?.difficulty || "N/A"}`, "⭐".repeat(champion.info?.difficulty || 0) || "N/A"]), 
            inline: true 
          },
          { 
            name: "📖 Lore", 
            value: champion.lore
              ? champion.lore.slice(0, 250) + (champion.lore.length > 250 ? "...\n[Xem thêm trên LOL Wiki]" : "")
              : "Chưa có mô tả lore.",
            inline: false 
          }
        );

      // Add abilities if available
      if (champion.spells && champion.spells.length > 0) {
        const abilitiesText = champion.spells
          .map((spell, i) => {
            const keys = ["Q", "W", "E", "R"];
            return `**${keys[i]}** - ${spell.name}`;
          })
          .join("\n");

        if (champion.passive) {
          const passiveText = `**P** - ${champion.passive.name}`;
          embed.addFields({
            name: "🔧 Kỹ năng",
            value: passiveText + "\n" + abilitiesText,
            inline: false,
          });
        }
      }

      const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.id}.png`;
      embed.setThumbnail(imageUrl);
      embed.setTimestamp();

      await replyInteraction(interaction, { embeds: [embed] });
    } catch (error) {
      console.error("Champion command error:", error);
      await replyInteraction(interaction, { 
        embeds: [createErrorEmbed(error.message)],
        flags: 64
      });
    }
  },
};
