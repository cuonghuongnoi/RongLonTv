const RiotApi = require("../../services/riotApi");
const { EmbedBuilder } = require("discord.js");
const { createErrorEmbed, createCooldownEmbed, formatStats, deferInteraction, replyInteraction } = require("../../utils/embed");
const { parseRiotId } = require("../../utils/riotId");
const cooldownManager = require("../../utils/cooldown");
const { profileButtons } = require("../../utils/profileButtons");

const COMMAND_NAME = "matches";
const COOLDOWN_MS = 3000;

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

      const riotIdInput = interaction.options.getString("riot-id");
      const tagInput = interaction.options.getString("tag");
      const { gameName, tagLine, server } = parseRiotId(riotIdInput, tagInput);
      const api = new RiotApi(process.env.RIOT_API_KEY, server);
      const { account, summoner } = await api.getPlayer(gameName, tagLine);
      const puuid = account ? account.puuid : summoner.puuid;
      
      if (!puuid) {
        throw new Error(
          "Không thể lấy PUUID của người chơi. Hãy thử nhập Riot ID đầy đủ cùng server hoặc kiểm tra lại tên người chơi."
        );
      }

      const matchIds = await api.getMatches(puuid, 5);
      const displayName = account ? `${account.gameName}#${account.tagLine}` : summoner.name;
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("🎮 Trận gần đây")
        .setDescription(`👤 ${displayName} (${server})`);

      if (!matchIds.length) {
        embed.addFields({
          name: "ℹ️ Thông báo",
          value: "Không có trận nào gần đây.",
        });
        await replyInteraction(interaction, { embeds: [embed], components: tagLine ? profileButtons(gameName, tagLine, server) : [] });
        return;
      }

      const matchDetails = await Promise.all(
        matchIds.map(async (matchId, index) => {
          try {
            const match = await api.getMatch(matchId);
            const participant = match.info?.participants?.find((p) => p.puuid === puuid);

            if (!participant) {
              return {
                name: `${index + 1}. Trận đấu`,
                value: formatStats(["Không tìm thấy dữ liệu người chơi"]),
              };
            }

            const result = participant.win ? "🟢 Thắng" : "🔴 Thua";
            const champion = participant.championName || "Unknown";
            const kda = api.getKDA(participant);
            const gameDuration = Number(match.info?.gameDuration) || 0;
            const csPerMin = api.getCSPerMin(participant, gameDuration);
            const duration = api.formatDuration(gameDuration);
            const gold = ((participant.goldEarned || 0) / 1000).toFixed(1);

            return {
              name: `${index + 1}. ${result} | ${champion}`,
              value: formatStats([
                `KDA: ${kda}`,
                `CS/min: ${csPerMin}`,
                `Gold: ${gold}k`,
                `Duration: ${duration}`,
              ]),
              inline: true,
            };
          } catch (error) {
            return {
              name: `${index + 1}. Trận đấu`,
              value: formatStats(["Không tải được dữ liệu trận này"]),
            };
          }
        })
      );

      embed.addFields({ name: "📊 Chi tiết trận", value: "Các trận gần nhất", inline: false });
      embed.addFields(matchDetails);
      embed.setTimestamp();

      await replyInteraction(interaction, { embeds: [embed], components: tagLine ? profileButtons(gameName, tagLine, server) : [] });
    } catch (error) {
      console.error("Matches command error:", error);
      await replyInteraction(interaction, { 
        embeds: [createErrorEmbed(error.message)],
        flags: 64
      });
    }
  },
};
