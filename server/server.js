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

const lobbyConfig = {
  apiPort: PORT,
  apiCallback: () => console.log(`🎮 Lobby API running on port ${PORT}`),
};

server.run(lobbyConfig);
