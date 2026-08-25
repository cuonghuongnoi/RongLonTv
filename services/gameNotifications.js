const fs = require("fs");
const path = require("path");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { formatStats } = require("../utils/embed");
const { request } = require("../utils/http");

const CHANNELS = {
  patch: "1540194200929439824",
  balance: "1540194235628916806",
  skins: "1540194253395984484",
  esports: "1540194270940631070",
};
const STATE_FILE = path.join(__dirname, "..", ".game-notifications.json");
const PATCH_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const ESPORTS_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const ESPORTS_SCHEDULE_WINDOW_MS = 24 * 60 * 60 * 1000;
const PATCH_NOTES_URL = "https://www.leagueoflegends.com/en-us/news/game-updates/";
const ESPORTS_API_URL = "https://api.pandascore.co/lol/matches/upcoming";

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state) {
  const temporaryFile = `${STATE_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(state, null, 2));
  fs.renameSync(temporaryFile, STATE_FILE);
}

async function sendToChannel(client, channelId, payload) {
  const channel = await client.channels.fetch(channelId);
  if (!channel || typeof channel.send !== "function") {
    throw new Error(`Kênh ${channelId} không hỗ trợ gửi tin nhắn.`);
  }
  return channel.send(payload);
}

async function getJson(url) {
  const headers = { "User-Agent": "RongLonTV-LoL-Bot/1.0" };
  if (url.includes("api.pandascore.co") && process.env.ESPORTS_API_KEY) {
    headers.Authorization = `Bearer ${process.env.ESPORTS_API_KEY}`;
  }
  const response = await request(url, { headers });
  if (!response.ok) throw new Error(`Request thất bại (${response.status})`);
  return response.json();
}

async function getLatestPatch() {
  const versions = await getJson("https://ddragon.leagueoflegends.com/api/versions.json");
  return versions[0];
}

async function getPatchInfo(version) {
  const fallback = {
    version,
    title: `Patch ${version}`,
    url: PATCH_NOTES_URL,
    summary: "Xem bài cập nhật chính thức để biết đầy đủ thay đổi.",
  };

  try {
    const response = await request(PATCH_NOTES_URL, {
      headers: { "User-Agent": "RongLonTV-LoL-Bot/1.0" },
    });
    if (!response.ok) return fallback;

    const html = await response.text();
    const links = [...html.matchAll(/href=["']([^"']*\/news\/game-updates\/[^"']+)["']/gi)]
      .map((match) => match[1].startsWith("http") ? match[1] : `https://www.leagueoflegends.com${match[1]}`)
      .filter((url, index, all) => all.indexOf(url) === index);
    const patchUrl = links.find((url) => /patch|notes/i.test(url)) || links[0];
    if (!patchUrl) return fallback;

    const articleResponse = await request(patchUrl, {
      headers: { "User-Agent": "RongLonTV-LoL-Bot/1.0" },
    });
    if (!articleResponse.ok) return { ...fallback, url: patchUrl };

    const article = await articleResponse.text();
    const titleMatch = article.match(/<title[^>]*>([^<]+)/i);
    const descriptionMatch = article.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)/i);
    return {
      version,
      title: titleMatch?.[1]?.replace(/\s+/g, " ").trim() || fallback.title,
      url: patchUrl,
      summary: descriptionMatch?.[1]?.replace(/\s+/g, " ").trim() || fallback.summary,
    };
  } catch {
    return fallback;
  }
}

function patchMessage(info) {
  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("📢 Patch mới đã phát hành")
    .setDescription(info.summary)
    .addFields({ name: "Phiên bản", value: formatStats([info.version]), inline: true })
    .setURL(info.url)
    .setFooter({ text: "Nguồn: Riot Games" })
    .setTimestamp();
}

function balanceMessage(info) {
  return new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle("⚖️ Cân bằng tướng")
    .setDescription(`Buff và nerf trong **${info.title}**. Mở bài patch để xem từng tướng và chỉ số thay đổi.`)
    .addFields({ name: "Patch", value: formatStats([info.version]), inline: true })
    .setURL(info.url)
    .setFooter({ text: "Xem chi tiết thay đổi tại Riot Games" })
    .setTimestamp();
}

function skinsMessage(info) {
  return new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle("🎨 Trang phục mới")
    .setDescription(`Trang phục mới trong **${info.title}**. Mở bài patch để xem tên và hình ảnh từng skin.`)
    .addFields({ name: "Patch", value: formatStats([info.version]), inline: true })
    .setURL(info.url)
    .setFooter({ text: "Xem chi tiết tại Riot Games" })
    .setTimestamp();
}

function linkComponents(label, url) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel(label)
        .setStyle(ButtonStyle.Link)
        .setURL(url)
    ),
  ];
}

function getScheduleEvents(schedule) {
  const events = Array.isArray(schedule) ? schedule : [];
  const now = Date.now();
  const tomorrow = now + ESPORTS_SCHEDULE_WINDOW_MS;
  return events.filter((event) => {
    const start = Date.parse(event.begin_at);
    return event.status === "not_started" && start >= now && start <= tomorrow;
  });
}

function esportsMessage(events) {
  const fields = events.slice(0, 10).map((event, index) => {
    const teams = event.opponents || [];
    const left = teams[0]?.opponent?.acronym || teams[0]?.opponent?.name || "TBD";
    const right = teams[1]?.opponent?.acronym || teams[1]?.opponent?.name || "TBD";
    const timestamp = Math.floor(Date.parse(event.begin_at) / 1000);
    const leagueName = event.league?.name || "N/A";
    return {
      name: `${index + 1}. ${left} vs ${right}`,
      value: `Bắt đầu: <t:${timestamp}:F>\n${formatStats([`Giải đấu: ${leagueName}`])}`,
      inline: true,
    };
  });
  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle("🏆 Lịch eSports sắp tới")
    .setDescription("Các trận đấu trong 24 giờ tới.")
    .addFields(fields.length ? fields : { name: "Lịch thi đấu", value: "Không có trận đấu sắp tới." })
    .setFooter({ text: "Nguồn: PandaScore" })
    .setTimestamp();
}

function esportsFingerprint(events) {
  return events.map((event) => ({
    id: event.id,
    begin_at: event.begin_at,
    status: event.status,
    league: event.league?.name || "",
    opponents: (event.opponents || []).map(({ opponent }) => opponent?.id || opponent?.name || ""),
  }));
}

async function check(client) {
  const state = readState();
  const patchCheckDue = !state.patchCheckedAt || Date.now() - state.patchCheckedAt >= PATCH_CHECK_INTERVAL_MS;
  if (patchCheckDue) {
    try {
      const patch = await getLatestPatch();
      const patchInfo = await getPatchInfo(patch);

      if (state.patch !== patch) {
        await sendToChannel(client, CHANNELS.patch, { embeds: [patchMessage(patchInfo)], components: linkComponents("📖 Xem Patch Notes", patchInfo.url) });
        await sendToChannel(client, CHANNELS.balance, { embeds: [balanceMessage(patchInfo)], components: linkComponents("⚖️ Xem thay đổi", patchInfo.url) });
        await sendToChannel(client, CHANNELS.skins, { embeds: [skinsMessage(patchInfo)], components: linkComponents("🎨 Xem Skin mới", patchInfo.url) });
        state.patch = patch;
      }
      state.patchCheckedAt = Date.now();
    } catch (error) {
      console.error("Patch notification error:", error.message);
    }
  }

  try {
    const params = new URLSearchParams({
      sort: "begin_at",
      "range[begin_at]": `${new Date().toISOString()},${new Date(Date.now() + ESPORTS_SCHEDULE_WINDOW_MS).toISOString()}`,
      per_page: "10",
    });
    const schedule = await getJson(`${ESPORTS_API_URL}?${params}`);
    const events = getScheduleEvents(schedule);
    const eventKey = JSON.stringify(esportsFingerprint(events));
    if (state.esports !== eventKey) {
      await sendToChannel(client, CHANNELS.esports, { embeds: [esportsMessage(events)] });
      state.esports = eventKey;
    }
  } catch (error) {
    console.error("eSports notification error:", error.message);
  }

  try {
    writeState(state);
  } catch (error) {
    console.error("Notification state write error:", error.message);
  }
}

async function sendLatest(client) {
  const patch = await getLatestPatch();
  const patchInfo = await getPatchInfo(patch);
  await sendToChannel(client, CHANNELS.patch, { embeds: [patchMessage(patchInfo)], components: linkComponents("📖 Xem Patch Notes", patchInfo.url) });
  await sendToChannel(client, CHANNELS.balance, { embeds: [balanceMessage(patchInfo)], components: linkComponents("⚖️ Xem thay đổi", patchInfo.url) });
  await sendToChannel(client, CHANNELS.skins, { embeds: [skinsMessage(patchInfo)], components: linkComponents("🎨 Xem Skin mới", patchInfo.url) });

  try {
    const params = new URLSearchParams({
      sort: "begin_at",
      "range[begin_at]": `${new Date().toISOString()},${new Date(Date.now() + ESPORTS_SCHEDULE_WINDOW_MS).toISOString()}`,
      per_page: "10",
    });
    const schedule = await getJson(`${ESPORTS_API_URL}?${params}`);
    await sendToChannel(client, CHANNELS.esports, { embeds: [esportsMessage(getScheduleEvents(schedule))] });
  } catch (error) {
    console.error("eSports manual notification error:", error.message);
    await sendToChannel(client, CHANNELS.esports, { embeds: [
      new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle("🏆 Lịch eSports sắp tới")
        .setDescription("Hiện chưa lấy được lịch thi đấu.")
        .setFooter({ text: "Nguồn: PandaScore" })
        .setTimestamp()
    ] });
  }
}

function start(client) {
  let checking = false;
  const runCheck = async () => {
    if (checking) return;
    checking = true;
    try {
      await check(client);
    } catch (error) {
      console.error("Game notification error:", error.message);
    } finally {
      checking = false;
    }
  };

  runCheck();
  const interval = setInterval(runCheck, ESPORTS_CHECK_INTERVAL_MS);
  interval.unref?.();
  return interval;
}

module.exports = { start, check, sendLatest, CHANNELS };
