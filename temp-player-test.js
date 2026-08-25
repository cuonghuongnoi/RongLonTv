require('dotenv').config({ path: './.env' });
const { execute } = require('./commands/lol/player');

(async () => {
  try {
    const interaction = {
      options: {
        getString: (name) => {
          if (name === 'riot-id') return 'CuongHuongNoi#2104';
          if (name === 'tag') return 'VN2';
          return null;
        },
      },
      reply: async (result) => {
        console.log('reply result:', JSON.stringify(result, null, 2));
      },
    };

    await execute(interaction);
  } catch (err) {
    console.error('execute error:', err.stack || err);
  }
})();