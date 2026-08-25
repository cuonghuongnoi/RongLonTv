const { parseRiotId } = require('./utils/riotId');
const Player = require('./commands/lol/player');

(async () => {
  try {
    console.log('parsed:', parseRiotId('CuongHuongNoi#2104', 'VN2'));
    const interaction = {
      options: {
        getString: (name) => {
          if (name === 'riot-id') return 'CuongHuongNoi#2104';
          if (name === 'tag') return 'VN2';
          return null;
        },
      },
      reply: async (message) => {
        console.log('reply:', JSON.stringify(message, null, 2));
      },
    };
    await Player.execute(interaction);
  } catch (error) {
    console.error(error);
  }
})();