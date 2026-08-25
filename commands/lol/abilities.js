const DataDragon = require("../../services/dataDragon");
const { EmbedBuilder } = require("discord.js");
const { createErrorEmbed, createCooldownEmbed, formatStats, deferInteraction, replyInteraction } = require("../../utils/embed");
const cooldownManager = require("../../utils/cooldown");

const COMMAND_NAME = "abilities";
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
      
      if (!champion.spells || champion.spells.length === 0) {
        throw new Error(`Không tìm thấy dữ liệu kỹ năng cho tướng ${championName}`);
      }

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle(`🔮 ${champion.name} - KỸ NĂNG`)
        .setDescription(`Chi tiết các kỹ năng của **${champion.name}**`);

      // Add passive
      if (champion.passive) {
        embed.addFields({
          name: "🛡️ PASSIVE - " + champion.passive.name,
          value: formatStats([champion.passive.description?.slice(0, 300) || "Không có mô tả."]),
          inline: false,
        });
      }

      // Add abilities
      const abilityKeys = ["Q", "W", "E", "R"];
      champion.spells.forEach((spell, index) => {
        const description = spell.description?.slice(0, 250) + (spell.description?.length > 250 ? "..." : "") || "Không có mô tả";
        embed.addFields({
          name: `${abilityKeys[index]} - ${spell.name}`,
          value: formatStats([description]),
          inline: false,
        });
      });

      const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.id}.png`;
      embed.setThumbnail(imageUrl);
      embed.setTimestamp();

      await replyInteraction(interaction, { embeds: [embed] });
    } catch (error) {
      console.error("Abilities command error:", error);
      await replyInteraction(interaction, {
        embeds: [createErrorEmbed(error.message)],
        flags: 64,
      });
    }
  },
};
