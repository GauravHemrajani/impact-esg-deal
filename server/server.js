const { Server } = require('boardgame.io/server');
const { ImpactGame } = require('../src/Game');

const server = Server({ 
  games: [ImpactGame],
  origins: [
    'http://localhost:3000',
    'https://impact-esg-deal.vercel.app',
    /\.vercel\.app$/,
  ],
});

const PORT = process.env.PORT || 8000;

server.run(PORT, () => {
  console.log(`🎮 Boardgame.io server with Lobby API running on port ${PORT}`);
});
