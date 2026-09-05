import { createRouter } from './api.js';
import { publishScheduledPosts } from './db.js';

const router = createRouter();

/**
 * Cloudflare Worker Export
 */
export default {
  /**
   * HTTP Fetch Handler (Bot Webhook + REST API for Web App)
   */
  async fetch(request, env, ctx) {
    try {
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
   * Cron Trigger Scheduled Handler (Auto-publishing scheduled posts)
   */
  async scheduled(event, env, ctx) {
    console.log(`Cron triggered at ${new Date().toISOString()} (Cron: ${event.cron})`);
    ctx.waitUntil(
      (async () => {
        try {
          const published = await publishScheduledPosts(env);
          console.log(`Auto-published ${published.length} scheduled posts.`);
        } catch (err) {
          console.error('Cron auto-publishing error:', err);
        }
      })()
    );
  }
};
