const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function encodeProfile(profile) {
  return Buffer.from(JSON.stringify(profile), "utf8").toString("base64url");
}

function decodeProfile(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function profileButtons(gameName, tagLine, server) {
  const profile = { gameName, tagLine, server };
  const encoded = encodeProfile(profile);
  const buttons = [
    ["👤 Player", "player"],
    ["🏆 Rank", "rank"],
    ["🎮 Matches", "matches"],
    ["🏅 Mastery", "mastery"],
  ].map(([label, page]) => new ButtonBuilder().setCustomId(`profile:${page}:${encoded}`).setLabel(label).setStyle(ButtonStyle.Secondary));
  return [new ActionRowBuilder().addComponents(buttons)];
}

module.exports = { profileButtons, decodeProfile };
