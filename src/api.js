import { AutoRouter } from 'itty-router';
import {
  getPublishedPosts,
  getPostById,
  addComment,
  toggleLike
} from './db.js';
import { createBot } from './bot.js';
import { getAppHtml } from './frontend.js';

/**
 * Standard CORS Headers
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

/**
 * Helper to return JSON Response with CORS
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Helper for error response
 */
export function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

/**
 * Helper to return HTML response
 */
export function htmlResponse(html) {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      ...corsHeaders
    }
  });
}

/**
 * Creates and configures the unified itty-router instance
 */
export function createRouter() {
  const router = AutoRouter();

  // -------------------------------------------------------------
  // CORS Preflight Options
  // -------------------------------------------------------------
  router.options('*', () => new Response(null, { headers: corsHeaders }));

  // -------------------------------------------------------------
  // Web App Frontend (Served directly from Worker root & /app)
  // -------------------------------------------------------------
  const serveApp = (request, env) => {
    return htmlResponse(getAppHtml(env));
  };

  router.get('/', serveApp);
  router.get('/app', serveApp);

  // -------------------------------------------------------------
  // Health Check
  // -------------------------------------------------------------
  router.get('/api/health', () => jsonResponse({
    ok: true,
    service: 'telegram-bot-and-app',
    status: 'online',
    timestamp: Date.now()
  }));

  // -------------------------------------------------------------
  // GET /api/posts - Fetch all published posts
  // -------------------------------------------------------------
  router.get('/api/posts', async (request, env) => {
    try {
      const posts = await getPublishedPosts(env);
      return jsonResponse({ success: true, posts });
    } catch (err) {
      console.error('API /api/posts error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // GET /api/posts/:id - Fetch post details
  // -------------------------------------------------------------
  router.get('/api/posts/:id', async (request, env) => {
    try {
      const { id } = request.params;
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      const post = await getPostById(env, id, userId);
      if (!post) {
        return errorResponse('Post not found', 404);
      }

      return jsonResponse({ success: true, post });
    } catch (err) {
      console.error('API /api/posts/:id error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/comments - Add a comment
  // -------------------------------------------------------------
  router.post('/api/comments', async (request, env) => {
    try {
      const body = await request.json();
      const { post_id, user_id, username, text } = body || {};

      if (!post_id || !user_id || !text || !text.trim()) {
        return errorResponse('Missing required fields: post_id, user_id, and text are required.');
      }

      const comment = await addComment(env, {
        post_id: Number(post_id),
        user_id: Number(user_id),
        username: (username || 'User').trim(),
        text: text.trim()
      });

      return jsonResponse({ success: true, comment }, 201);
    } catch (err) {
      console.error('API /api/comments error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/likes - Toggle like
  // -------------------------------------------------------------
  router.post('/api/likes', async (request, env) => {
    try {
      const body = await request.json();
      const { post_id, user_id } = body || {};

      if (!post_id || !user_id) {
        return errorResponse('Missing required fields: post_id and user_id are required.');
      }

      const result = await toggleLike(env, {
        post_id: Number(post_id),
        user_id: Number(user_id)
      });

      return jsonResponse({
        success: true,
        liked: result.liked,
        like_count: result.like_count
      });
    } catch (err) {
      console.error('API /api/likes error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /webhook & /api/webhook - Telegram Bot Webhook
  // -------------------------------------------------------------
  const handleTelegramWebhook = async (request, env) => {
    try {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }

      // Validate secret token if configured
      if (env.SECRET_TOKEN) {
        const headerToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
        if (headerToken !== env.SECRET_TOKEN) {
          return new Response('Unauthorized secret token', { status: 403 });
        }
      }

      const update = await request.json();
      const bot = createBot(env);

      // Handle the Telegram update
      await bot.handleUpdate(update);

      return new Response('OK', { status: 200 });
    } catch (err) {
      console.error('Webhook error:', err);
      return new Response('Internal Error', { status: 500 });
    }
  };

  router.post('/webhook', handleTelegramWebhook);
  router.post('/api/webhook', handleTelegramWebhook);

  // -------------------------------------------------------------
  // GET /set-webhook - Helper to quickly register Telegram webhook
  // -------------------------------------------------------------
  router.get('/set-webhook', async (request, env) => {
    try {
      if (!env.BOT_TOKEN) {
        return errorResponse('BOT_TOKEN environment variable is not configured');
      }

      const currentUrl = new URL(request.url);
      const webhookUrl = `${currentUrl.origin}/webhook`;

      let apiUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
      if (env.SECRET_TOKEN) {
        apiUrl += `&secret_token=${encodeURIComponent(env.SECRET_TOKEN)}`;
      }

      const res = await fetch(apiUrl);
      const data = await res.json();

      return jsonResponse({
        webhookUrl,
        telegramResponse: data
      });
    } catch (err) {
      return errorResponse(err.message, 500);
    }
  });

  return router;
}
