const { Server } = require('boardgame.io/server');
const { ImpactGame } = require('../src/Game');

const server = Server({ 
  games: [ImpactGame],
  origins: [
    'http://localhost:3000',
    'https://impact-esg-deal.vercel.app',
    /\.vercel\.app$/,  // Allow all Vercel preview deployments
  ],
});

const PORT = process.env.PORT || 8000;

server.run(PORT, () => {
  console.log(`🎮 Boardgame.io server running on port ${PORT}`);
});
