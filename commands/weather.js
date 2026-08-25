const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { EmbedBuilder } = require("discord.js");
const { createErrorEmbed, createCooldownEmbed, formatStats, deferInteraction, replyInteraction } = require("../utils/embed");
const cooldownManager = require("../utils/cooldown");
const { request } = require("../utils/http");

const COMMAND_NAME = "weather";
const COOLDOWN_MS = 3000;

async function getCitySuggestions(query) {
  const apiKey = (process.env.WEATHER_API_KEY || "").trim();
  if (!apiKey || !query.trim()) return [];

  const response = await request(
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query.trim())}&limit=5&appid=${encodeURIComponent(apiKey)}`
  );
  if (!response.ok) return [];

  const places = await response.json();
  return places.map((place) => ({
    name: [place.name, place.state, place.country].filter(Boolean).join(", ").slice(0, 100),
    value: `geo:${place.lat},${place.lon}:${place.name}`.slice(0, 100),
  }));
}

module.exports = {
  async autocomplete(interaction) {
    try {
      const query = interaction.options.getString("city") || "";
      const popularCities = ["Hanoi, VN", "Ho Chi Minh City, VN", "Tokyo, JP", "London, GB", "New York, US"];
      const suggestions = query.trim()
        ? await getCitySuggestions(query)
        : popularCities.map((city) => ({ name: city, value: city }));
      await interaction.respond(suggestions.slice(0, 25));
    } catch (error) {
      console.error("Weather autocomplete error:", error);
      await interaction.respond([]).catch(() => {});
    }
  },

  async execute(interaction) {
    try {
      const cooldown = cooldownManager.checkCooldown(interaction.user.id, COMMAND_NAME, COOLDOWN_MS);
      if (cooldown.isOnCooldown) {
        await interaction.reply({
          embeds: [createCooldownEmbed(COMMAND_NAME, cooldown.remainingSeconds)],
          flags: 64,
        });
        return;
      }

      await deferInteraction(interaction);

      const apiKey = (process.env.WEATHER_API_KEY || "").trim();
      if (!apiKey) {
        throw new Error("Chưa cấu hình WEATHER_API_KEY trong file .env.");
      }

      const cityInput = interaction.options.getString("city").trim();
      const geoMatch = cityInput.match(/^geo:([-\d.]+),([-\d.]+):(.+)$/);
      const city = geoMatch ? geoMatch[3] : cityInput;
      const weatherUrl = geoMatch
        ? `https://api.openweathermap.org/data/2.5/weather?lat=${geoMatch[1]}&lon=${geoMatch[2]}&appid=${encodeURIComponent(apiKey)}&units=metric&lang=vi`
        : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityInput)}&appid=${encodeURIComponent(apiKey)}&units=metric&lang=vi`;
      const response = await request(weatherUrl);

      if (!response.ok) {
        if (response.status === 401) throw new Error("WEATHER_API_KEY không hợp lệ hoặc đã hết hạn.");
        if (response.status === 404) throw new Error(`Không tìm thấy thành phố "${city}".`);
        throw new Error(`Weather API trả về lỗi ${response.status}.`);
      }

      const weather = await response.json();
      const current = weather.main;
      const location = weather.name;
      const description = weather.weather?.[0]?.description || "Không rõ";

      if (!current || !location) {
        throw new Error("Dịch vụ thời tiết không trả đủ dữ liệu cho địa điểm này.");
      }

      const areaName = location;
      const country = weather.sys?.country || "";
      const windSpeed = weather.wind?.speed == null ? "N/A" : (weather.wind.speed * 3.6).toFixed(1);
      const windDirection = weather.wind?.deg == null ? "N/A" : `${weather.wind.deg}°`;
      const visibility = weather.visibility == null ? "N/A" : (weather.visibility / 1000).toFixed(1);
      const sunrise = weather.sys?.sunrise ? new Date(weather.sys.sunrise * 1000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "N/A";
      const sunset = weather.sys?.sunset ? new Date(weather.sys.sunset * 1000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "N/A";

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle(`🌤️ Thời tiết tại ${areaName}`)
        .setDescription(country ? `**${areaName}, ${country}**\n${description}` : `**${areaName}**\n${description}`)
        .addFields(
          {
            name: "🌡️ Hiện tại",
            value: formatStats([
              `Nhiệt độ: ${current.temp}°C`,
              `Cảm giác: ${current.feels_like}°C`,
              `Độ ẩm: ${current.humidity}%`,
            ]),
            inline: true,
          },
          {
            name: "💨 Điều kiện",
            value: formatStats([
              `Gió: ${windSpeed} km/h`,
              `Hướng gió: ${windDirection}`,
              `Tầm nhìn: ${visibility} km`,
              `Áp suất: ${current.pressure} hPa`,
            ]),
            inline: true,
          },
          {
            name: "📅 Hôm nay",
            value: formatStats([
              `Nhiệt độ cao nhất: ${current.temp_max}°C`,
              `Nhiệt độ thấp nhất: ${current.temp_min}°C`,
              `Mặt trời mọc: ${sunrise}`,
              `Mặt trời lặn: ${sunset}`,
            ]),
            inline: false,
          }
        )
        .setFooter({ text: "Nguồn: OpenWeatherMap" })
        .setTimestamp();

      await replyInteraction(interaction, { embeds: [embed] });
    } catch (error) {
      console.error("Weather command error:", error);
      await replyInteraction(interaction, { embeds: [createErrorEmbed(error.message)], flags: 64 });
    }
  },
};
