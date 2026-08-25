# 📖 Quick Reference - LOL Discord Bot

Quick commands and feature reference for the enhanced bot.

## 🎮 Commands Quick Start

### Player Lookup
```
/lol player riot-id:PlayerName#TagLine tag:SERVER
```
Shows player level, ranks, and account info.

### View Rank
```
/lol rank riot-id:PlayerName#TagLine tag:SERVER
```
Displays Solo/Duo rank with LP and win rate.

### Recent Matches
```
/lol matches riot-id:PlayerName#TagLine tag:SERVER
```
Shows 5 recent matches with KDA, CS/min, gold, duration.

### Champion Info
```
/lol champion name:ChampionName
```
Displays champion role, difficulty, and lore.

### Champion Abilities
```
/lol abilities name:ChampionName
```
Shows all abilities (Passive, Q, W, E, R) with descriptions.

### Recommended Build
```
/lol build champion:ChampionName
```
Provides item build, boots, and rune recommendations.

### Counter Champions
```
/lol counter champion:ChampionName
```
Lists top counters with win rates and tips.

### Meta Statistics
```
/lol stats champion:ChampionName
```
Shows pick rate, ban rate, win rate, and role statistics.

## 🌍 Supported Servers

| Region | Tag |
|--------|-----|
| Vietnam 2 | VN2 |
| Vietnam 1 | VN1 |
| Korea | KR |
| North America | NA1 |
| Europe West | EUW1 |
| Europe Nordic | EUNE1 |
| Japan | JP1 |
| Singapore | SG2 |
| Thailand | TH2 |
| Philippines | PH2 |
| Taiwan | TW2 |
| Brazil | BR1 |
| Latin America 1 | LA1 |
| Latin America 2 | LA2 |
| Oceania | OC1 |
| Turkey | TR1 |
| Russia | RU |

**Note for VN2**: Use full Riot ID format (Name#Tag)

## ⏱️ Cooldowns

Each command has a cooldown to prevent API abuse:

- **Player**: 3 seconds
- **Rank**: 3 seconds
- **Matches**: 3 seconds
- **Champion**: 2 seconds
- **Abilities**: 2 seconds
- **Build**: 2 seconds
- **Counter**: 2 seconds
- **Stats**: 2 seconds

You'll see this message when on cooldown:
```
⏱️ Lệnh `command-name` đang trên cooldown.
Vui lòng thử lại sau X giây.
```

## 💾 Caching Benefits

The bot automatically caches data to improve performance:

| Data | Cache Duration |
|------|-----------------|
| Player info | 30 minutes |
| Rank data | 30 minutes |
| Match IDs | 5 minutes |
| Match details | 24 hours |
| Champion info | 24 hours |

This means:
- ✅ Faster responses
- ✅ Fewer API calls
- ✅ Better reliability
- ✅ Reduced rate limiting

## 🎯 Tips & Tricks

### Getting Player Stats
1. Use full Riot ID for best results: `Name#Tag`
2. Include server tag for VN2
3. Examples:
   - `CuongHuongNoi#2104` for VN1/VN2
   - `Hide on bush#KR1` for KR

### Building Strategies
1. Check **Build** for recommended items
2. Check **Counter** to understand threats
3. Check **Stats** to see meta trends
4. Check **Abilities** to understand matchups

### Following the Meta
1. Use **Stats** to see current meta
2. Check **Counter** for threat assessment
3. Use **Build** for current optimal items
4. Monitor recent patches for changes

## 🆘 Troubleshooting

### Player Not Found
- **Issue**: "Người chơi không tìm thấy"
- **Fix**: 
  - Double-check spelling
  - Use full Riot ID (Name#Tag)
  - For VN2, must use full format

### Server Not Supported
- **Issue**: "Server Riot không hợp lệ"
- **Fix**:
  - Use supported server codes
  - VN2 may have limited support
  - Try with another server

### Command on Cooldown
- **Issue**: "Lệnh đang trên cooldown"
- **Fix**:
  - Wait the indicated time
  - This prevents API abuse
  - Try a different command

### No Match Data
- **Issue**: "Không có trận nào gần đây"
- **Fix**:
  - Player may not have played recently
  - Try another player
  - Check Riot API is working

## 📊 Data Explanation

### KDA Display
```
KDA: 5/2/10
Meaning: 5 Kills, 2 Deaths, 10 Assists
```

### CS/min
```
CS/min: 5.2
Meaning: Average 5.2 minions killed per minute
```

### Win Rate
```
Win Rate: 52.5%
Meaning: Player won 52.5% of games played
```

### LP (League Points)
```
123 LP
Meaning: League Points progress to next rank
```

### Pick/Ban Rate
```
Pick Rate: 7.2%
Meaning: Champion selected in 7.2% of games
Ban Rate: 4.8%
Meaning: Champion banned in 4.8% of games
```

## 🔄 Updating Commands

Commands are deployed via:
```bash
npm run deploy
```

Changes take effect:
- **Guild commands**: Immediately
- **Global commands**: Up to 1 hour

## 📝 Error Messages Guide

| Error | Meaning | Solution |
|-------|---------|----------|
| "Người chơi không tìm thấy" | Player not found | Check spelling, use full Riot ID |
| "Server Riot không hợp lệ" | Invalid server | Use supported server code |
| "Không tìm thấy tướng" | Champion not found | Check spelling, use English name |
| "Lệnh đang trên cooldown" | Command cooling down | Wait before retrying |
| "Có lỗi xảy ra" | API error | Bot encountered issue, try again |

## 🌟 Feature Highlights

### New in v1.1.0

✨ **Abilities Command** - View detailed ability descriptions
⚡ **Caching System** - Up to 70% fewer API calls
🛡️ **Rate Limiting** - Prevents command abuse
📊 **Enhanced Stats** - Role-based statistics
💰 **Match Details** - CS/min, gold, formatted duration
📈 **Win Rate Calc** - Automatic W/L calculation

## 🎓 Learning Path

### Beginner
1. Try `/lol champion name:Garen`
2. Try `/lol build champion:Garen`
3. Try `/lol stats champion:Garen`

### Intermediate
1. Look up your own player: `/lol player riot-id:YourName#Tag`
2. Check your recent matches: `/lol matches riot-id:YourName#Tag`
3. Check your rank: `/lol rank riot-id:YourName#Tag`

### Advanced
1. Research matchups using `/lol counter` and `/lol abilities`
2. Compare builds and counters
3. Track win rates across patches

## 🔗 Useful Links

- [League of Legends](https://www.leagueoflegends.com)
- [Riot API Docs](https://developer.riotgames.com)
- [Data Dragon](https://ddragon.leagueoflegends.com)
- [Champion.gg](https://champion.gg)
- [U.gg](https://u.gg)

## 📞 Support

For issues:
1. Check error message carefully
2. Review troubleshooting section
3. Verify credentials in `.env`
4. Check console logs

---

**Need more help?** See [README.md](./README.md), [SETUP.md](./SETUP.md), or [CHANGELOG.md](./CHANGELOG.md)
