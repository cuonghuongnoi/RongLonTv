const RiotApi = require("../../services/riotApi");
const DataDragon = require("../../services/dataDragon");
const { EmbedBuilder } = require("discord.js");
const { createErrorEmbed, createCooldownEmbed, formatStats, deferInteraction, replyInteraction } = require("../../utils/embed");
const { parseRiotId } = require("../../utils/riotId");
const { profileButtons } = require("../../utils/profileButtons");
const cooldownManager = require("../../utils/cooldown");

module.exports = {
  async execute(interaction) {
    try {
      const cooldown = cooldownManager.checkCooldown(interaction.user.id, "mastery", 3000);
      if (cooldown.isOnCooldown) {
        await interaction.reply({ embeds: [createCooldownEmbed("mastery", cooldown.remainingSeconds)], flags: 64 });
        return;
      }
      await deferInteraction(interaction);
      const { gameName, tagLine, server } = parseRiotId(interaction.options.getString("riot-id"), interaction.options.getString("tag"));
      const api = new RiotApi(process.env.RIOT_API_KEY, server);
      const { account } = await api.getPlayer(gameName, tagLine);
      const masteries = await api.getChampionMasteries(account.puuid);
      const champions = new Map((await new DataDragon().getChampionList()).map((champion) => [Number(champion.key), champion.name]));
      const fields = masteries.map((entry, index) => ({
        name: `${index + 1}. ${champions.get(entry.championId) || `Champion ${entry.championId}`}`,
        value: formatStats([`Điểm: ${entry.championPoints}`, `Cấp: ${entry.championLevel}`]),
        inline: true,
      }));
      const embed = new EmbedBuilder().setColor(0xf1c40f).setTitle("🏅 Champion Mastery").setDescription(`**${gameName}#${tagLine}** | ${server}`).addFields(fields.length ? fields : { name: "Dữ liệu", value: "Chưa có dữ liệu mastery." }).setTimestamp();
      await replyInteraction(interaction, { embeds: [embed], components: profileButtons(gameName, tagLine, server) });
    } catch (error) {
      await replyInteraction(interaction, { embeds: [createErrorEmbed(error.message)], flags: 64 });
    }
  },
};