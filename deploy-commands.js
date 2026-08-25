const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const token = (process.env.DISCORD_TOKEN || process.env.TOKEN || "").trim();
if (!token) {
  console.error("❌ Không tìm thấy Discord token. Hãy thêm DISCORD_TOKEN=... vào file .env");
  process.exit(1);
}

const serverChoices = [
  { name: "VN2", value: "VN2" }, { name: "VN1", value: "VN1" }, { name: "KR", value: "KR" },
  { name: "EUNE", value: "EUN1" }, { name: "EUW", value: "EUW1" }, { name: "JP", value: "JP1" },
  { name: "NA1", value: "NA1" }, { name: "BR1", value: "BR1" }, { name: "LAN", value: "LA1" },
  { name: "LAS", value: "LA2" }, { name: "OCE", value: "OC1" }, { name: "TR1", value: "TR1" },
  { name: "RU", value: "RU" }, { name: "TW2", value: "TW2" }, { name: "SG2", value: "SG2" },
  { name: "TH2", value: "TH2" }, { name: "PH2", value: "PH2" },
];

const riotTagOption = (option) => option.setName("tag").setDescription("Server sau dấu #").setRequired(true).addChoices(...serverChoices);
const riotIdOption = (option) => option.setName("riot-id").setDescription("Riot ID dạng Tên#Tag").setRequired(true);
const regionOption = (option) => option.setName("region").setDescription("Khu vực máy chủ").setRequired(true).addChoices(...serverChoices);
const championOption = (option) => option.setName("champion").setDescription("Tên tướng").setAutocomplete(true).setRequired(true);
const metaOptions = (subcommand) => subcommand
  .addStringOption((option) => option.setName("role").setDescription("Vị trí").addChoices(
    { name: "Top", value: "top" }, { name: "Jungle", value: "jungle" }, { name: "Mid", value: "mid" },
    { name: "ADC", value: "adc" }, { name: "Support", value: "support" },
  ))
  .addStringOption((option) => option.setName("queue").setDescription("Chế độ xếp hạng").addChoices(
    { name: "Solo/Duo", value: "solo" }, { name: "Flex", value: "flex" },
  ))
  .addStringOption((option) => option.setName("region").setDescription("Khu vực dữ liệu meta").addChoices(...serverChoices));

const lol = new SlashCommandBuilder()
  .setName("lol")
  .setDescription("League of Legends commands for Rồng Lộn TV")
  .addSubcommand((command) => command.setName("player").setDescription("Tra cứu người chơi").addStringOption(riotIdOption).addStringOption(riotTagOption))
  .addSubcommand((command) => command.setName("rank").setDescription("Hiển thị rank").addStringOption(riotIdOption).addStringOption(riotTagOption))
  .addSubcommand((command) => command.setName("matches").setDescription("Hiển thị 5 trận gần nhất").addStringOption(riotIdOption).addStringOption(riotTagOption))
  .addSubcommand((command) => command.setName("mastery").setDescription("Hiển thị champion mastery").addStringOption(riotIdOption).addStringOption(riotTagOption))
  .addSubcommand((command) => command.setName("champion").setDescription("Hiển thị thông tin tướng").addStringOption((option) => option.setName("name").setDescription("Tên tướng").setAutocomplete(true).setRequired(true)))
  .addSubcommand((command) => command.setName("abilities").setDescription("Hiển thị kỹ năng").addStringOption((option) => option.setName("name").setDescription("Tên tướng").setAutocomplete(true).setRequired(true)))
  .addSubcommand((command) => metaOptions(command.setName("build").setDescription("Hiển thị build").addStringOption(championOption)))
  .addSubcommand((command) => metaOptions(command.setName("counter").setDescription("Hiển thị counter").addStringOption(championOption)))
  .addSubcommand((command) => metaOptions(command.setName("stats").setDescription("Hiển thị thống kê").addStringOption(championOption)));

const commands = [
  new SlashCommandBuilder().setName("weather").setDescription("Tra cứu thời tiết hiện tại").addStringOption((option) => option.setName("city").setDescription("Tên thành phố").setAutocomplete(true).setRequired(true)),
  new SlashCommandBuilder().setName("help").setDescription("Liệt kê các lệnh đang hoạt động"),
  lol,
  new SlashCommandBuilder().setName("live").setDescription("Kiểm tra trận đang diễn ra").addStringOption((option) => option.setName("riotid").setDescription("Riot ID dạng Tên#Tag").setRequired(true)).addStringOption(regionOption),
].map((command) => command.toJSON());

(async () => {
  const rest = new REST({ version: "10" }).setToken(token);
  try {
    console.log("Registering slash commands...");
    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
      console.log("Slash commands registered for guild.");
    } else {
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
      console.log("Slash commands registered globally.");
    }
  } catch (error) {
    console.error(error);
  }
})();
