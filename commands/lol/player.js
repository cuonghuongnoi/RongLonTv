const RiotApi = require("../../services/riotApi");
const { EmbedBuilder } = require("discord.js");
const { createErrorEmbed, createCooldownEmbed, createServerUnavailableEmbed, formatStats, deferInteraction, replyInteraction } = require("../../utils/embed");
const { parseRiotId } = require("../../utils/riotId");
const cooldownManager = require("../../utils/cooldown");
const { profileButtons } = require("../../utils/profileButtons");

const COMMAND_NAME = "player";
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

      const riotIdInput = interaction.options.getString("riot-id");
      const tagInput = interaction.options.getString("tag");
      // Validate VN2 requires full Riot ID before deferring to avoid double acknowledgement
      if (tagInput === "VN2" && !riotIdInput.includes("#")) {
        await replyInteraction(interaction, {
          embeds: [createErrorEmbed(
            "❌ Server VN2 yêu cầu Riot ID đầy đủ (Tên#Tag).\n\n" +
            "📝 Ví dụ đúng: `/lol player riot-id:YourName#MIXII tag:VN2`"
          )],
          flags: 64,
        });
        return;
      }

      await deferInteraction(interaction);
      const { gameName, tagLine, server } = parseRiotId(riotIdInput, tagInput);
      const api = new RiotApi(process.env.RIOT_API_KEY, server);
      const { account, summoner } = await api.getPlayer(gameName, tagLine);

      let soloQueue = null;
      let flexQueue = null;
      let rankError = null;
      try {
        const leagues = await api.getLeagueByPuuid(summoner.puuid || account?.puuid);
        soloQueue = leagues.find((entry) => entry.queueType === "RANKED_SOLO_5x5") || null;
        flexQueue = leagues.find((entry) => entry.queueType === "RANKED_FLEX_SR") || null;
      } catch (rankErr) {
        rankError = rankErr.message;
      }

      const displayName = account ? `${account.gameName}#${account.tagLine}` : summoner.name;
      const soloDisplay = soloQueue ? `${soloQueue.tier} ${soloQueue.rank} (${soloQueue.leaguePoints} LP)` : "Unranked";
      const flexDisplay = flexQueue ? `${flexQueue.tier} ${flexQueue.rank} (${flexQueue.leaguePoints} LP)` : "Unranked";
      const puuid = account?.puuid || summoner.puuid;
      const getWinRate = (queue) => {
        if (!queue || queue.wins + queue.losses === 0) return "N/A";
        return `${((queue.wins / (queue.wins + queue.losses)) * 100).toFixed(1)}%`;
      };
      const soloStats = soloQueue ? formatStats([`Thắng: ${soloQueue.wins}`, `Thua: ${soloQueue.losses}`, `Win rate: ${getWinRate(soloQueue)}`]) : "Không có dữ liệu";
      const flexStats = flexQueue ? formatStats([`Thắng: ${flexQueue.wins}`, `Thua: ${flexQueue.losses}`, `Win rate: ${getWinRate(flexQueue)}`]) : "Không có dữ liệu";
      const status = soloQueue || flexQueue
        ? [
            (soloQueue?.hotStreak || flexQueue?.hotStreak) && "🔥 Hot streak",
            (soloQueue?.veteran || flexQueue?.veteran) && "⭐ Veteran",
            (soloQueue?.freshBlood || flexQueue?.freshBlood) && "🌱 Fresh blood",
            (soloQueue?.inactive || flexQueue?.inactive) && "💤 Inactive",
          ].filter(Boolean).join(" | ") || "Bình thường"
        : "Chưa có dữ liệu rank";

      const embed = new EmbedBuilder()
        .setColor(0x00aeef)
        .setTitle("👤 Thông tin người chơi")
        .setDescription(`**${displayName}**`)
        .addFields(
          { name: "Level", value: formatStats([`${summoner.summonerLevel}`]), inline: true },
          { name: "Server", value: formatStats([server]), inline: true },
          { name: "Rank", value: formatStats([soloDisplay]), inline: true },
          { name: "Flex Rank", value: formatStats([flexDisplay]), inline: true },
          { name: "📊 Solo/Duo Stats", value: soloStats, inline: true },
          { name: "📊 Flex Stats", value: flexStats, inline: true },
          { name: "Trạng thái", value: status, inline: false }
        )
        .setFooter({ text: `PUUID: ${puuid ? `${puuid.slice(0, 12)}...` : "N/A"}` })
        .setTimestamp();

      if (rankError) {
        const note = "Riot API không trả được dữ liệu rank lúc này. Hãy thử lại sau.";
        embed.addFields({ name: "ℹ️ Lưu ý", value: note, inline: false });
      }

      await replyInteraction(interaction, { embeds: [embed], components: tagLine ? profileButtons(gameName, tagLine, server) : [] });
    } catch (error) {
      console.error("Player command error:", error);
      await replyInteraction(interaction, { 
        embeds: [createErrorEmbed(error.message)],
        flags: 64
      });
    }
  },
};
