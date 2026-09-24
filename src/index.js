import { createRouter } from './api.js';
import { publishScheduledPosts, processEphemeralDeletions } from './db.js';

const router = createRouter();

let lastRenderPing = 0;

async function keepRenderStreamAlive(env) {
  const now = Date.now();
  // Ping at least once every 8 minutes (Render sleeps after 15 mins)
  if (now - lastRenderPing < 8 * 60 * 1000) return;
  lastRenderPing = now;

  try {
    const renderUrl = env.RENDER_STREAM_URL || 'https://xmi-stream-bot.onrender.com';
    const pingTarget = `${renderUrl.replace(/\/+$/, '')}/health`;
    const res = await fetch(pingTarget, { method: 'GET' });
    if (res.ok) {
      console.log(`Render stream server keep-alive ping successful: ${res.status}`);
    }
  } catch (e) {
    console.warn('Render stream server keep-alive ping notice:', e.message);
  }
}

/**
 * Cloudflare Worker Export
 */
export default {
  /**
   * HTTP Fetch Handler (Bot Webhook + REST API for Web App)
   */
  async fetch(request, env, ctx) {
    try {
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(processEphemeralDeletions(env).catch(() => {}));
        ctx.waitUntil(keepRenderStreamAlive(env).catch(() => {}));
      }
      return await router.fetch(request, env, ctx);
    } catch (err) {
      console.error('Fatal Worker Error:', err);
      return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Cron Trigger Scheduled Handler (Auto-publishing scheduled posts, keep-alive & auto-deleting ephemeral messages)
   */
  async scheduled(event, env, ctx) {
    console.log(`Cron triggered at ${new Date().toISOString()} (Cron: ${event.cron})`);
    ctx.waitUntil(
      (async () => {
        try {
          await keepRenderStreamAlive(env);
        } catch (err) {
          console.warn('Cron keep-alive error:', err);
        }

        try {
          const published = await publishScheduledPosts(env);
          if (published.length > 0) {
            console.log(`Auto-published ${published.length} scheduled posts.`);
          }
        } catch (err) {
          console.error('Cron auto-publishing error:', err);
        }

        try {
          const deletedCount = await processEphemeralDeletions(env);
          if (deletedCount > 0) {
            console.log(`Auto-deleted ${deletedCount} expired ephemeral messages.`);
          }
        } catch (err) {
          console.error('Cron ephemeral auto-deletion error:', err);
        }
      })()
    );
  }
};
