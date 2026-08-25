const RiotApi = require("../../services/riotApi");
const { EmbedBuilder } = require("discord.js");
const { createErrorEmbed, createCooldownEmbed, formatStats, deferInteraction, replyInteraction } = require("../../utils/embed");
const { parseRiotId } = require("../../utils/riotId");
const cooldownManager = require("../../utils/cooldown");
const DataDragon = require("../../services/dataDragon");

const COMMAND_NAME = "live";
const COOLDOWN_MS = 3000;

const MAP_NAMES = {
  11: "Summoner's Rift",
  12: "Howling Abyss",
  21: "Nexus Blitz",
  22: "Theatre of the Blood",
};

const GAME_MODES = {
  CLASSIC: "Summoner's Rift",
  ARAM: "ARAM",
  NEXUS_BLITZ: "Nexus Blitz",
  URF: "URF",
  ONEFORALL: "One for All",
  CHERRY: "Arena",
};

function participantName(participant) {
  const name = participant.riotIdGameName || participant.summonerName || participant.gameName;
  const tag = participant.riotIdTagline || participant.tagLine;
  return name ? `${name}${tag ? `#${tag}` : ""}` : "Người chơi ẩn danh";
}

function formatParticipant({ participant, championName, rank }) {
  return `${participantName(participant)} | ${championName} | ${rank}`;
}

module.exports = {
  async execute(interaction) {
    try {
      await deferInteraction(interaction);

      const cooldown = cooldownManager.checkCooldown(interaction.user.id, COMMAND_NAME, COOLDOWN_MS);
      if (cooldown.isOnCooldown) {
        await replyInteraction(interaction, {
          embeds: [createCooldownEmbed(COMMAND_NAME, cooldown.remainingSeconds)],
          flags: 64,
        });
        return;
      }

      const riotIdInput = interaction.options.getString("riotid");
      const regionInput = interaction.options.getString("region");
      const { gameName, tagLine, server } = parseRiotId(riotIdInput, regionInput);

      if (!tagLine) {
        throw new Error("Lệnh live yêu cầu Riot ID đầy đủ dạng Tên#Tag.");
      }

      const api = new RiotApi(process.env.RIOT_API_KEY, server);
      const { account, summoner } = await api.getPlayer(gameName, tagLine);
      const puuid = account?.puuid || summoner?.puuid;

      if (!puuid) {
        throw new Error("Riot API chưa trả PUUID nên chưa thể kiểm tra trận đang chơi ở server này.");
      }

      const game = await api.getCurrentGame(puuid);
      const displayName = account ? `${account.gameName}#${account.tagLine}` : gameName;
      const championList = await new DataDragon().getChampionList();
      const championsByKey = new Map(championList.map((champion) => [String(champion.key), champion.name]));
      const participantDetails = await Promise.all((game.participants || []).map(async (participant) => {
        const championName = championsByKey.get(String(participant.championId)) || `Champion ${participant.championId}`;
        let identity = participant;
        if (!participant.riotIdGameName && !participant.summonerName && participant.puuid) {
          try {
            const accountInfo = await api.getAccountByPuuid(participant.puuid);
            identity = { ...participant, riotIdGameName: accountInfo.gameName, riotIdTagline: accountInfo.tagLine };
          } catch {
            // Riot may hide account identity for some participants.
          }
        }
        let rank = "Unranked";
        try {
          const leagues = await api.getLeagueByPuuid(participant.puuid);
          const solo = leagues.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
          if (solo) rank = `${solo.tier} ${solo.rank} (${solo.leaguePoints} LP)`;
        } catch {
          rank = "Không tải được rank";
        }
        return { participant: identity, championName, rank };
      }));
      const teamFields = [100, 200].map((teamId) => {
        const players = participantDetails
          .filter(({ participant }) => participant.teamId === teamId)
          .map(formatParticipant)
          .join("\n\n") || "Không có dữ liệu";
        return { name: teamId === 100 ? "🔵 ĐỘI XANH" : "🔴 ĐỘI ĐỎ", value: `\`\`\`\n${players.slice(0, 1016)}\n\`\`\``, inline: true };
      });
      const elapsedMinutes = game.gameStartTime
        ? Math.max(0, Math.floor((Date.now() - game.gameStartTime) / 60000))
        : null;
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("🔴 Đang trong trận đấu")
        .setDescription(`**${displayName}**\nServer **${server}**  ·  ${GAME_MODES[game.gameMode] || game.gameMode || "Chế độ không rõ"}`)
        .addFields(
          { name: "🗺️ Bản đồ", value: MAP_NAMES[game.mapId] || `Map ${game.mapId || "?"}`, inline: true },
          { name: "⏱️ Thời gian", value: elapsedMinutes == null ? "Chưa rõ" : `${elapsedMinutes} phút`, inline: true },
          { name: "👥 Người chơi", value: `${game.participants?.length || 0}/10`, inline: true },
          { name: "🕒 Bắt đầu", value: game.gameStartTime ? `<t:${Math.floor(game.gameStartTime / 1000)}:R>` : "Chưa rõ", inline: true }
        )
        .addFields(teamFields)
        .setTimestamp();

      await replyInteraction(interaction, { embeds: [embed] });
    } catch (error) {
      if (error.message.includes("404") || error.message.includes("Không tìm thấy")) {
        await replyInteraction(interaction, {
          embeds: [new EmbedBuilder().setColor(0xf1c40f).setDescription("🟡 Người chơi hiện không ở trong trận đấu.")],
          flags: 64,
        });
        return;
      }

      console.error("Live command error:", error);
      await replyInteraction(interaction, { embeds: [createErrorEmbed(error.message)], flags: 64 });
    }
  },
};