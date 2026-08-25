# 🚀 Setup Guide - LOL Discord Bot

Complete step-by-step guide to set up and run the LOL Discord Bot with all enhancements.

## 📋 Prerequisites

- **Node.js**: Version 16.9.0 or higher ([Download](https://nodejs.org))
- **Discord Account**: With bot management permissions
- **Riot API Key**: From [Riot Developer Portal](https://developer.riotgames.com)
- **Text Editor**: VS Code, Notepad++, or any text editor

## 🔑 Getting API Keys

### 1. Discord Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name (e.g., "LOL Bot")
4. Go to "Bot" tab
5. Click "Add Bot"
6. Under TOKEN, click "Copy" to copy your bot token
7. Save it for later

### 2. Configure Bot Permissions

1. In Developer Portal, go to "OAuth2" > "URL Generator"
2. Select Scopes: `bot`
3. Select Permissions:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Read Message History
   - ✅ Read Messages/View Channels
4. Copy the generated URL and open it
5. Select your server and authorize

### 3. Get Client ID

1. In Developer Portal, go to "General Information"
2. Copy the "APPLICATION ID" (Client ID)
3. Save it for later

### 4. Riot API Key

1. Go to [Riot Developer Portal](https://developer.riotgames.com)
2. Sign in with your Riot account
3. Create a new API key
4. Copy the API key
5. Save it for later

## 📁 Installation Steps

### Step 1: Prepare the Project

```bash
# Navigate to the bot directory
cd "Bot discord/Liên Minh Huyền Thoai"

# Install dependencies
npm install
```

### Step 2: Create Environment File

Create a `.env` file in the bot directory with your credentials:

```env
DISCORD_TOKEN=your_discord_bot_token_here
RIOT_API_KEY=your_riot_api_key_here
WEATHER_API_KEY=your_openweathermap_api_key_here
ESPORTS_API_KEY=your_lolesports_api_key_here
CLIENT_ID=your_bot_client_id_here
GUILD_ID=your_guild_id_here
```

**Example:**
```env
DISCORD_TOKEN=MTk4NjIyNDgzNTQ0OTI4MzI0.Clwa7A.You1uCoEL5r9Yf0xwcZQtPZHaM
RIOT_API_KEY=RGAPI-abc123def456-ghi789jkl012
CLIENT_ID=1234567890
GUILD_ID=9876543210
```

### Step 3: Deploy Commands

Deploy commands to Discord:

```bash
npm run deploy
```

You should see:
```
Registering slash commands...
Slash commands registered for guild.
```

Or if no GUILD_ID:
```
Slash commands registered globally.
```

**Note**: Global commands may take up to 1 hour to appear in Discord.

### Step 4: Start the Bot

```bash
npm start
```

You should see:
```
✅ Logged in as BotName#0000
🔗 Bot is ready and listening for commands...
```

## ✅ Verification

### Test in Discord

1. In any Discord server where you added the bot
2. Type `/lol ` and you should see the subcommands:
   - player
   - rank
   - matches
   - champion
   - build
   - counter
   - stats
   - abilities

3. Try a command:
```
/lol player riot-id:Hide on bush#KR1 tag:KR
```

### Test Output

You should see an embed with player information appearing in Discord.

## 🔧 Configuration

### Custom Cooldowns

Edit each command file to adjust cooldown times:

**`commands/lol/player.js`**
```javascript
const COOLDOWN_MS = 3000; // Change this value (in milliseconds)
```

### Custom Build Data

Edit build recommendations in `commands/lol/build.js`:

```javascript
const BUILD_DATA = {
  default: {
    start: ["Doran's Ring", "Health Potion"],
    core: ["Luden's Companion", "Shadowflame", "Rabadon's Deathcap"],
    boots: "Sorcerer's Shoes",
    runes: {
      primary: "Electrocute",
      secondary: "Precision",
      shards: ["Attack Speed", "Adaptive Force", "Magic Resist"],
    },
  },
};
```

### Cache Settings

Modify cache TTL in `services/riotApi.js`:

```javascript
// Change the TTL (Time To Live) values
cache.set(cacheKey, result, 1800000); // 30 minutes
```

## 📊 Monitoring the Bot

### View Logs

The bot will output logs in the console:

```
✅ Logged in as BotName#0000
📤 Command: /lol player | User: Username#0000
✅ Success response sent
❌ Error: Player not found
```

### Debugging

If you encounter issues:

1. **Check the console for error messages**
2. **Verify credentials in `.env` file**
3. **Check Riot API key validity**
4. **Ensure bot has permissions in channel**

## 🐛 Troubleshooting

### "Không tìm thấy Discord token"
**Solution**: 
- Check `.env` file exists in correct directory
- Verify DISCORD_TOKEN value is correct (no extra spaces)

### Command not appearing
**Solution**:
- Run `npm run deploy` again
- Wait up to 1 hour for global commands
- If using GUILD_ID, check it's correct

### "Request thất bại (401)"
**Solution**:
- Verify RIOT_API_KEY is correct in `.env`
- Check API key hasn't expired
- Regenerate API key from Riot Developer Portal

### "Server Riot không hợp lệ"
**Solution**:
- Use supported server: VN1, VN2, KR, NA1, EUW1, etc.
- For VN2, use full Riot ID format (Name#Tag)

### Bot doesn't respond
**Solution**:
1. Check bot is logged in (see console)
2. Check bot has channel permissions
3. Wait 1 hour for global command registration
4. Restart bot with `npm start`

## 📈 Performance Tips

### Optimize Cache
The bot automatically caches:
- Player data: 30 minutes
- League ranks: 30 minutes
- Matches: 5 minutes
- Match details: 24 hours
- Champion info: 24 hours

To reduce API calls further, increase cache TTL in `riotApi.js`.

### Rate Limiting
Default cooldowns prevent command spam:
- Player command: 3 seconds
- Rank command: 3 seconds
- Matches command: 3 seconds
- Champion commands: 2 seconds

Adjust in respective command files if needed.

## 🔄 Updating the Bot

### To Update to Latest Version

```bash
# Stop the bot (Ctrl+C in terminal)

# Backup your .env file (important!)
cp .env .env.backup

# Get latest files (replace bot files)

# Reinstall dependencies
npm install

# Restart bot
npm start
```

## 📚 Example Commands

### Get Player Info
```
/lol player riot-id:CuongHuongNoi#2104 tag:VN2
```

### Get Player Rank
```
/lol rank riot-id:Hide on bush#KR1 tag:KR
```

### View Recent Matches
```
/lol matches riot-id:Faker#NA1 tag:NA
```

### Champion Information
```
/lol champion name:Yasuo
```

### Champion Abilities
```
/lol abilities name:Ahri
```

### Recommended Build
```
/lol build champion:Azir
```

### Counter Information
```
/lol counter champion:Sylas
```

### Champion Statistics
```
/lol stats champion:Akali
```

## 🆘 Getting Help

### Console Logging
The bot logs all activities:
- Command execution
- API requests
- Errors with details
- Startup information

Watch the console for error messages.

### Common Issues

| Issue | Solution |
|-------|----------|
| Bot doesn't start | Check Node.js version, verify `.env` file |
| "No token found" | Ensure `.env` exists with DISCORD_TOKEN |
| "Invalid API key" | Verify RIOT_API_KEY in `.env` |
| Slow responses | Cache is working; wait for data to populate |
| Cooldown errors | This is normal; cooldown prevents API abuse |

## ✨ Next Steps

1. **Test all commands** - Try each command to ensure it works
2. **Customize builds** - Edit build recommendations for your meta
3. **Set up monitoring** - Watch console logs for issues
4. **Join support servers** - Get help from community

## 🎯 Advanced Configuration

### Custom Runes
Edit build data to include your preferred rune setups:

```javascript
runes: {
  primary: "Electrocute",
  secondary: "Precision",
  shards: ["Adaptive Force", "Attack Speed", "Magic Resist"],
}
```

### Multi-Language
The bot supports Vietnamese and English. Modify embeds in command files.

### External API Integration
Connect to Champion.gg or U.gg for real-time stats:

1. Get API key from external service
2. Update `services/` files with API calls
3. Implement caching for performance

---

**Setup Complete!** 🎉

Your LOL Discord Bot is now ready to use. Start using commands and monitoring logs!

For more information, see [README.md](./README.md) and [CHANGELOG.md](./CHANGELOG.md).
