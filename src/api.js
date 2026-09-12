import { AutoRouter } from 'itty-router';
import {
  getPublishedPosts,
  getAllPostsForAdmin,
  getPostById,
  createPost,
  getPostFoldersWithFiles,
  addEphemeralMessages,
  addComment,
  moderateComment,
  toggleLike,
  updatePost,
  deletePost,
  togglePromotePost,
  recordPostView,
  recordFileAccess,
  getPostAnalytics,
  getGlobalStats,
  toggleSavePost,
  getSavedPosts,
  getSettings,
  updateSetting,
  getForceChannels,
  addForceChannel,
  removeForceChannel,
  getShorteners,
  addShortener,
  deleteShortener,
  createVerifyToken,
  verifyTokenAndGrantPass,
  checkAndDeductPostAccess,
  getAllUserIds,
  getAllUsers,
  saveOrUpdateUser,
  getUser,
  isAdminUser,
  getAdmins,
  addAdmin,
  deleteAdmin,
  getDatabaseStorageStats,
  optimizeDatabase,
  processEphemeralDeletions,
  updateUserBlockedStatus,
  getNextPostNumber,
  formatBytes,
  resetAllMetrics
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
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');
      const posts = await getPublishedPosts(env, userId);
      return jsonResponse({ success: true, posts });
    } catch (err) {
      console.error('API /api/posts error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // GET /api/saved-posts - User's Saved/Bookmarked Posts
  // -------------------------------------------------------------
  router.get('/api/saved-posts', async (request, env) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');
      if (!userId) {
        return errorResponse('User ID is required', 400);
      }
      const posts = await getSavedPosts(env, userId);
      return jsonResponse({ success: true, posts });
    } catch (err) {
      console.error('API /api/saved-posts error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/posts/:id/save - Toggle Save / Bookmark
  // -------------------------------------------------------------
  router.post('/api/posts/:id/save', async (request, env) => {
    try {
      const { id } = request.params;
      const body = await request.json();
      const { user_id } = body || {};

      if (!user_id) {
        return errorResponse('user_id is required', 400);
      }

      const result = await toggleSavePost(env, user_id, id);
      return jsonResponse({ success: true, saved: result.saved });
    } catch (err) {
      console.error('API /api/posts/:id/save error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // GET /api/settings - App Configuration & User Data
  // -------------------------------------------------------------
  router.get('/api/settings', async (request, env) => {
    try {
      // Proactively clean expired ephemeral messages in background
      processEphemeralDeletions(env).catch(() => {});

      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');
      const settings = await getSettings(env);
      
      const isAdmin = await isAdminUser(env, userId);

      let userData = null;
      let hasStartedBot = false;
      if (userId && Number(userId) > 0) {
        const u = await getUser(env, userId);
        if (u) {
          hasStartedBot = (Number(u.interactions) || 0) > 0;
          userData = {
            id: u.id,
            username: u.username || null,
            first_name: u.first_name || '',
            points: Number(u.points) || 0,
            referral_count: Number(u.referral_count) || 0,
            has_started_bot: hasStartedBot
          };
        }
      }

      return jsonResponse({
        success: true,
        settings,
        user: userData,
        has_started_bot: hasStartedBot,
        is_admin: isAdmin
      });
    } catch (err) {
      console.error('API /api/settings error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/admin/settings - Update Settings (Admin Only)
  // -------------------------------------------------------------
  router.post('/api/admin/settings', async (request, env) => {
    try {
      const url = new URL(request.url);
      const queryUserId = url.searchParams.get('user_id');
      const body = await request.json().catch(() => ({}));
      const user_id = queryUserId || body.user_id || body.admin_id;

      if (!user_id || !(await isAdminUser(env, user_id))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const settings = (body.settings && typeof body.settings === 'object') ? body.settings : body;
      if (!settings || typeof settings !== 'object') {
        return errorResponse('Invalid settings object', 400);
      }

      const allowedKeys = [
        'referral_enabled',
        'referral_points',
        'shortener_enabled',
        'points_per_verify',
        'points_per_post',
        'points_per_post_download',
        'auto_delete_minutes',
        'protect_all_posts',
        'restrict_forwarding_all',
        'banner_enabled',
        'banner_image',
        'banner_link',
        'banner_title',
        'banner_text',
        'force_join_enabled',
        'require_bot_start_enabled',
        'require_bot_start_message',
        'require_bot_start_link',
        'blocked_user_ids',
        'categories',
        'shorteners'
      ];

      for (const [key, value] of Object.entries(settings)) {
        if (allowedKeys.includes(key)) {
          await updateSetting(env, key, value);
        }
      }

      const updated = await getSettings(env);
      return jsonResponse({ success: true, settings: updated });
    } catch (err) {
      console.error('API /api/admin/settings error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // Multi-Admin Management (Admin Only)
  // -------------------------------------------------------------
  router.get('/api/admin/admins', async (request, env) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || !(await isAdminUser(env, userId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const admins = await getAdmins(env);
      return jsonResponse({ success: true, admins });
    } catch (err) {
      console.error('API /api/admin/admins error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // GET /api/admin/users - List all registered users (Admin Only)
  // -------------------------------------------------------------
  router.get('/api/admin/users', async (request, env) => {
    try {
      const url = new URL(request.url);
      const queryUserId = url.searchParams.get('user_id');

      if (!queryUserId || !(await isAdminUser(env, queryUserId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const users = await getAllUsers(env);
      return jsonResponse({
        success: true,
        total_users: users.length,
        users
      });
    } catch (err) {
      console.error('API /api/admin/users error:', err);
      return errorResponse(err.message, 500);
    }
  });

  router.post('/api/admin/admins', async (request, env) => {
    try {
      const url = new URL(request.url);
      const queryUserId = url.searchParams.get('user_id');
      const body = await request.json().catch(() => ({}));
      const requesterId = queryUserId || body.added_by || body.requester_id || body.admin_id;
      const newAdminId = body.new_admin_id || body.target_admin_id || body.user_id;

      if (!requesterId || !(await isAdminUser(env, requesterId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      if (!newAdminId) {
        return errorResponse('Telegram User ID is required', 400);
      }

      await addAdmin(env, {
        user_id: newAdminId,
        username: body.username || '',
        full_name: body.full_name || '',
        added_by: requesterId
      });

      const admins = await getAdmins(env);
      return jsonResponse({ success: true, message: 'Admin added successfully', admins });
    } catch (err) {
      console.error('API add admin error:', err);
      return errorResponse(err.message, 500);
    }
  });

  router.delete('/api/admin/admins/:id', async (request, env) => {
    try {
      const { id } = request.params;
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || !(await isAdminUser(env, userId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      await deleteAdmin(env, id);
      const admins = await getAdmins(env);
      return jsonResponse({ success: true, message: 'Admin removed successfully', admins });
    } catch (err) {
      console.error('API delete admin error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // Supabase Database Storage Stats & Optimization (Admin Only)
  // -------------------------------------------------------------
  router.get('/api/admin/database/stats', async (request, env) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || !(await isAdminUser(env, userId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const stats = await getDatabaseStorageStats(env);
      return jsonResponse(stats);
    } catch (err) {
      console.error('API /api/admin/database/stats error:', err);
      return errorResponse(err.message, 500);
    }
  });

  router.post('/api/admin/database/optimize', async (request, env) => {
    try {
      let user_id = new URL(request.url).searchParams.get('user_id');
      try {
        const body = await request.json();
        if (body?.user_id) user_id = body.user_id;
      } catch (e) {}

      if (!user_id || !(await isAdminUser(env, user_id))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const optResult = await optimizeDatabase(env);
      const freshStats = await getDatabaseStorageStats(env);
      return jsonResponse({ ...optResult, stats: freshStats });
    } catch (err) {
      console.error('API /api/admin/database/optimize error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // Force Join Channels Endpoints (Admin Only)
  // -------------------------------------------------------------
  router.get('/api/admin/force-channels', async (request, env) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || !(await isAdminUser(env, userId))) {
        return errorResponse('Unauthorized admin access', 403);
      }

      const channels = await getForceChannels(env);
      return jsonResponse({ success: true, channels });
    } catch (err) {
      console.error('API force channels error:', err);
      return errorResponse(err.message, 500);
    }
  });

  router.post('/api/admin/force-channels', async (request, env) => {
    try {
      const body = await request.json();
      const { user_id, channel_id, channel_title, invite_link } = body || {};

      if (!user_id || !(await isAdminUser(env, user_id))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      if (!channel_id || !channel_title || !invite_link) {
        return errorResponse('channel_id, channel_title, and invite_link are required', 400);
      }

      const added = await addForceChannel(env, { channel_id, channel_title, invite_link });
      return jsonResponse({ success: true, channel: added });
    } catch (err) {
      console.error('API add force channel error:', err);
      return errorResponse(err.message, 500);
    }
  });

  router.delete('/api/admin/force-channels/:id', async (request, env) => {
    try {
      const { id } = request.params;
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || !(await isAdminUser(env, userId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      await removeForceChannel(env, id);
      return jsonResponse({ success: true, message: 'Channel removed' });
    } catch (err) {
      console.error('API remove force channel error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/admin/broadcast - Broadcast Message to All Users
  // -------------------------------------------------------------
  router.post('/api/admin/broadcast', async (request, env) => {
    try {
      const url = new URL(request.url);
      const queryUserId = url.searchParams.get('user_id');
      const body = await request.json().catch(() => ({}));
      const user_id = queryUserId || body.user_id || body.admin_id || body.sender_id;

      if (!user_id || !(await isAdminUser(env, user_id))) {
        return errorResponse('Unauthorized admin access', 403);
      }

      const { message, photo_url, button_text, button_url, target_user_ids } = body;

      if (!message || !message.trim()) {
        return errorResponse('Broadcast message is required', 400);
      }

      let userIds = [];
      if (Array.isArray(target_user_ids) && target_user_ids.length > 0) {
        userIds = target_user_ids.map(Number).filter(id => !isNaN(id) && id > 0);
      } else {
        userIds = await getAllUserIds(env);
      }

      if (userIds.length === 0) {
        return jsonResponse({
          success: true,
          total_targeted: 0,
          total_users: 0,
          sent_count: 0,
          failed_count: 0,
          failed_details: []
        });
      }

      let sentCount = 0;
      let failedCount = 0;
      const failedDetails = [];

      const inlineKeyboard = (button_text && button_url) ? {
        inline_keyboard: [[{ text: button_text, url: button_url }]]
      } : undefined;

      for (const targetId of userIds) {
        try {
          let resData = null;
          if (photo_url && photo_url.startsWith('http')) {
            const sendPhotoUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`;
            const res = await fetch(sendPhotoUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: targetId,
                photo: photo_url,
                caption: message,
                parse_mode: 'Markdown',
                reply_markup: inlineKeyboard
              })
            });
            resData = await res.json();
          } else {
            const sendMsgUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
            const res = await fetch(sendMsgUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: targetId,
                text: message,
                parse_mode: 'Markdown',
                reply_markup: inlineKeyboard
              })
            });
            resData = await res.json();
          }

          if (resData && resData.ok) {
            sentCount++;
          } else {
            failedCount++;
            const desc = resData?.description || 'Telegram delivery failed';
            const isBlocked = /blocked|deactivated|user is deactivated|bot was blocked|forbidden/i.test(desc);
            if (isBlocked) {
              updateUserBlockedStatus(env, targetId, true).catch(() => {});
            }
            failedDetails.push({
              user_id: targetId,
              reason: desc
            });
          }
        } catch (e) {
          failedCount++;
          const reasonMsg = e.message || 'Network exception';
          if (/blocked|deactivated|forbidden/i.test(reasonMsg)) {
            updateUserBlockedStatus(env, targetId, true).catch(() => {});
          }
          failedDetails.push({
            user_id: targetId,
            reason: reasonMsg
          });
        }
      }

      return jsonResponse({
        success: true,
        total_targeted: userIds.length,
        total_users: userIds.length,
        sent_count: sentCount,
        failed_count: failedCount,
        failed_details: failedDetails,
        sent: sentCount,
        failed: failedCount
      });
    } catch (err) {
      console.error('API broadcast error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/verify/generate - Generate / Regenerate Verification Link
  // -------------------------------------------------------------
  router.post('/api/verify/generate', async (request, env) => {
    try {
      const body = await request.json();
      const { user_id, target_post_id } = body || {};

      if (!user_id) {
        return errorResponse('user_id is required', 400);
      }

      const result = await createVerifyToken(env, user_id, target_post_id);
      return jsonResponse({
        success: true,
        token: result.token,
        verify_url: result.verify_url,
        bot_verify_link: result.bot_verify_link,
        dest_url: result.dest_url,
        shortener_name: result.shortener_name,
        reward_points: result.reward_points
      });
    } catch (err) {
      console.error('API /api/verify/generate error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/posts/:id/unlock - Points-Based Post Unlock & File Access Check
  // -------------------------------------------------------------
  router.post('/api/posts/:id/unlock', async (request, env) => {
    try {
      const { id } = request.params;
      const body = await request.json();
      const { user_id } = body || {};

      if (!user_id) {
        return errorResponse('user_id is required', 400);
      }

      const result = await checkAndDeductPostAccess(env, user_id, id);
      return jsonResponse({ success: true, ...result });
    } catch (err) {
      console.error('API /api/posts/:id/unlock error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // Multiple Shorteners Management (Admin Only)
  // -------------------------------------------------------------
  router.get('/api/admin/shorteners', async (request, env) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || !(await isAdminUser(env, userId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const shorteners = await getShorteners(env);
      return jsonResponse({ success: true, shorteners });
    } catch (err) {
      console.error('API /api/admin/shorteners error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // Generate a new bot destination verify link for admin to shorten
  router.get('/api/admin/shorteners/generate-link', async (request, env) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || !(await isAdminUser(env, userId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const token = 'v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      const botUsername = env.BOT_USERNAME || 'Xminty_bot';
      const botVerifyLink = `https://t.me/${botUsername}?start=verify_${token}`;
      const appUrl = env.WEB_APP_URL || 'https://xmi.lakshminighty1.workers.dev';
      const webVerifyLink = `${appUrl}/verify?token=${token}`;

      return jsonResponse({
        success: true,
        token,
        bot_verify_link: botVerifyLink,
        web_verify_link: webVerifyLink
      });
    } catch (err) {
      console.error('API generate verify link error:', err);
      return errorResponse(err.message, 500);
    }
  });

  router.post('/api/admin/shorteners', async (request, env) => {
    try {
      const body = await request.json();
      const { user_id, title, name, shortener_url, api_url, api_key, bot_verify_link, reward_points, enabled } = body || {};

      if (!user_id || !(await isAdminUser(env, user_id))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const shTitle = title || name || 'Shortener';
      const shUrl = shortener_url || api_url;

      if (!shTitle || !shUrl) {
        return errorResponse('Shortener title and shortened link URL are required', 400);
      }

      const added = await addShortener(env, {
        title: shTitle,
        name: shTitle,
        shortener_url: shUrl,
        api_url: api_url || '',
        api_key: api_key || '',
        bot_verify_link: bot_verify_link || '',
        reward_points: Number(reward_points) || 5,
        enabled: enabled ?? true
      });
      return jsonResponse({ success: true, shortener: added });
    } catch (err) {
      console.error('API add shortener error:', err);
      return errorResponse(err.message, 500);
    }
  });

  router.delete('/api/admin/shorteners/:id', async (request, env) => {
    try {
      const { id } = request.params;
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || !(await isAdminUser(env, userId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      await deleteShortener(env, id);
      return jsonResponse({ success: true, message: 'Shortener deleted' });
    } catch (err) {
      console.error('API delete shortener error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // GET /verify - Shortener Token Verification Landing Page
  // -------------------------------------------------------------
  router.get('/verify', async (request, env) => {
    try {
      const url = new URL(request.url);
      const token = url.searchParams.get('token');
      if (!token) {
        return htmlResponse(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Invalid Token</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #0b1120; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
              .card { background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 20px; padding: 32px 24px; max-width: 420px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              h2 { color: #f87171; margin-bottom: 12px; }
              p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>⚠️ Missing Token</h2>
              <p>No verification token was provided in the link. Please open the bot or app to generate a fresh verification link.</p>
            </div>
          </body>
          </html>
        `);
      }

      const record = await verifyTokenAndGrantPass(env, token);
      if (!record) {
        return htmlResponse(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Expired Token</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #0b1120; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
              .card { background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 20px; padding: 32px 24px; max-width: 420px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              h2 { color: #fbbf24; margin-bottom: 12px; }
              p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px; }
              .btn { display: inline-block; background: #38bdf8; color: #04101e; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 0.95rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>⚠️ Token Expired or Used</h2>
              <p>This verification link has already been claimed or has expired. Please regenerate a new verify link.</p>
              <a href="${env.WEB_APP_URL || '/'}" class="btn">🚀 Open App</a>
            </div>
          </body>
          </html>
        `);
      }

      const appUrl = env.WEB_APP_URL || url.origin;
      const botUsername = env.BOT_USERNAME || 'Xminty_bot';
      const redirectUrl = record.target_post_id ? `https://t.me/${botUsername}?start=post_${record.target_post_id}` : appUrl;
      const rewardPoints = record.reward_points || 5;

      // Send Instant Notification to Telegram user
      if (env.BOT_TOKEN && record.user_id) {
        const sendMsgUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
        fetch(sendMsgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: record.user_id,
            text: `🎉 *Verification Completed!*\\n\\n` +
              `🪙 *+${rewardPoints} Points* have been added to your balance!\\n` +
              `Total Balance: *${record.new_points || rewardPoints} Points*\\n\\n` +
              `You can now unlock posts and download files.`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                record.target_post_id ? [{ text: '📥 Open Post Files', callback_data: `user_view_post_${record.target_post_id}` }] : [{ text: '🚀 Open Mini App', web_app: { url: appUrl } }]
              ]
            }
          })
        }).catch(err => console.warn('Telegram notify error:', err.message));
      }

      return htmlResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <title>Access Verified & Points Claimed</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
              background: linear-gradient(135deg, #0b1120 0%, #171d36 50%, #070a12 100%);
              color: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 20px;
              text-align: center;
              overflow-x: hidden;
            }
            .card {
              background: rgba(26, 36, 56, 0.85);
              backdrop-filter: blur(16px);
              border: 1px solid rgba(56, 189, 248, 0.4);
              border-radius: 24px;
              padding: 36px 24px;
              max-width: 440px;
              width: 100%;
              box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.2);
              animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes popIn {
              0% { transform: scale(0.9); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            .icon-badge {
              width: 76px;
              height: 76px;
              border-radius: 50%;
              background: linear-gradient(135deg, #10b981, #059669);
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 38px;
              margin-bottom: 16px;
              box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
            }
            .title {
              font-size: 1.4rem;
              font-weight: 800;
              color: #ffffff;
              margin-bottom: 8px;
            }
            .reward-box {
              background: rgba(251, 191, 36, 0.15);
              border: 1px solid rgba(251, 191, 36, 0.4);
              color: #fbbf24;
              font-size: 1.15rem;
              font-weight: 800;
              padding: 10px 16px;
              border-radius: 12px;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              margin: 14px 0 16px 0;
            }
            .desc {
              font-size: 0.88rem;
              color: #94a3b8;
              line-height: 1.5;
              margin-bottom: 24px;
            }
            .btn {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              background: linear-gradient(135deg, #38bdf8, #0ea5e9);
              color: #04101e;
              text-decoration: none;
              padding: 14px 24px;
              border-radius: 14px;
              font-weight: 700;
              font-size: 1rem;
              box-shadow: 0 8px 20px rgba(56, 189, 248, 0.35);
              transition: transform 0.2s ease;
            }
            .btn:hover { transform: translateY(-2px); }
            .countdown {
              font-size: 0.75rem;
              color: #64748b;
              margin-top: 14px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon-badge">✅</div>
            <h1 class="title">Verification Successful!</h1>
            <div>
              <span class="reward-box">🪙 +${rewardPoints} Points Credited!</span>
            </div>
            <p class="desc">Your verification was confirmed. Your points balance has been updated and you can now download posts and access direct links.</p>
            <a href="${redirectUrl}" class="btn" id="btnRedirect">
              🚀 Continue to App / Content
            </a>
            <div class="countdown">Redirecting automatically in <span id="timer">2</span>s...</div>
          </div>
          <script>
            let sec = 2;
            const timerEl = document.getElementById('timer');
            const interval = setInterval(() => {
              sec--;
              if (timerEl) timerEl.textContent = sec;
              if (sec <= 0) {
                clearInterval(interval);
                window.location.href = "${redirectUrl}";
              }
            }, 1000);
          </script>
        </body>
        </html>
      `);
    } catch (err) {
      return htmlResponse(`<h2>⚠️ Error: ${err.message}</h2>`);
    }
  });

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // GET /api/admin/posts - All posts for Admin (Draft, Scheduled, Published)
  // -------------------------------------------------------------
  router.get('/api/admin/posts', async (request, env) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      if (!userId || !(await isAdminUser(env, userId))) {
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
      const isAdmin = await isAdminUser(env, userId);

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

      if (user_id && !(await isAdminUser(env, user_id))) {
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

      if (user_id && !(await isAdminUser(env, user_id))) {
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
  // POST /api/admin/metrics/reset - Reset All Likes, Views & Downloads (Admin Only)
  // -------------------------------------------------------------
  router.post('/api/admin/metrics/reset', async (request, env) => {
    try {
      const url = new URL(request.url);
      const queryUserId = url.searchParams.get('user_id');
      const body = await request.json().catch(() => ({}));
      const userId = queryUserId || body.user_id;

      if (!userId || !(await isAdminUser(env, userId))) {
        return errorResponse('Admin access required', 403);
      }

      const res = await resetAllMetrics(env);
      return jsonResponse(res);
    } catch (err) {
      console.error('API /api/admin/metrics/reset error:', err);
      return errorResponse(err.message, 500);
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

      if (!userId || !(await isAdminUser(env, userId))) {
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

      if (!user_id || !(await isAdminUser(env, user_id))) {
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

      if (!user_id || !(await isAdminUser(env, user_id))) {
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
      let userId = url.searchParams.get('user_id');

      if (!userId) {
        try {
          const body = await request.json();
          userId = body?.user_id;
        } catch (e) {}
      }

      if (!userId || !(await isAdminUser(env, userId))) {
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
  // GET /api/admin/posts/next-info - Get Next Post Number and Default Title
  // -------------------------------------------------------------
  router.get('/api/admin/posts/next-info', async (request, env) => {
    try {
      const nextNum = await getNextPostNumber(env);
      return jsonResponse({
        success: true,
        next_number: nextNum,
        default_title: `Post #${nextNum}`
      });
    } catch (err) {
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/admin/posts - Create Post (Admin Only)
  // -------------------------------------------------------------
  router.post('/api/admin/posts', async (request, env) => {
    try {
      const url = new URL(request.url);
      const queryUserId = url.searchParams.get('user_id');
      const body = await request.json().catch(() => ({}));
      const actualUserId = queryUserId || body.user_id || body.admin_id;

      if (!actualUserId || !(await isAdminUser(env, actualUserId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const {
        title,
        size,
        file_size,
        preview_image,
        direct_link,
        direct_link_title,
        category,
        tags,
        status = 'published',
        scheduled_at,
        is_promoted = false,
        auto_delete_minutes,
        protect_content = false
      } = body;

      const sizeStr = (size || file_size || '').trim();
      let finalTitle = (title || '').trim();
      const nextNum = await getNextPostNumber(env);

      if (!finalTitle) {
        finalTitle = sizeStr ? `Post #${nextNum} (${sizeStr})` : `Post #${nextNum}`;
      } else if (sizeStr && !finalTitle.includes('(')) {
        finalTitle = `${finalTitle} (${sizeStr})`;
      }

      const finalTags = (tags !== undefined && tags !== null && tags.trim())
        ? tags.trim()
        : `#file #${nextNum}`;

      const postPayload = {
        title: finalTitle,
        preview_image: preview_image ? preview_image.trim() : null,
        direct_link: direct_link ? direct_link.trim() : null,
        direct_link_title: direct_link_title ? direct_link_title.trim() : null,
        category: category || 'All',
        tags: finalTags,
        status: status || 'published',
        scheduled_at: scheduled_at ? scheduled_at : null,
        is_promoted: Boolean(is_promoted),
        protect_content: Boolean(protect_content),
        auto_delete_minutes: (auto_delete_minutes !== undefined && auto_delete_minutes !== null && auto_delete_minutes !== '' && !isNaN(auto_delete_minutes)) ? Number(auto_delete_minutes) : null,
        created_by: Number(actualUserId)
      };

      const created = await createPost(env, postPayload);
      return jsonResponse({ success: true, post: created }, 201);
    } catch (err) {
      console.error('API create post error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // POST /api/admin/posts/:id/broadcast - Broadcast Specific Post to All Users
  // -------------------------------------------------------------
  router.post('/api/admin/posts/:id/broadcast', async (request, env) => {
    try {
      const { id } = request.params;
      const url = new URL(request.url);
      const queryUserId = url.searchParams.get('user_id');
      const body = await request.json().catch(() => ({}));
      const actualUserId = queryUserId || body.user_id || body.admin_id;

      if (!actualUserId || !(await isAdminUser(env, actualUserId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const post = await getPostById(env, id, actualUserId, true);
      if (!post) {
        return errorResponse('Post not found', 404);
      }

      let userIds = [];
      if (Array.isArray(body.target_user_ids) && body.target_user_ids.length > 0) {
        userIds = body.target_user_ids.map(Number).filter(id => !isNaN(id) && id > 0);
      } else {
        userIds = await getAllUserIds(env);
      }

      if (!userIds || userIds.length === 0) {
        return jsonResponse({
          success: true,
          sent_count: 0,
          failed_count: 0,
          total_targeted: 0,
          total_users: 0,
          failed_details: []
        });
      }

      const folders = await getPostFoldersWithFiles(env, id);
      const settings = await getSettings(env);
      const globalTimer = (settings.auto_delete_minutes !== undefined && settings.auto_delete_minutes !== null && !isNaN(settings.auto_delete_minutes)) ? Number(settings.auto_delete_minutes) : 30;
      let autoDeleteMinutes = globalTimer;
      if (post.auto_delete_minutes !== null && post.auto_delete_minutes !== undefined && post.auto_delete_minutes !== '') {
        const parsed = Number(post.auto_delete_minutes);
        if (!isNaN(parsed)) autoDeleteMinutes = parsed;
      }
      const protectContent = Boolean(settings.protect_all_posts || post.protect_content);

      // Construct Buttons
      const inlineButtons = [];
      if (post.direct_link) {
        const linkLabel = post.direct_link_title || 'Open / Download Link';
        inlineButtons.push([{ text: `📥 ${linkLabel}`, url: post.direct_link }]);
      }
      if (folders && folders.length > 0) {
        for (const folder of folders) {
          for (const file of folder.files || []) {
            const isLink = file.mime_type === 'link' || file.file_id?.startsWith('http://') || file.file_id?.startsWith('https://');
            if (isLink) {
              const linkBtnTitle = file.file_name || `${folder.name} Link`;
              inlineButtons.push([{ text: `🔗 ${linkBtnTitle}`, url: file.file_id }]);
            }
          }
        }
      }
      const replyMarkup = inlineButtons.length > 0 ? { inline_keyboard: inlineButtons } : undefined;

      // Caption
      const escapeMd = (t) => t ? String(t).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1') : '';
      let captionText = `📌 *${escapeMd(post.title)}*\n`;
      if (post.category && post.category !== 'All') {
        captionText += `📁 *Category:* \`${escapeMd(post.category)}\`\n`;
      }
      if (post.tags) {
        captionText += `🏷️ *Tags:* \`${escapeMd(post.tags)}\`\n`;
      }

      let sentCount = 0;
      let failedCount = 0;
      const failedDetails = [];
      const ephemeralRecords = [];

      for (const targetId of userIds) {
        try {
          let sentMid = null;
          let sendError = null;

          if (post.preview_image && post.preview_image.startsWith('http')) {
            const sendPhotoUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`;
            const pRes = await fetch(sendPhotoUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: targetId,
                photo: post.preview_image,
                caption: captionText,
                parse_mode: 'Markdown',
                protect_content: protectContent,
                reply_markup: replyMarkup
              })
            });
            const pData = await pRes.json();
            if (pData.ok && pData.result) {
              sentMid = pData.result.message_id;
              sentCount++;
            } else {
              sendError = pData.description || 'Photo delivery failed';
              const sendMsgUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
              const tRes = await fetch(sendMsgUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: targetId,
                  text: captionText,
                  parse_mode: 'Markdown',
                  protect_content: protectContent,
                  reply_markup: replyMarkup
                })
              });
              const tData = await tRes.json();
              if (tData.ok && tData.result) {
                sentMid = tData.result.message_id;
                sentCount++;
                sendError = null;
              } else {
                sendError = tData.description || sendError;
              }
            }
          } else {
            const sendMsgUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
            const tRes = await fetch(sendMsgUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: targetId,
                text: captionText,
                parse_mode: 'Markdown',
                protect_content: protectContent,
                reply_markup: replyMarkup
              })
            });
            const tData = await tRes.json();
            if (tData.ok && tData.result) {
              sentMid = tData.result.message_id;
              sentCount++;
            } else {
              sendError = tData.description || 'Message delivery failed';
            }
          }

          if (sentMid) {
            if (autoDeleteMinutes > 0) {
              const minuteUnit = autoDeleteMinutes === 1 ? '1 minute' : `${autoDeleteMinutes} minutes`;
              const noticeText = `⏳ ⚠️ *Auto-Delete Warning:*\n\n` +
                `This message and all files/links above will automatically self-destruct & delete in *${minuteUnit}*!\n\n` +
                (protectContent
                  ? `🔒 *Content protection is enabled (forwarding & saving restricted).*`
                  : `👉 *Please forward or save to your Saved Messages now before they disappear.*`);

              const nRes = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: targetId,
                  text: noticeText,
                  parse_mode: 'Markdown',
                  protect_content: protectContent
                })
              });
              const nData = await nRes.json();
              const noticeMid = (nData.ok && nData.result) ? nData.result.message_id : null;

              const deleteAt = new Date(Date.now() + autoDeleteMinutes * 60 * 1000).toISOString();
              ephemeralRecords.push({
                chat_id: targetId,
                message_id: sentMid,
                delete_at: deleteAt,
                is_deleted: false
              });
              if (noticeMid) {
                ephemeralRecords.push({
                  chat_id: targetId,
                  message_id: noticeMid,
                  delete_at: deleteAt,
                  is_deleted: false
                });
              }
            }
          } else {
            failedCount++;
            failedDetails.push({
              user_id: targetId,
              reason: sendError || 'Delivery failed'
            });
          }
        } catch (uErr) {
          failedCount++;
          failedDetails.push({
            user_id: targetId,
            reason: uErr.message || 'Network exception'
          });
        }
      }

      if (ephemeralRecords.length > 0) {
        await addEphemeralMessages(env, ephemeralRecords);
      }

      return jsonResponse({
        success: true,
        sent_count: sentCount,
        failed_count: failedCount,
        total_targeted: userIds.length,
        total_users: userIds.length,
        failed_details: failedDetails
      });
    } catch (err) {
      console.error('API broadcast post error:', err);
      return errorResponse(err.message, 500);
    }
  });

  // -------------------------------------------------------------
  // Post Edit (Admin Only) - Supports POST /edit, PATCH, PUT, POST
  // -------------------------------------------------------------
  const handleEditPost = async (request, env) => {
    try {
      const { id } = request.params;
      const url = new URL(request.url);
      const queryUserId = url.searchParams.get('user_id');
      const body = await request.json().catch(() => ({}));
      const actualUserId = queryUserId || body.user_id || body.admin_id;

      if (!actualUserId || !(await isAdminUser(env, actualUserId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const {
        title,
        preview_image,
        direct_link,
        direct_link_title,
        category,
        tags,
        status,
        scheduled_at,
        is_promoted,
        auto_delete_minutes,
        protect_content
      } = body || {};

      const updatePayload = {};
      if (title !== undefined) updatePayload.title = title ? title.trim() : 'Untitled Post';
      if (preview_image !== undefined) updatePayload.preview_image = preview_image ? preview_image.trim() : null;
      if (direct_link !== undefined) updatePayload.direct_link = direct_link ? direct_link.trim() : null;
      if (direct_link_title !== undefined) updatePayload.direct_link_title = direct_link_title ? direct_link_title.trim() : null;
      if (category !== undefined) updatePayload.category = category || 'All';
      if (tags !== undefined) updatePayload.tags = tags || '';
      if (status !== undefined) updatePayload.status = status;
      if (scheduled_at !== undefined) updatePayload.scheduled_at = scheduled_at ? scheduled_at : null;
      if (is_promoted !== undefined) updatePayload.is_promoted = Boolean(is_promoted);
      if (auto_delete_minutes !== undefined) {
        updatePayload.auto_delete_minutes = (auto_delete_minutes !== null && auto_delete_minutes !== '' && !isNaN(auto_delete_minutes)) ? Number(auto_delete_minutes) : null;
      }
      if (protect_content !== undefined) updatePayload.protect_content = Boolean(protect_content);
      if (body && body.size) {
        const s = body.size.trim();
        if (updatePayload.title && !updatePayload.title.includes('(')) {
          updatePayload.title = `${updatePayload.title} (${s})`;
        }
      }

      const updated = await updatePost(env, id, updatePayload);
      return jsonResponse({ success: true, post: updated });
    } catch (err) {
      console.error('API edit post error:', err);
      return errorResponse(err.message, 500);
    }
  };

  router.post('/api/admin/posts/:id/edit', handleEditPost);
  router.patch('/api/admin/posts/:id', handleEditPost);
  router.post('/api/admin/posts/:id', handleEditPost);
  router.put('/api/admin/posts/:id', handleEditPost);

  // -------------------------------------------------------------
  // POST /api/admin/users/:id/message - Send Direct Message to User via Bot
  // -------------------------------------------------------------
  router.post('/api/admin/users/:id/message', async (request, env) => {
    try {
      const url = new URL(request.url);
      const queryUserId = url.searchParams.get('user_id');
      const body = await request.json().catch(() => ({}));
      const adminId = queryUserId || body.admin_id;

      if (!adminId || !(await isAdminUser(env, adminId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      const targetUserId = request.params.id;
      const text = (body.text || body.message || '').trim();
      if (!text) {
        return errorResponse('Message text is required', 400);
      }

      if (!env.BOT_TOKEN) {
        return errorResponse('BOT_TOKEN is not configured in Worker environment', 500);
      }

      const tgRes = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetUserId,
          text: text,
          parse_mode: 'Markdown'
        })
      });

      const tgData = await tgRes.json();
      if (!tgData.ok) {
        return errorResponse(tgData.description || 'Failed to send message via Telegram', 400);
      }

      return jsonResponse({ success: true, result: tgData.result });
    } catch (err) {
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

      if (!userId || !(await isAdminUser(env, userId))) {
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
  const handleModerateComment = async (request, env) => {
    try {
      const url = new URL(request.url);
      const queryUserId = url.searchParams.get('user_id');
      const body = await request.json().catch(() => ({}));
      const commentId = request.params?.id || body.comment_id;
      const actualUserId = queryUserId || body.user_id || body.admin_id;
      const action = request.method === 'DELETE' ? 'delete' : (body.action || 'hide');

      if (!actualUserId || !(await isAdminUser(env, actualUserId))) {
        return errorResponse('Unauthorized admin action', 403);
      }

      if (!commentId) {
        return errorResponse('Missing comment_id', 400);
      }

      const result = await moderateComment(env, { comment_id: commentId, action });
      return jsonResponse({ success: true, result });
    } catch (err) {
      console.error('API comment moderate error:', err);
      return errorResponse(err.message, 500);
    }
  };

  router.post('/api/comments/moderate', handleModerateComment);
  router.post('/api/admin/comments/:id/moderate', handleModerateComment);
  router.delete('/api/admin/comments/:id', handleModerateComment);

  // -------------------------------------------------------------
  // POST /api/likes & POST /api/posts/:id/like - Toggle Like
  // -------------------------------------------------------------
  const handleToggleLike = async (request, env) => {
    try {
      const body = await request.json().catch(() => ({}));
      const url = new URL(request.url);
      const queryUserId = url.searchParams.get('user_id');
      const postId = request.params?.id || body.post_id;
      const userId = queryUserId || body.user_id;

      if (!postId || !userId) {
        return errorResponse('Missing required fields: post_id and user_id are required.', 400);
      }

      const result = await toggleLike(env, {
        post_id: Number(postId),
        user_id: Number(userId)
      });

      return jsonResponse({
        success: true,
        liked: result.liked,
        like_count: result.like_count
      });
    } catch (err) {
      console.error('API like toggle error:', err);
      return errorResponse(err.message, 500);
    }
  };

  router.post('/api/posts/:id/like', handleToggleLike);
  router.post('/api/likes', handleToggleLike);

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

      const allowedUpdates = JSON.stringify(['message', 'callback_query', 'my_chat_member']);
      let apiUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}&allowed_updates=${encodeURIComponent(allowedUpdates)}`;
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
