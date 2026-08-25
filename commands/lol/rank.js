const RiotApi = require("../../services/riotApi");
const { EmbedBuilder } = require("discord.js");
const { createErrorEmbed, createCooldownEmbed, formatStats, deferInteraction, replyInteraction } = require("../../utils/embed");
const { parseRiotId } = require("../../utils/riotId");
const cooldownManager = require("../../utils/cooldown");
const { profileButtons } = require("../../utils/profileButtons");

const COMMAND_NAME = "rank";
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
            "📝 Ví dụ đúng: `/lol rank riot-id:YourName#MIXII tag:VN2`"
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
      let rankError = null;
      try {
        const leagues = await api.getLeagueByPuuid(summoner.puuid || account?.puuid);
        soloQueue = leagues.find((entry) => entry.queueType === "RANKED_SOLO_5x5") || null;
      } catch (err) {
        rankError = err.message;
      }

      const displayName = account ? `${account.gameName}#${account.tagLine}` : summoner.name;
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🏆 LOL Rank")
        .setDescription(`👤 **${displayName}** (Server: ${server})`)
        .addFields(
          { 
            name: "🧠 Solo/Duo Rank", 
            value: formatStats([soloQueue ? `${soloQueue.tier} ${soloQueue.rank}` : "Không có dữ liệu rank"]), 
            inline: true 
          },
          { 
            name: "LP", 
            value: formatStats([soloQueue ? `${soloQueue.leaguePoints}` : "0"]), 
            inline: true 
          },
          { 
            name: "📊 Thống kê", 
            value: soloQueue
              ? formatStats([`Wins: ${soloQueue.wins}`, `Losses: ${soloQueue.losses}`, `Win Rate: ${((soloQueue.wins / (soloQueue.wins + soloQueue.losses)) * 100).toFixed(1)}%`])
              : "Không có dữ liệu", 
            inline: false 
          }
        )
        .setTimestamp();

      if (rankError) {
        const note = "Riot API không trả được dữ liệu rank lúc này. Hãy thử lại sau.";
        embed.addFields({ name: "ℹ️ Lưu ý", value: note });
      }

      await replyInteraction(interaction, { embeds: [embed], components: tagLine ? profileButtons(gameName, tagLine, server) : [] });
    } catch (error) {
      console.error("Rank command error:", error);
      await replyInteraction(interaction, { 
        embeds: [createErrorEmbed(error.message)],
        flags: 64
      });
    }
  },
};
