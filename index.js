const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { Client, GatewayIntentBits, Events, ChannelType } = require("discord.js");
const playerCommand = require("./commands/lol/player");
const rankCommand = require("./commands/lol/rank");
const matchesCommand = require("./commands/lol/matches");
const masteryCommand = require("./commands/lol/mastery");
const liveCommand = require("./commands/lol/live");
const championCommand = require("./commands/lol/champion");
const abilitiesCommand = require("./commands/lol/abilities");
const buildCommand = require("./commands/lol/build");
const counterCommand = require("./commands/lol/counter");
const statsCommand = require("./commands/lol/stats");
const weatherCommand = require("./commands/weather");
const helpCommand = require("./commands/help");
const gameNotifications = require("./services/gameNotifications");
const DataDragon = require("./services/dataDragon");
const cooldownManager = require("./utils/cooldown");
const { decodeProfile } = require("./utils/profileButtons");

const token = (process.env.DISCORD_TOKEN || process.env.TOKEN || "").trim();
if (!token) {
  console.error("❌ Không tìm thấy Discord token. Hãy thêm DISCORD_TOKEN=... vào file .env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const handlers = {
  weather: weatherCommand,
  player: playerCommand,
  rank: rankCommand,
  matches: matchesCommand,
  mastery: masteryCommand,
  live: liveCommand,
  champion: championCommand,
  abilities: abilitiesCommand,
  build: buildCommand,
  counter: counterCommand,
  stats: statsCommand,
};
const dataDragon = new DataDragon();

async function respondToAutocomplete(interaction, choices) {
  if (interaction.responded) return;

  try {
    await interaction.respond(choices);
  } catch (error) {
    if (error.code !== 40060) throw error;
  }
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
  console.log(`🔗 Bot is ready and listening for commands...`);
  readyClient.user.setActivity("/lol player | Rồng Lộn TV", { type: 5 });
  gameNotifications.start(readyClient);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton() && interaction.customId.startsWith("profile:")) {
    try {
      const [, page, encoded] = interaction.customId.split(":");
      const profile = decodeProfile(encoded);
      const handler = handlers[page];
      if (!handler) throw new Error("Trang hồ sơ không tồn tại.");
      const proxy = new Proxy(interaction, {
        get(target, property) {
          if (property === "options") {
            return {
              getString(name) {
                if (name === "riot-id") return `${profile.gameName}#${profile.tagLine}`;
                if (name === "tag") return profile.server;
                return null;
              },
            };
          }
          return Reflect.get(target, property, target);
        },
      });
      await handler.execute(proxy);
    } catch (error) {
      await interaction.reply({ content: `❌ ${error.message}`, flags: 64 }).catch(() => {});
    }
    return;
  }

  if (interaction.isAutocomplete()) {
    if (interaction.commandName === "weather") {
      await weatherCommand.autocomplete(interaction);
      return;
    }

    if (interaction.commandName !== "lol") return;

    try {
      const subcommand = interaction.options.getSubcommand();
      const focused = interaction.options.getFocused(true);
      const championOptions = new Set(["champion", "name"]);

      if (!championOptions.has(focused.name) || !["champion", "abilities", "build", "counter", "stats"].includes(subcommand)) {
        await respondToAutocomplete(interaction, []);
        return;
      }

      const search = String(focused.value || "").toLowerCase().trim();
      const champions = await dataDragon.getChampionList();
      const results = champions
        .filter((champion) => {
          const name = champion.name.toLowerCase();
          const id = champion.id.toLowerCase();
          return !search || name.includes(search) || id.includes(search);
        })
        .slice(0, 25)
        .map((champion) => ({ name: champion.name, value: champion.name }));

      await respondToAutocomplete(interaction, results);
    } catch (error) {
      if (error.code === 40060 || interaction.responded) return;
      console.error("Champion autocomplete error:", error);
      await respondToAutocomplete(interaction, []);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "weather") {
    await weatherCommand.execute(interaction);
    return;
  }
  if (interaction.commandName === "live") {
    await liveCommand.execute(interaction);
    return;
  }
  if (interaction.commandName === "help") {
    await helpCommand.execute(interaction);
    return;
  }
  if (interaction.commandName !== "lol") return;

  const subcommand = interaction.options.getSubcommand();
  const handler = handlers[subcommand];

  if (!handler) {
    await interaction.reply({
      content: "Subcommand không hợp lệ. Hãy thử /lol player, /lol rank, /lol matches, /lol champion, /lol abilities, /lol build, /lol counter hoặc /lol stats.",
      flags: 64,
    });
    return;
  }

  try {
    console.log(`📤 Command: /${interaction.commandName} ${subcommand} | User: ${interaction.user.tag}`);
    await handler.execute(interaction);
  } catch (error) {
    console.error(`❌ Error in command /${interaction.commandName} ${subcommand}:`, error);
    
    // Send error message to user
    const errorMessage =
      "Có lỗi xảy ra khi xử lý lệnh. Vui lòng thử lại sau hoặc liên hệ Admin.";
    
    if (interaction.replied) {
      await interaction.followUp({
        content: `❌ ${errorMessage}`,
        flags: 64,
      });
    } else if (interaction.deferred) {
      await interaction.editReply({
        content: `❌ ${errorMessage}`,
      });
    } else {
      await interaction.reply({
        content: `❌ ${errorMessage}`,
        flags: 64,
      });
    }
  }
});

// Handle errors
client.on("error", (error) => {
  console.error("❌ Discord client error:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

client.login(token);
