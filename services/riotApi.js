const cache = require("../utils/cache");
const { request } = require("../utils/http");

const PLATFORM_HOSTS = {
  BR1: "br1",
  EUN1: "eun1",
  EUW1: "euw1",
  JP1: "jp1",
  KR: "kr",
  LA1: "la1",
  LA2: "la2",
  NA1: "na1",
  OC1: "oc1",
  PH2: "ph2",
  SG2: "sg2",
  TH2: "th2",
  TW2: "tw2",
  VN1: "vn1",
  VN2: "vn2",
  RU: "ru",
  TR1: "tr1",
};

const MATCH_REGIONS = {
  BR1: "americas",
  LA1: "americas",
  LA2: "americas",
  NA1: "americas",
  OC1: "americas",
  EUN1: "europe",
  EUW1: "europe",
  RU: "europe",
  TR1: "europe",
  KR: "asia",
  JP1: "asia",
  PH2: "asia",
  SG2: "asia",
  TH2: "asia",
  TW2: "asia",
  VN1: "americas",
  VN2: "americas",
};

// Account API regional routing (for account-v1 endpoints)
const ACCOUNT_REGIONS = {
  BR1: "americas",
  LA1: "americas",
  LA2: "americas",
  NA1: "americas",
  OC1: "americas",
  EUN1: "europe",
  EUW1: "europe",
  RU: "europe",
  TR1: "europe",
  KR: "asia",
  JP1: "asia",
  PH2: "asia",
  SG2: "asia",
  TH2: "asia",
  TW2: "asia",
  VN1: "asia",
  VN2: "asia",
};

class RiotApi {
  constructor(apiKey, platform) {
    this.apiKey = String(apiKey || "").trim();
    if (!this.apiKey) {
      throw new Error("Chưa cấu hình RIOT_API_KEY trong file .env.");
    }
    this.platform = platform ? platform.toUpperCase() : null;
    const platformHost = PLATFORM_HOSTS[this.platform];
    if (!platformHost) {
      throw new Error("Server Riot không hợp lệ.");
    }
    this.baseUrl = `https://${platformHost}.api.riotgames.com`;
    this.matchUrlBase = `https://${MATCH_REGIONS[this.platform]}.api.riotgames.com`;
    
    // Account API uses regional routing (americas, asia, europe)
    const accountRegion = ACCOUNT_REGIONS[this.platform];
    this.accountUrlBase = `https://${accountRegion}.api.riotgames.com`;
  }

  async getAccountByRiotId(gameName, tagLine) {
    if (!gameName || !tagLine) throw new Error("Định dạng Riot ID không hợp lệ. Ví dụ: Hide on bush#KR1");

    // Use regional account endpoint instead of hardcoded americas
    const url = `${this.accountUrlBase}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    return this.fetchJson(url);
  }

  async getAccountByPuuid(puuid) {
    if (!puuid) throw new Error("PUUID không hợp lệ.");

    const cacheKey = `account:${puuid}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Use regional account endpoint
    const url = `${this.accountUrlBase}/riot/account/v1/accounts/by-puuid/${puuid}`;
    const result = await this.fetchJson(url);
    cache.set(cacheKey, result, 1800000);
    return result;
  }

  async getSummonerByName(gameName) {
    if (!gameName) throw new Error("Tên người chơi không hợp lệ.");

    // VN2 doesn't support name lookup
    if (this.platform === "VN2") {
      throw new Error(
        "❌ Server VN2 không hỗ trợ tra cứu theo tên.\n\n" +
        "📝 Hãy sử dụng Riot ID đầy đủ (Tên#Tag):\n" +
        "Ví dụ: `/lol player riot-id:Funk Thanks Door#MIXII tag:VN2`"
      );
    }

    const url = `${this.baseUrl}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(gameName)}`;
    try {
      return await this.fetchJson(url);
    } catch (error) {
      throw error;
    }
  }

  async getPlayer(gameName, tagLine) {
    // Cache key includes both name and tagline
    const cacheKey = `player:${gameName}:${tagLine || ""}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let result;
    if (tagLine) {
      const account = await this.getAccountByRiotId(gameName, tagLine);
      const summoner = await this.getSummonerByPuuid(account.puuid);
      result = { account, summoner };
    } else {
      const summoner = await this.getSummonerByName(gameName);
      result = { account: null, summoner };
    }

    // Cache for 30 minutes
    cache.set(cacheKey, result, 1800000);
    return result;
  }

  async fetchJson(url) {
    const response = await request(url, {
      headers: {
        "X-Riot-Token": this.apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error(
          "❌ Lỗi API Key: Riot API key không hợp lệ hoặc đã hết hạn.\n" +
          "Hãy:\n" +
          "1. Truy cập https://developer.riotgames.com\n" +
          "2. Tạo hoặc tái tạo API key mới\n" +
          "3. Cập nhật RIOT_API_KEY trong file .env"
        );
      }
      
      if (response.status === 403) {
        if (this.platform === "VN2") {
          throw new Error(
            "❌ Server VN2 không hỗ trợ API này.\n" +
            "Vui lòng sử dụng Riot ID đầy đủ (Tên#Tag) và chỉ định server."
          );
        }
        throw new Error(`❌ Không có quyền truy cập (403). Server ${this.platform} có thể không hỗ trợ API này.`);
      }
      
      if (response.status === 404) {
        throw new Error(
          "❌ Không tìm thấy người chơi. Hãy kiểm tra chính xác Tên#Tag và server đã chọn. " +
          "Ví dụ: CuongHuongNoi#2104 với server VN2."
        );
      }
      
      if (response.status === 429) {
        throw new Error("⏱️ API đang bị giới hạn tần suất. Vui lòng thử lại sau vài giây.");
      }
      
      throw new Error(`Request thất bại (${response.status}): ${text}`);
    }

    return response.json();
  }

  async getSummonerByPuuid(puuid) {
    const url = `${this.baseUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    return this.fetchJson(url);
  }

  async getLeagueBySummonerId(summonerId) {
    const cacheKey = `league:${summonerId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/lol/league/v4/entries/by-summoner/${summonerId}`;
    const result = await this.fetchJson(url);
    
    // Cache for 30 minutes
    cache.set(cacheKey, result, 1800000);
    return result;
  }

  async getLeagueByPuuid(puuid) {
    if (!puuid) throw new Error("PUUID không hợp lệ.");

    const cacheKey = `league-puuid:${puuid}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;
    const result = await this.fetchJson(url);
    cache.set(cacheKey, result, 1800000);
    return result;
  }

  async getCurrentGame(puuid) {
    if (!puuid) throw new Error("PUUID không hợp lệ.");

    const url = `${this.baseUrl}/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`;
    return this.fetchJson(url);
  }

  async getChampionMasteries(puuid) {
    if (!puuid) throw new Error("PUUID không hợp lệ.");
    const cacheKey = `masteries:${puuid}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    const url = `${this.baseUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}/top?count=5`;
    const result = await this.fetchJson(url);
    cache.set(cacheKey, result, 300000);
    return result;
  }

  async getMatches(puuid, count = 5) {
    const cacheKey = `matches:${puuid}:${count}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const url = `${this.matchUrlBase}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
    const result = await this.fetchJson(url);
    
    // Cache for 5 minutes
    cache.set(cacheKey, result, 300000);
    return result;
  }

  async getMatch(matchId) {
    const cacheKey = `match:${matchId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const url = `${this.matchUrlBase}/lol/match/v5/matches/${matchId}`;
    const result = await this.fetchJson(url);
    
    // Cache for 24 hours (match data doesn't change)
    cache.set(cacheKey, result, 86400000);
    return result;
  }

  /**
   * Format match duration from seconds to MM:SS
   * @param {number} seconds - Duration in seconds
   * @returns {string} - Formatted duration
   */
  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Get KDA from participant data
   * @param {object} participant - Match participant data
   * @returns {string} - KDA string
   */
  getKDA(participant) {
    return `${participant.kills ?? 0}/${participant.deaths ?? 0}/${participant.assists ?? 0}`;
  }

  /**
   * Get CS per minute
   * @param {object} participant - Match participant data
   * @param {number} gameDuration - Game duration in seconds
   * @returns {string} - CS/min
   */
  getCSPerMin(participant, gameDuration) {
    const cs = (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0);
    const minutes = gameDuration / 60;
    if (!Number.isFinite(minutes) || minutes <= 0) return "N/A";
    return (cs / minutes).toFixed(1);
  }

  /**
   * Get rank tier display
   * @param {object} league - League entry data
   * @returns {string} - Formatted tier and rank
   */
  getRankDisplay(league) {
    if (!league) return "Unranked";
    const tier = league.tier.charAt(0) + league.tier.slice(1).toLowerCase();
    return `${tier} ${league.rank}`;
  }
}

module.exports = RiotApi;
