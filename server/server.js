import { Server } from 'boardgame.io/dist/cjs/server.js';
import { ImpactGame } from '../src/Game.js';

const server = Server({ 
  games: [ImpactGame],
  origins: [
    'http://localhost:3000',
    'https://impact-esg-deal.vercel.app',
    /\.vercel\.app$/,
  ],
  authenticateCredentials: async () => true, // Disable auth for testing
});

const PORT = process.env.PORT || 8000;

server.run(PORT, () => {
  console.log(`🎮 Boardgame.io server running on port ${PORT}`);
});
