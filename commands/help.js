const { EmbedBuilder } = require("discord.js");

module.exports = {
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("📚 Lệnh của Rồng Lộn TV")
      .setDescription("Các lệnh đang hoạt động")
      .addFields(
        { name: "Người chơi", value: "`/lol player`, `/lol rank`, `/lol matches`, `/lol mastery`", inline: false },
        { name: "Trận đấu", value: "`/live`", inline: false },
        { name: "Tướng", value: "`/lol champion`, `/lol abilities`, `/lol build`, `/lol counter`, `/lol stats`", inline: false },
        { name: "Tiện ích", value: "`/weather`, `/help`", inline: false },
      )
      .setFooter({ text: "Dữ liệu người chơi lấy từ Riot Games" })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
