import { AutoRouter } from 'itty-router';
import {
  getPublishedPosts,
  getAllPostsForAdmin,
  getPostById,
  addComment,
  moderateComment,
  toggleLike,
  updatePost,
  deletePost,
  togglePromotePost,
  recordPostView,
  recordFileAccess,
  getPostAnalytics,
  getGlobalStats
} from './db.js';
import { createBot } from './bot.js';
import { getAppHtml } from './frontend.js';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

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

export function createRouter() {
  const router = AutoRouter();

  router.options('*', () => new Response(null, { headers: corsHeaders }));

  const serveApp = (request, env) => {
    return htmlResponse(getAppHtml(env));
  };

  router.get('/', serveApp);
  router.get('/app', serveApp);

  router.get('/api/health', () => jsonResponse({
    ok: true,
    service: 'xmi-hub',
    status: 'online',
    timestamp: Date.now()
  }));

  // -------------------------------------------------------------
  // GET /api/posts - Public posts
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
  // GET /api/admin/posts - All posts for Admin (Draft, Scheduled, Published)
  // -------------------------------------------------------------
  router.get('/api/admin/posts', async (request, env) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || String(userId) !== String(env.ADMIN_ID)) {
        return errorResponse('Unauthorized admin access', 403);
      }

      const posts = await getAllPostsForAdmin(env);
      return jsonResponse({ success: true, posts });
    } catch (err) {
      console.error('API /api/admin/posts error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // GET /api/posts/:id - Post details
  // -------------------------------------------------------------
  router.get('/api/posts/:id', async (request, env) => {
    try {
      const { id } = request.params;
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');
      const isAdmin = Boolean(userId && String(userId) === String(env.ADMIN_ID));

      const post = await getPostById(env, id, userId, isAdmin);
      if (!post) {
        return errorResponse('Post not found', 404);
      }

      return jsonResponse({ success: true, post, is_admin: isAdmin });
    } catch (err) {
      console.error('API /api/posts/:id error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/posts/:id/view - Track post view
  // -------------------------------------------------------------
  router.post('/api/posts/:id/view', async (request, env) => {
    try {
      const { id } = request.params;
      const body = await request.json();
      const { user_id, username, first_name } = body || {};

      if (user_id) {
        await recordPostView(env, {
          post_id: id,
          user_id,
          username,
          first_name
        });
      }

      return jsonResponse({ success: true });
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 200);
    }
  });

  // -------------------------------------------------------------
  // POST /api/posts/:id/access-log - Track file download or link access
  // -------------------------------------------------------------
  router.post('/api/posts/:id/access-log', async (request, env) => {
    try {
      const { id } = request.params;
      const body = await request.json();
      const { folder_id, file_id, item_name, user_id, username, first_name } = body || {};

      if (user_id) {
        await recordFileAccess(env, {
          post_id: id,
          folder_id,
          file_id,
          item_name,
          user_id,
          username,
          first_name
        });
      }

      return jsonResponse({ success: true });
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 200);
    }
  });

  // -------------------------------------------------------------
  // GET /api/admin/posts/:id/analytics - Detailed Post Analytics
  // -------------------------------------------------------------
  router.get('/api/admin/posts/:id/analytics', async (request, env) => {
    try {
      const { id } = request.params;
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || String(userId) !== String(env.ADMIN_ID)) {
        return errorResponse('Unauthorized admin access', 403);
      }

      const analytics = await getPostAnalytics(env, id);
      return jsonResponse({ success: true, analytics });
    } catch (err) {
      console.error('API post analytics error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/admin/posts/:id/promote - Toggle Promoted / Featured
  // -------------------------------------------------------------
  router.post('/api/admin/posts/:id/promote', async (request, env) => {
    try {
      const { id } = request.params;
      const body = await request.json();
      const { user_id, is_promoted } = body || {};

      if (!user_id || String(user_id) !== String(env.ADMIN_ID)) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const updated = await togglePromotePost(env, id, is_promoted);
      return jsonResponse({ success: true, post: updated });
    } catch (err) {
      console.error('API promote error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/admin/posts/:id/toggle - Toggle Status (Admin Only)
  // -------------------------------------------------------------
  router.post('/api/admin/posts/:id/toggle', async (request, env) => {
    try {
      const { id } = request.params;
      const body = await request.json();
      const { user_id, status } = body || {};

      if (!user_id || String(user_id) !== String(env.ADMIN_ID)) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const newStatus = status === 'published' ? 'draft' : 'published';
      const updated = await updatePost(env, id, { status: newStatus });

      return jsonResponse({ success: true, post: updated });
    } catch (err) {
      console.error('API toggle status error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // DELETE /api/admin/posts/:id - Delete Post (Admin Only)
  // -------------------------------------------------------------
  router.delete('/api/admin/posts/:id', async (request, env) => {
    try {
      const { id } = request.params;
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || String(userId) !== String(env.ADMIN_ID)) {
        return errorResponse('Unauthorized admin action', 403);
      }

      await deletePost(env, id);
      return jsonResponse({ success: true, message: 'Post deleted' });
    } catch (err) {
      console.error('API delete post error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/admin/posts/:id/edit - Full Post Edit (Admin Only)
  // -------------------------------------------------------------
  router.post('/api/admin/posts/:id/edit', async (request, env) => {
    try {
      const { id } = request.params;
      const body = await request.json();
      const {
        user_id,
        title,
        preview_image,
        direct_link,
        direct_link_title,
        status,
        scheduled_at,
        is_promoted
      } = body || {};

      if (!user_id || String(user_id) !== String(env.ADMIN_ID)) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const updatePayload = {};
      if (title !== undefined) updatePayload.title = title.trim();
      if (preview_image !== undefined) updatePayload.preview_image = preview_image ? preview_image.trim() : null;
      if (direct_link !== undefined) updatePayload.direct_link = direct_link ? direct_link.trim() : null;
      if (direct_link_title !== undefined) updatePayload.direct_link_title = direct_link_title ? direct_link_title.trim() : null;
      if (status !== undefined) updatePayload.status = status;
      if (scheduled_at !== undefined) updatePayload.scheduled_at = scheduled_at;
      if (is_promoted !== undefined) updatePayload.is_promoted = Boolean(is_promoted);

      const updated = await updatePost(env, id, updatePayload);
      return jsonResponse({ success: true, post: updated });
    } catch (err) {
      console.error('API edit post error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // GET /api/admin/stats - Global Hub Statistics (Admin Only)
  // -------------------------------------------------------------
  router.get('/api/admin/stats', async (request, env) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || String(userId) !== String(env.ADMIN_ID)) {
        return errorResponse('Unauthorized admin access', 403);
      }

      const stats = await getGlobalStats(env);
      return jsonResponse({ success: true, stats });
    } catch (err) {
      console.error('API global stats error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/comments - Add Comment
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
  // POST /api/comments/moderate - Hide/Unhide or Delete Comment (Admin Only)
  // -------------------------------------------------------------
  router.post('/api/comments/moderate', async (request, env) => {
    try {
      const body = await request.json();
      const { comment_id, user_id, action } = body || {};

      if (!user_id || String(user_id) !== String(env.ADMIN_ID)) {
        return errorResponse('Unauthorized admin action', 403);
      }

      if (!comment_id || !action) {
        return errorResponse('Missing comment_id or action');
      }

      const result = await moderateComment(env, { comment_id, action });
      return jsonResponse({ success: true, result });
    } catch (err) {
      console.error('API /api/comments/moderate error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/likes - Toggle Like
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
  // Telegram Bot Webhook
  // -------------------------------------------------------------
  const handleTelegramWebhook = async (request, env) => {
    try {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }

      if (env.SECRET_TOKEN) {
        const headerToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
        if (headerToken !== env.SECRET_TOKEN) {
          return new Response('Unauthorized secret token', { status: 403 });
        }
      }

      const update = await request.json();
      const bot = createBot(env);
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
  // GET /set-webhook - Helper to quickly register Telegram webhook & menu button
  // -------------------------------------------------------------
  router.get('/set-webhook', async (request, env) => {
    try {
      if (!env.BOT_TOKEN) {
        return errorResponse('BOT_TOKEN environment variable is not configured');
      }

      const currentUrl = new URL(request.url);
      const webhookUrl = `${currentUrl.origin}/webhook`;
      const appUrl = env.WEB_APP_URL || currentUrl.origin;

      let apiUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
      if (env.SECRET_TOKEN) {
        apiUrl += `&secret_token=${encodeURIComponent(env.SECRET_TOKEN)}`;
      }

      const webhookRes = await fetch(apiUrl);
      const webhookData = await webhookRes.json();

      let menuButtonData = null;
      try {
        const menuBtnUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/setChatMenuButton`;
        const menuRes = await fetch(menuBtnUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_button: {
              type: 'web_app',
              text: '🚀 Open App',
              web_app: {
                url: appUrl
              }
            }
          })
        });
        menuButtonData = await menuRes.json();
      } catch (menuErr) {
        console.warn('Failed to set chat menu button via API:', menuErr.message);
      }

      return jsonResponse({
        success: true,
        webhookUrl,
        appUrl,
        telegramWebhookResponse: webhookData,
        telegramMenuButtonResponse: menuButtonData
      });
    } catch (err) {
      return errorResponse(err.message, 500);
    }
  });

  return router;
}
