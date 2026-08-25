# 🎮 LOL Discord Bot - Rồng Lộn TV

Advanced League of Legends Discord bot with real-time player statistics, match history, champion information, and meta insights.

## ✨ Features

### 📊 Player Commands
- **`/lol player`** - Get detailed player information including level, rank, and account info
- **`/lol rank`** - Display Solo/Duo rank with LP, wins/losses, and win rate statistics
- **`/lol matches`** - Show recent 5 matches with KDA, CS/min, gold earned, and match duration

### 🦸 Champion Commands
- **`/lol champion`** - View champion details, roles, difficulty, and lore
- **`/lol abilities`** - Display all champion abilities (Passive, Q, W, E, R) with descriptions
- **`/lol build`** - Get recommended item builds with runes and boots
- **`/lol counter`** - Show top counter champions with win rates and tips
- **`/lol stats`** - Display meta statistics including pick rate, ban rate, win rate, and role breakdowns

## 🚀 New Enhancements

### Performance & Optimization
- ✅ **Caching System**: Reduces API calls with intelligent caching (TTL-based)
  - Player data: 30 minutes
  - Match data: 5 minutes  
  - Champion data: 24 hours
  
- ✅ **Rate Limiting & Cooldowns**: Prevents API abuse
  - Per-user command cooldowns
  - Global command rate limiting
  - Configurable cooldown periods

### Better Data & Information
- ✅ **Enhanced Match Display**: Shows CS/min, gold, and formatted duration
- ✅ **Win Rate Calculations**: Automatic W/L ratio and win percentage
- ✅ **Role-Based Statistics**: Pick rates and win rates by position
- ✅ **Better Error Messages**: User-friendly error handling and suggestions
- ✅ **Champion Abilities**: Full ability descriptions and passive information

### Code Quality
- ✅ **Improved Error Handling**: Better error messages and recovery
- ✅ **Logging System**: Console logging for debugging and monitoring
- ✅ **Helper Methods**: Utility functions for data formatting
  - `formatDuration()`: Convert seconds to MM:SS format
  - `getKDA()`: Format KDA string
  - `getCSPerMin()`: Calculate CS per minute
  - `getRankDisplay()`: Format rank tier and division

- ✅ **Enhanced Embeds**: Better visual formatting with timestamps and footers
- ✅ **Input Validation**: Better handling of user input and edge cases

## 📦 New Utility Files

### `/utils/cache.js`
Singleton cache manager with TTL support
```javascript
const cache = require("./utils/cache");
cache.set("key", value, 3600000); // 1 hour TTL
const value = cache.get("key");
```

### `/utils/cooldown.js`
Command cooldown and rate limiting manager
```javascript
const cooldownManager = require("./utils/cooldown");
const cooldown = cooldownManager.checkCooldown(userId, commandName, 3000);
if (cooldown.isOnCooldown) {
  // User is on cooldown
}
```

### `/utils/embed.js` (Enhanced)
Embed builder helpers for consistent UI
```javascript
const { createErrorEmbed, createCooldownEmbed } = require("./utils/embed");
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 16.9.0 or higher
- Discord Bot Token
- Riot API Key

### Installation

1. **Clone or Download the Bot**
```bash
cd "Bot discord/Liên Minh Huyền Thoai"
npm install
```

2. **Set Up Environment Variables**
Create `.env` file:
```env
DISCORD_TOKEN=your_discord_bot_token
RIOT_API_KEY=your_riot_api_key
WEATHER_API_KEY=your_openweathermap_api_key
ESPORTS_API_KEY=your_lolesports_api_key
CLIENT_ID=your_bot_client_id
GUILD_ID=your_guild_id (optional for testing)
```

3. **Deploy Commands**
```bash
npm run deploy
```

4. **Start the Bot**
```bash
npm start
```

## 📋 Configuration

### Cooldown Settings
Edit command files to adjust cooldown times (in milliseconds):
```javascript
const COOLDOWN_MS = 3000; // 3 seconds
```

### Cache TTL
Adjust cache expiration in `services/riotApi.js`:
```javascript
cache.set(cacheKey, result, 1800000); // 30 minutes
```

### Build Data
Customize builds in `/commands/lol/build.js`:
```javascript
const BUILD_DATA = {
  default: {
    start: ["Item1", "Item2"],
    core: ["Item3", "Item4"],
    // ...
  }
};
```

## 🎯 Server Support

- **Vietnam**: VN1, VN2
- **Korea**: KR
- **North America**: NA1
- **Europe**: EUW1, EUNE1
- **Asia-Pacific**: JP1, SG2, TH2, PH2, TW2, OC1
- **Latin America**: LA1, LA2
- **Brazil**: BR1
- **Turkey**: TR1
- **Russia**: RU

## 📊 API Limitations

### Automatic Game Notifications
- Patch, balance, and skin channels are checked once per day and receive messages only when the patch version changes.
- The eSports channel is checked hourly and receives messages only when the upcoming match list or its details change.
- Notification state is stored in `.game-notifications.json` to prevent duplicate messages after restart.

### Riot API Constraints
- **VN2 Server**: Limited summoner endpoint - requires full Riot ID format (Name#Tag)
- **Rate Limiting**: Riot API has strict rate limits - bot includes caching to minimize calls
- **Proactive throttling**: Riot requests are queued by route before sending, using the documented limits for account, summoner, league, match, and spectator APIs
- **Multiple instances**: The limiter is process-local. Use one bot instance or move the limiter state to Redis before running multiple replicas
- **Availability**: Some servers may have limited Riot API endpoint support
- **Meta data**: Build, counter, and stats currently use reference templates, not live ranked data.

## 🔍 Troubleshooting

### Command Not Responding
1. Check if bot has permissions in the channel
2. Verify Riot API key is valid
3. Check console for error messages
4. Ensure Discord token is correct

### "Server Not Supported" Error
- Some regions have limited Riot API support
- Try using a different server or full Riot ID format

### Cooldown Messages
- Bot includes built-in cooldown system to prevent abuse
- User-friendly messages show remaining cooldown time

## 📝 Recent Changes

### v1.1.0 - Enhanced Features
- Added caching system with TTL support
- Implemented per-user cooldowns and rate limiting
- Enhanced match display with CS/min and gold stats
- Added champion abilities command
- Improved error messages and logging
- Added win rate calculations
- Better embed formatting with timestamps

## 🐛 Known Issues

- VN2 server has limited API support from Riot
- Some champion abilities may have shortened descriptions due to Discord embed limits
- Build and counter data are currently based on templates (can be integrated with external APIs)
- Stats data is currently based on a reference template and should not be treated as live patch statistics

## 🤝 Future Enhancements

- [ ] Integration with Champion.gg or U.gg for live meta data
- [ ] Role-specific build recommendations
- [ ] Advanced matchup statistics
- [ ] Ban phase analyzer
- [ ] Patch notes integration
- [ ] Team composition analyzer
- [ ] Streaming status indicator
- [ ] Leaderboard command

## 📚 Dependencies

- **discord.js**: ^14.16.0 - Discord API wrapper
- **node-fetch**: ^3.3.2 - HTTP client for API calls
- **dotenv**: ^16.4.0 - Environment variable management

## 📄 License

This project is for educational purposes.

## 👨‍💻 Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs for error details
3. Verify all environment variables are set correctly

---

**Rồng Lộn TV** - Your personal LOL assistant! 🐉
