const SERVER_ALIASES = {
  EUNE: "EUN1",
  EUW: "EUW1",
  OCE: "OC1",
  LAS: "LA2",
  LAN: "LA1",
  NA: "NA1",
  BR: "BR1",
  KR1: "KR",
  TW: "TW2",
  TH: "TH2",
  PH: "PH2",
  SG: "SG2",
  VN: "VN1",
  AP: "JP1",
};

const VALID_SERVERS = new Set([
  "BR1",
  "EUN1",
  "EUW1",
  "JP1",
  "KR",
  "LA1",
  "LA2",
  "NA1",
  "OC1",
  "PH2",
  "SG2",
  "TH2",
  "TW2",
  "VN1",
  "VN2",
  "TR1",
  "RU",
]);

function normalizeServerTag(tag) {
  if (!tag) return null;
  const value = tag.trim().toUpperCase();
  if (!value) return null;
  return SERVER_ALIASES[value] || value;
}

function assertValidServerTag(tag) {
  if (!tag || !VALID_SERVERS.has(tag)) {
    throw new Error(
      "Server không hợp lệ. Vui lòng chọn server hợp lệ hoặc nhập Riot ID đầy đủ, ví dụ: CuongHuongNoi#VN2"
    );
  }
  return tag;
}

function parseRiotId(rawInput, serverOption) {
  if (!rawInput || typeof rawInput !== "string") {
    throw new Error("Vui lòng nhập tên người chơi Riot ID.");
  }

  const trimmedInput = rawInput.trim();
  if (!trimmedInput) {
    throw new Error("Vui lòng nhập tên người chơi Riot ID.");
  }

  const selectedServer = serverOption ? normalizeServerTag(serverOption) : null;
  const hashIndex = trimmedInput.lastIndexOf("#");
  let gameName = trimmedInput;
  let tagLine = null;
  let server = selectedServer;

  if (hashIndex >= 0) {
    const maybeName = trimmedInput.slice(0, hashIndex).trim();
    const maybeTag = trimmedInput.slice(hashIndex + 1).trim();

    if (!maybeName || !maybeTag) {
      throw new Error("Riot ID không hợp lệ. Hãy nhập dạng CuongHuongNoi#2104 hoặc chỉ CuongHuongNoi kèm server VN2.");
    }

    const normalizedMaybeTag = normalizeServerTag(maybeTag);
    gameName = maybeName;

    if (selectedServer) {
      tagLine = maybeTag;
      server = selectedServer;
    } else if (normalizedMaybeTag && VALID_SERVERS.has(normalizedMaybeTag)) {
      server = normalizedMaybeTag;
    } else {
      tagLine = maybeTag;
    }
  }

  if (!server) {
    throw new Error(
      "Không thể xác định server. Hãy chọn server hoặc nhập Riot ID đầy đủ gồm server, ví dụ: CuongHuongNoi#VN2. Nếu sử dụng VN2, tốt nhất hãy nhập Riot ID đầy đủ và chọn VN2."
    );
  }

  if (!tagLine && server === "VN2") {
    throw new Error(
      "Server VN2 không hỗ trợ tra cứu chỉ bằng tên. Hãy nhập Riot ID đầy đủ, ví dụ: Funk Thanks Door#MIXII, và chọn server VN2."
    );
  }

  server = assertValidServerTag(server);

  return {
    gameName,
    tagLine,
    server,
  };
}

module.exports = { parseRiotId, normalizeServerTag };