const cache = require("../utils/cache");
const { request } = require("../utils/http");

class DataDragon {
  constructor() {
    this.baseUrl = "https://ddragon.leagueoflegends.com";
  }

  async getLatestVersion() {
    const cacheKey = "ddragon:version";
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const response = await request(`${this.baseUrl}/api/versions.json`);
    if (!response.ok) throw new Error("Không thể lấy version Data Dragon.");
    
    const versions = await response.json();
    // Cache version for 24 hours
    cache.set(cacheKey, versions, 86400000);
    return versions;
  }

  async getChampionData(championName) {
    const versions = await this.getLatestVersion();
    const version = versions[0];
    const cacheKey = `ddragon:champion:${version}`;
    
    let championData = cache.get(cacheKey);
    if (!championData) {
      const response = await request(`${this.baseUrl}/cdn/${version}/data/en_US/champion.json`);
      if (!response.ok) throw new Error(`Không thể lấy danh sách tướng ${championName}.`);
      championData = await response.json();
      // Cache for 24 hours
      cache.set(cacheKey, championData, 86400000);
    }

    const normalizedInput = championName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
    const championEntry = Object.values(championData.data || {}).find((entry) => {
      const aliases = [entry.id, entry.name, entry.title, entry.key]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ""));
      return aliases.includes(normalizedInput);
    });

    if (!championEntry) throw new Error(`Không tìm thấy tướng ${championName}.`);

    const detailCacheKey = `ddragon:champion-detail:${version}:${championEntry.id}`;
    let championDetail = cache.get(detailCacheKey);
    if (!championDetail) {
      const response = await request(
        `${this.baseUrl}/cdn/${version}/data/en_US/champion/${championEntry.id}.json`
      );
      if (!response.ok) throw new Error(`Không thể lấy chi tiết tướng ${championEntry.name}.`);
      const detailData = await response.json();
      championDetail = detailData.data?.[championEntry.id];
      cache.set(detailCacheKey, championDetail, 86400000);
    }

    return { version, champion: championDetail || championEntry };
  }

  async getChampionList() {
    const versions = await this.getLatestVersion();
    const version = versions[0];
    const cacheKey = `ddragon:champion:${version}`;
    let championData = cache.get(cacheKey);

    if (!championData) {
      const response = await request(`${this.baseUrl}/cdn/${version}/data/en_US/champion.json`);
      if (!response.ok) throw new Error("Không thể lấy danh sách tướng.");
      championData = await response.json();
      cache.set(cacheKey, championData, 86400000);
    }

    return Object.values(championData.data || {});
  }

  /**
   * Get champion abilities
   * @param {string} championName - Champion name
   * @returns {object} - Champion abilities data
   */
  async getChampionAbilities(championName) {
    const { version, champion } = await this.getChampionData(championName);
    
    if (!champion.spells) {
      throw new Error("Không tìm thấy dữ liệu kỹ năng cho tướng này.");
    }

    return {
      championName: champion.name,
      passive: {
        name: champion.passive.name,
        description: champion.passive.description,
      },
      abilities: champion.spells.map((spell, index) => ({
        slot: ["Q", "W", "E", "R"][index],
        name: spell.name,
        description: spell.description,
      })),
    };
  }

  /**
   * Get item information
   * @param {string} itemName - Item name or ID
   * @returns {object} - Item data
   */
  async getItemData(itemName) {
    const versions = await this.getLatestVersion();
    const version = versions[0];
    const cacheKey = `ddragon:items:${version}`;

    let itemsData = cache.get(cacheKey);
    if (!itemsData) {
      const response = await request(`${this.baseUrl}/cdn/${version}/data/en_US/item.json`);
      if (!response.ok) throw new Error("Không thể lấy danh sách vật phẩm.");
      itemsData = await response.json();
      cache.set(cacheKey, itemsData, 86400000);
    }

    const normalizedInput = itemName.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const itemEntry = Object.entries(itemsData.data || {}).find(([id, item]) => {
      const nameMatch = (item.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
      return nameMatch.includes(normalizedInput) || normalizedInput.includes(nameMatch);
    });

    if (!itemEntry) {
      throw new Error(`Không tìm thấy vật phẩm "${itemName}".`);
    }

    const [itemId, itemData] = itemEntry;
    return {
      id: itemId,
      name: itemData.name,
      description: itemData.description,
      plaintext: itemData.plaintext,
      image: `${this.baseUrl}/cdn/${version}/img/item/${itemId}.png`,
    };
  }
}

module.exports = DataDragon;
