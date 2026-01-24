import { Server } from 'boardgame.io/dist/cjs/server.js';
import { ImpactGame } from '../src/Game.js';
import Koa from 'koa';
import Router from '@koa/router';

// Create Koa app and router
const app = new Koa();
const router = new Router();

// Add custom endpoint to create matches
router.post('/create-match/:matchID', async (ctx) => {
  const { matchID } = ctx.params;
  try {
    ctx.body = { success: true, matchID, message: 'Match will be auto-created on first client connect' };
  } catch (err) {
    console.error('Error:', err);
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

const server = Server({ 
  games: [ImpactGame],
  origins: [
    'http://localhost:3000',
    'https://impact-esg-deal.vercel.app',
    /\.vercel\.app$/,
  ],
  authenticateCredentials: async () => true, // Disable auth for testing
  app, // Pass custom Koa app
});

const PORT = process.env.PORT || 8000;

server.run(PORT, () => {
  console.log(`🎮 Boardgame.io server running on port ${PORT}`);
});
