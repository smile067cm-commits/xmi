import { Telegraf, Markup } from 'telegraf';
import {
  saveOrUpdateUser,
  getPostById,
  getAllPostsForAdmin,
  getPublishedPosts,
  getSavedPosts,
  getPostFoldersWithFiles,
  getFolderFiles,
  getFolderById,
  updateFolder,
  createPost,
  updatePost,
  deletePost,
  togglePromotePost,
  createFolder,
  createFiles,
  deleteFile,
  deleteFolder,
  getGlobalStats,
  getSettings,
  updateSetting,
  getForceChannels,
  addForceChannel,
  removeForceChannel,
  getShorteners,
  addShortener,
  deleteShortener,
  processReferral,
  createVerifyToken,
  verifyTokenAndGrantPass,
  checkAndDeductPostAccess,
  addEphemeralMessages,
  processEphemeralDeletions,
  getAllUserIds,
  getAllRegisteredUserIds,
  getActiveUserIds,
  getBlockedUserIds,
  getAllUsers,
  getUser,
  isAdminUser,
  getAdmins,
  addAdmin,
  deleteAdmin,
  getDatabaseStorageStats,
  optimizeDatabase,
  recordPostView,
  recordFileAccess,
  updateUserBlockedStatus,
  getNextPostNumber,
  formatBytes,
  logUserMessage,
  toggleLike
} from './db.js';
import { getSession, setSession, clearSession } from './session.js';

/**
 * Escapes characters for Telegram Markdown format
 */
function escapeMarkdown(text) {
  if (!text) return '';
  return String(text).replace(/([_*`\[\]])/g, '\\$1');
}

/**
 * Clean nested post display titles (e.g. Post #69 (Post #64 (16.9 MB)) -> Post #64 (16.9 MB))
 */
function cleanPostDisplayTitle(title, fallbackId = '') {
  if (!title) return `Post #${fallbackId}`;
  let t = String(title).trim();
  const m = t.match(/^Post\s*#\d+\s*\((.+)\)$/i);
  if (m && m[1]) {
    if (/^Post\s*#\d+/i.test(m[1])) {
      return m[1];
    }
  }
  return t;
}

/**
 * Formats a Date or ISO string into Indian Standard Time (IST, UTC+5:30)
 */
function formatIST(dateInput, includeTime = true) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    } : {})
  }) + (includeTime ? ' IST' : '');
}

/**
 * Checks if a user has joined all required force-join channels
 */
async function checkForceJoin(ctx, env, userId) {
  if (await isAdminUser(env, userId)) return { passed: true };
  try {
    const settings = await getSettings(env);
    if (!settings.force_join_enabled) return { passed: true };

    const channels = await getForceChannels(env);
    if (!channels || channels.length === 0) return { passed: true };

    const unjoined = [];
    const checkPromises = channels.map(async (ch) => {
      try {
        const member = await ctx.telegram.getChatMember(ch.channel_id, userId);
        const validStatuses = ['creator', 'administrator', 'member', 'restricted'];
        if (!validStatuses.includes(member.status)) {
          return ch;
        }
      } catch (e) {
        console.warn(`Could not check membership for channel ${ch.channel_id}:`, e.message);
        return ch;
      }
      return null;
    });

    const results = await Promise.all(checkPromises);
    for (const r of results) {
      if (r) unjoined.push(r);
    }

    if (unjoined.length > 0) {
      return { passed: false, unjoined };
    }
    return { passed: true };
  } catch (err) {
    console.error('Error in checkForceJoin:', err);
    return { passed: true };
  }
}

/**
 * Checks if user has points to unlock content or generates multi-shortener verify link
 */
async function checkLockerPass(ctx, env, userId, postId) {
  if (await isAdminUser(env, userId)) return { passed: true };
  try {
    const result = await checkAndDeductPostAccess(env, userId, postId);
    if (result.allowed) {
      return {
        passed: true,
        pointsDeducted: result.points_deducted,
        remainingPoints: result.remaining_points
      };
    }

    const tokenObj = await createVerifyToken(env, userId, postId);
    const settings = await getSettings(env);

    return {
      passed: false,
      verifyUrl: tokenObj.verify_url,
      rewardPoints: tokenObj.reward_points,
      requiredPoints: result.required_points,
      currentPoints: result.current_points,
      shortenerName: tokenObj.shortener_name,
      settings
    };
  } catch (err) {
    console.error('Error in checkLockerPass:', err);
    return { passed: true };
  }
}

/**
 * Delivers post details, files, and links (as buttons) to user with auto-deletion timer & content protection
 */
async function sendPostToUser(ctx, env, post, postId) {
  // Record file access / download (user requested download/file delivery)
  if (postId && ctx.from?.id) {
    recordFileAccess(env, {
      post_id: Number(postId),
      item_name: post.title || `Post #${postId}`,
      user_id: Number(ctx.from.id),
      username: ctx.from.username || null,
      first_name: ctx.from.first_name || ''
    }).catch(e => console.warn('Record file access warning in bot:', e.message));
  }

  const [folders, settings] = await Promise.all([
    getPostFoldersWithFiles(env, postId),
    getSettings(env)
  ]);
  const globalTimer = (settings.auto_delete_minutes !== undefined && settings.auto_delete_minutes !== null && !isNaN(settings.auto_delete_minutes)) ? Number(settings.auto_delete_minutes) : 30;
  let autoDeleteMinutes = globalTimer;
  if (post.auto_delete_minutes !== null && post.auto_delete_minutes !== undefined && post.auto_delete_minutes !== '') {
    const parsed = Number(post.auto_delete_minutes);
    if (!isNaN(parsed)) {
      autoDeleteMinutes = parsed;
    }
  }
  const protectContent = Boolean(settings.protect_all_posts || post.protect_content);

  const sentMessageIds = [];
  const inlineButtons = [];
  const physicalFiles = [];

  // 1. Direct Link Button ONLY (if present)
  if (post.direct_link) {
    const linkLabel = post.direct_link_title || 'Open / Download Link';
    inlineButtons.push([Markup.button.url(`📥 ${linkLabel}`, post.direct_link)]);
  }

  // 2. Folder Link Buttons ONLY (if present)
  if (folders && folders.length > 0) {
    for (const folder of folders) {
      const files = folder.files || [];
      for (const file of files) {
        const isLink = file.mime_type === 'link' || file.file_id?.startsWith('http://') || file.file_id?.startsWith('https://');
        if (isLink) {
          const linkBtnTitle = file.file_name || `${folder.name} Link`;
          inlineButtons.push([Markup.button.url(`🔗 ${linkBtnTitle}`, file.file_id)]);
        } else {
          physicalFiles.push({ folder, file });
        }
      }
    }
  }

  // 3. Clean Caption (Title, Category, Tags)
  let captionText = `📌 *${escapeMarkdown(post.title)}*\n`;
  if (post.category && post.category !== 'All') {
    captionText += `📁 *Category:* \`${escapeMarkdown(post.category)}\`\n`;
  }
  if (post.tags) {
    captionText += `🏷️ *Tags:* \`${escapeMarkdown(post.tags)}\`\n`;
  }

  if (physicalFiles.length > 0) {
    captionText += `\n📥 *Delivering ${physicalFiles.length} file(s) below:*`;
  }

  const keyboardMarkup = inlineButtons.length > 0 ? Markup.inlineKeyboard(inlineButtons) : undefined;

  // 4. Send Image, Title, and Link Buttons in ONE Message
  if (post.preview_image) {
    try {
      const imgMsg = await ctx.replyWithPhoto(post.preview_image, {
        caption: captionText,
        parse_mode: 'Markdown',
        protect_content: protectContent,
        ...(keyboardMarkup || {})
      });
      if (imgMsg?.message_id) sentMessageIds.push(imgMsg.message_id);
    } catch (e) {
      console.warn('Could not send photo, falling back to text:', e.message);
      const txtMsg = await ctx.reply(captionText, {
        parse_mode: 'Markdown',
        protect_content: protectContent,
        ...(keyboardMarkup || {})
      });
      if (txtMsg?.message_id) sentMessageIds.push(txtMsg.message_id);
    }
  } else {
    const txtMsg = await ctx.reply(captionText, {
      parse_mode: 'Markdown',
      protect_content: protectContent,
      ...(keyboardMarkup || {})
    });
    if (txtMsg?.message_id) sentMessageIds.push(txtMsg.message_id);
  }

  // 5. Send Physical Files Separately ONLY if Physical Files Exist
  if (physicalFiles.length > 0) {
    for (const { folder, file } of physicalFiles) {
      try {
        if (file.channel_message_id && env.CHANNEL_ID) {
          const copied = await ctx.telegram.copyMessage(
            ctx.chat.id,
            env.CHANNEL_ID,
            Number(file.channel_message_id),
            { protect_content: protectContent, caption: '' }
          );
          if (copied?.message_id) sentMessageIds.push(copied.message_id);
        } else if (file.file_id) {
          const sentDoc = await ctx.telegram.sendDocument(ctx.chat.id, file.file_id, {
            protect_content: protectContent
          });
          if (sentDoc?.message_id) sentMessageIds.push(sentDoc.message_id);
        }
      } catch (fileErr) {
        console.warn(`Failed to deliver file ${file.id}:`, fileErr.message);
      }
    }
  }

  // 6. Send Expires Warning & Anti-Block Retention Notice as a SEPARATE MESSAGE
  if (autoDeleteMinutes > 0) {
    const minuteUnit = autoDeleteMinutes === 1 ? '1 minute' : `${autoDeleteMinutes} minutes`;
    const noticeText = `⏳ ⚠️ *Auto-Delete Notice:*\n\n` +
      `All files and messages above will automatically delete in *${minuteUnit}* to protect content!\n\n` +
      `💡 *Keep this bot unblocked & unmuted* so you can re-download anytime and get notified when new files drop!\n\n` +
      (protectContent
        ? `🔒 *Content protection is enabled (forwarding & saving restricted).*`
        : `👉 *Please forward or save to your Saved Messages now before they disappear.*`);

    const appUrl = env.WEB_APP_URL || 'https://xmi.lakshminighty1.workers.dev';
    const userAppUrl = appUrl ? (appUrl.includes('?') ? `${appUrl}&user_id=${ctx.from?.id}` : `${appUrl}?user_id=${ctx.from?.id}`) : appUrl;
    const noticeButtons = [];
    if (userAppUrl.startsWith('https://')) {
      noticeButtons.push([Markup.button.webApp('🚀 Open Mini App (Browse All Files)', userAppUrl)]);
    }

    try {
      const noticeMsg = await ctx.reply(noticeText, {
        parse_mode: 'Markdown',
        protect_content: protectContent,
        ...(noticeButtons.length > 0 ? Markup.inlineKeyboard(noticeButtons) : {})
      });
      if (noticeMsg?.message_id) sentMessageIds.push(noticeMsg.message_id);
    } catch (nErr) {
      console.warn('Failed to send auto-delete notice:', nErr.message);
    }

    // Register all sent message IDs for auto-deletion in the background
    if (sentMessageIds.length > 0) {
      const deleteAt = new Date(Date.now() + autoDeleteMinutes * 60 * 1000).toISOString();
      const records = sentMessageIds.map(mid => ({
        chat_id: ctx.chat.id,
        message_id: mid,
        delete_at: deleteAt,
        is_deleted: false
      }));
      await addEphemeralMessages(env, records).catch(e => console.warn('Ephemeral add error:', e.message));
    }
  }

  // Background cleanup of any past expired messages (non-blocking)
  processEphemeralDeletions(env).catch(e => console.warn('Ephemeral cleanup warning:', e.message));
}

/**
 * Sends a single requested file directly to the user in Telegram
 */
export async function sendSingleFileToUser(ctx, env, post, file) {
  let settings = {};
  try {
    settings = await getBotSettings(env) || {};
  } catch (e) {
    settings = {};
  }

  let autoDeleteMinutes = 0;
  if (post.auto_delete_minutes !== null && post.auto_delete_minutes !== undefined) {
    const parsed = Number(post.auto_delete_minutes);
    if (!isNaN(parsed) && parsed >= 0) autoDeleteMinutes = parsed;
  } else if (settings.auto_delete_minutes !== null && settings.auto_delete_minutes !== undefined) {
    const parsed = Number(settings.auto_delete_minutes);
    if (!isNaN(parsed) && parsed >= 0) autoDeleteMinutes = parsed;
  }
  const protectContent = Boolean(settings.protect_all_posts || post.protect_content);

  const sentMessageIds = [];
  const sizeMB = file.size ? (Number(file.size) / (1024 * 1024)).toFixed(1) : 'Unknown';
  const fileName = file.file_name || 'File';

  const captionText = `📁 *${escapeMarkdown(fileName)}*\n` +
    `📦 *Size:* \`${sizeMB} MB\`\n` +
    `📌 *From Post:* \`${escapeMarkdown(post.title)}\``;

  try {
    if (file.channel_message_id && env.CHANNEL_ID) {
      const copied = await ctx.telegram.copyMessage(
        ctx.chat.id,
        env.CHANNEL_ID,
        Number(file.channel_message_id),
        { protect_content: protectContent, caption: captionText, parse_mode: 'Markdown' }
      );
      if (copied?.message_id) sentMessageIds.push(copied.message_id);
    } else if (file.file_id) {
      const isVideo = (file.mime_type && file.mime_type.startsWith('video/')) || /\.(mp4|mkv|mov|webm)$/i.test(fileName);
      let sentMsg;
      if (isVideo) {
        sentMsg = await ctx.telegram.sendVideo(ctx.chat.id, file.file_id, {
          caption: captionText,
          parse_mode: 'Markdown',
          protect_content: protectContent
        }).catch(async () => {
          return await ctx.telegram.sendDocument(ctx.chat.id, file.file_id, {
            caption: captionText,
            parse_mode: 'Markdown',
            protect_content: protectContent
          });
        });
      } else {
        sentMsg = await ctx.telegram.sendDocument(ctx.chat.id, file.file_id, {
          caption: captionText,
          parse_mode: 'Markdown',
          protect_content: protectContent
        });
      }
      if (sentMsg?.message_id) sentMessageIds.push(sentMsg.message_id);
    }
  } catch (fileErr) {
    console.warn(`Failed to deliver single file ${file.id}:`, fileErr.message);
    await ctx.reply(`⚠️ Failed to deliver file: ${fileErr.message}`);
  }

  if (autoDeleteMinutes > 0) {
    const minuteUnit = autoDeleteMinutes === 1 ? '1 minute' : `${autoDeleteMinutes} minutes`;
    const noticeText = `⏳ ⚠️ *Auto-Delete Notice:*\n\n` +
      `This file will automatically delete in *${minuteUnit}* to protect content!\n\n` +
      (protectContent
        ? `🔒 *Content protection is enabled (forwarding & saving restricted).*`
        : `👉 *Please forward or save to your Saved Messages now before it disappears.*`);

    const appUrl = env.WEB_APP_URL || 'https://xmi.lakshminighty1.workers.dev';
    const userAppUrl = appUrl ? (appUrl.includes('?') ? `${appUrl}&user_id=${ctx.from?.id}` : `${appUrl}?user_id=${ctx.from?.id}`) : appUrl;
    const noticeButtons = [];
    if (userAppUrl.startsWith('https://')) {
      noticeButtons.push([Markup.button.webApp('🚀 Open Mini App', userAppUrl)]);
    }

    try {
      const noticeMsg = await ctx.reply(noticeText, {
        parse_mode: 'Markdown',
        protect_content: protectContent,
        ...(noticeButtons.length > 0 ? Markup.inlineKeyboard(noticeButtons) : {})
      });
      if (noticeMsg?.message_id) sentMessageIds.push(noticeMsg.message_id);
    } catch (nErr) {
      console.warn('Failed to send auto-delete notice:', nErr.message);
    }

    if (sentMessageIds.length > 0) {
      const deleteAt = new Date(Date.now() + autoDeleteMinutes * 60 * 1000).toISOString();
      const records = sentMessageIds.map(mid => ({
        chat_id: ctx.chat.id,
        message_id: mid,
        delete_at: deleteAt,
        is_deleted: false
      }));
      await addEphemeralMessages(env, records).catch(e => console.warn('Ephemeral add error:', e.message));
    }
  }

  processEphemeralDeletions(env).catch(e => console.warn('Ephemeral cleanup warning:', e.message));
}

/**
 * Creates and configures the Telegraf Bot instance
 */
export function createBot(env) {
  const bot = new Telegraf(env.BOT_TOKEN);
  const appUrl = env.WEB_APP_URL || 'https://xmi.lakshminighty1.workers.dev';

  // -------------------------------------------------------------
  // Middleware: User Tracking
  // -------------------------------------------------------------
  bot.use(async (ctx, next) => {
    try {
      if (ctx.from) {
        saveOrUpdateUser(env, ctx.from).catch(err => {
          console.error('Failed to log user to Supabase:', err);
        });

        // Log messages and button interactions for admin activity inspection
        if (ctx.message?.text) {
          logUserMessage(env, ctx.from.id, ctx.message.text, 'text').catch(() => {});
        } else if (ctx.callbackQuery?.data) {
          logUserMessage(env, ctx.from.id, `[Button] ${ctx.callbackQuery.data}`, 'callback').catch(() => {});
        }
      }
      return await next();
    } catch (err) {
      console.error('Unhandled Bot Middleware Error:', err);
      if (ctx.chat) {
        await ctx.reply('⚠️ An unexpected error occurred. Please try again.');
      }
    }
  });

  // -------------------------------------------------------------
  // Event: my_chat_member (Detect Bot Block & Unblock events)
  // -------------------------------------------------------------
  bot.on('my_chat_member', async (ctx) => {
    try {
      const update = ctx.update?.my_chat_member;
      const targetUserId = update?.from?.id || update?.chat?.id;
      const newStatus = update?.new_chat_member?.status;

      if (targetUserId) {
        if (newStatus === 'kicked' || newStatus === 'left') {
          // User blocked the bot
          await updateUserBlockedStatus(env, targetUserId, true);
          logUserMessage(env, targetUserId, '🚫 User stopped / blocked the Telegram bot', 'block').catch(() => {});
        } else if (newStatus === 'member') {
          // User unblocked / started the bot
          await updateUserBlockedStatus(env, targetUserId, false);
          logUserMessage(env, targetUserId, '🟢 User started / unblocked the Telegram bot', 'unblock').catch(() => {});
          if (update.from) {
            await saveOrUpdateUser(env, update.from);
          }
        }
      }
    } catch (e) {
      console.warn('Error handling my_chat_member update:', e.message);
    }
  });

  /**
   * Sends 3 latest posts as interactive cards directly to the chat
   */
  async function sendPostFeedToUser(ctx, env, page = 1) {
    const userId = ctx.from?.id;
    const PAGE_SIZE = 3;

    // Fetch published posts and force channels using existing db functions
    const [allPosts, channels] = await Promise.all([
      getPublishedPosts(env, userId).catch(err => {
        console.error('Error fetching published posts for feed:', err);
        return [];
      }),
      getForceChannels(env).catch(() => [])
    ]);

    const totalCount = allPosts.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const safePage = Math.max(1, Math.min(page, totalPages));
    const offset = (safePage - 1) * PAGE_SIZE;
    const posts = allPosts.slice(offset, offset + PAGE_SIZE);

    const appUrl = env.WEB_APP_URL || 'https://xmi.lakshminighty1.workers.dev';
    const userAppUrl = appUrl ? (appUrl.includes('?') ? `${appUrl}&user_id=${userId}` : `${appUrl}?user_id=${userId}`) : appUrl;

    if (userAppUrl.startsWith('https://')) {
      ctx.setChatMenuButton({
        type: 'web_app',
        text: '🚀 Open App',
        web_app: { url: userAppUrl }
      }).catch(() => {});
    }

    if (!posts || posts.length === 0) {
      return await ctx.reply('✨ No posts available yet. Check back soon!', {
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🚀 Open Mini App', userAppUrl)]
        ])
      });
    }

    // Send each of the 3 posts as interactive preview cards
    for (const post of posts) {
      const isLiked = Boolean(post.liked);
      const likeCount = post.like_count || 0;
      const cleanTitle = cleanPostDisplayTitle(post.title, post.id);

      // Record View event for this post card
      if (post.id && userId) {
        recordPostView(env, {
          post_id: Number(post.id),
          user_id: Number(userId),
          username: ctx.from?.username || null,
          first_name: ctx.from?.first_name || ''
        }).catch(() => {});
      }

      let caption = `📌 *${escapeMarkdown(cleanTitle)}*\n`;
      if (post.category && post.category !== 'All') caption += `📁 *Category:* \`${escapeMarkdown(post.category)}\`\n`;

      const botUser = env.BOT_USERNAME || 'xminty_bot';
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${botUser}?start=post_${post.id}`)}&text=${encodeURIComponent(`🔥 Check out: ${cleanTitle}`)}`;

      const postKeyboard = [
        [
          Markup.button.callback('📥 Get File / Download', `bot_get_post_${post.id}`),
          Markup.button.callback(isLiked ? `❤️ Liked (${likeCount})` : `🤍 Like (${likeCount})`, `bot_like_${post.id}`)
        ],
        [
          Markup.button.url('📤 Share Post to Friends / Groups', shareUrl)
        ]
      ];

      if (post.preview_image && (post.preview_image.endsWith('.jpg') || post.preview_image.endsWith('.png') || post.preview_image.endsWith('.webp') || post.preview_image.includes('.jpg') || post.preview_image.includes('.png'))) {
        try {
          await ctx.replyWithPhoto(post.preview_image, {
            caption,
            parse_mode: 'Markdown',
            protect_content: true,
            ...Markup.inlineKeyboard(postKeyboard)
          });
        } catch (e) {
          try {
            await ctx.reply(caption, {
              parse_mode: 'Markdown',
              protect_content: true,
              ...Markup.inlineKeyboard(postKeyboard)
            });
          } catch (e2) {
            await ctx.reply(cleanTitle, {
              protect_content: true,
              ...Markup.inlineKeyboard(postKeyboard)
            }).catch(() => {});
          }
        }
      } else {
        try {
          await ctx.reply(caption, {
            parse_mode: 'Markdown',
            protect_content: true,
            ...Markup.inlineKeyboard(postKeyboard)
          });
        } catch (e2) {
          await ctx.reply(cleanTitle, {
            protect_content: true,
            ...Markup.inlineKeyboard(postKeyboard)
          }).catch(() => {});
        }
      }
    }

    // Navigation & Mini App recommendation card
    const navButtons = [];
    if (userAppUrl.startsWith('https://')) {
      navButtons.push([Markup.button.webApp('🚀 Open Mini App (Best Experience)', userAppUrl)]);
    }

    // Pagination buttons
    const pageRow = [];
    if (safePage > 1) {
      pageRow.push(Markup.button.callback(`⬅️ Prev 3 Posts`, `bot_feed_page_${safePage - 1}`));
    }
    if (safePage < totalPages) {
      pageRow.push(Markup.button.callback(`➡️ Next 3 Posts`, `bot_feed_page_${safePage + 1}`));
    }
    if (pageRow.length > 0) {
      navButtons.push(pageRow);
    }

    // Official Channel / Backup Channel link
    if (channels && channels.length > 0 && channels[0].invite_link) {
      navButtons.push([Markup.button.url('📢 Join Official Channel', channels[0].invite_link)]);
    }

    const footerText = `✨ *Use our Telegram Mini App for the best experience!*\n\n` +
      `Instant search, faster browsing, and full collection of *${totalCount}+* posts.\n\n` +
      `📄 *Showing Page ${safePage} of ${totalPages}*`;

    return await ctx.reply(footerText, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(navButtons)
    });
  }

  async function showMainMenu(ctx) {
    const userId = ctx.from?.id;

    // Fetch admin status, settings, and user points in parallel
    const [isAdmin, settings, userObj] = await Promise.all([
      isAdminUser(env, userId),
      getSettings(env),
      getUser(env, userId).catch(() => null)
    ]);

    const userAppUrl = appUrl ? (appUrl.includes('?') ? `${appUrl}&user_id=${userId}` : `${appUrl}?user_id=${userId}`) : appUrl;

    if (userAppUrl.startsWith('https://')) {
      ctx.setChatMenuButton({
        type: 'web_app',
        text: '🚀 Open App',
        web_app: { url: userAppUrl }
      }).catch(() => {});
    }

    if (isAdmin) {
      // Admin Control Panel
      const inlineButtons = [
        [Markup.button.webApp('🚀 Open Mini App', userAppUrl)],
        [
          Markup.button.callback('➕ Create Post', 'admin_menu_addpost'),
          Markup.button.callback('📑 Manage Posts', 'admin_post_list')
        ],
        [
          Markup.button.callback('📊 Statistics', 'admin_stats'),
          Markup.button.callback('📢 Broadcast', 'admin_menu_broadcast')
        ],
        [
          Markup.button.callback('👥 Manage Admins', 'admin_menu_admins'),
          Markup.button.callback('💾 Storage Meter', 'admin_menu_storage')
        ],
        [
          Markup.button.callback('⚙️ Hub Settings', 'admin_menu_settings'),
          Markup.button.callback('🔍 Browse Posts (Feed)', 'bot_feed_page_1')
        ]
      ];

      const text = `👑 *Admin Control Panel*\n\n` +
        `Welcome back, *${escapeMarkdown(ctx.from?.first_name || 'Admin')}*!\n` +
        `Choose an action using the buttons below:`;

      if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
        try {
          return await ctx.editMessageText(text, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(inlineButtons)
          });
        } catch (e) {
          return await ctx.reply(text, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(inlineButtons)
          });
        }
      } else {
        return await ctx.reply(text, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(inlineButtons)
        });
      }
    } else {
      // Regular User: Send 3 posts automatically
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
      }
      return await sendPostFeedToUser(ctx, env, 1);
    }
  }

  // -------------------------------------------------------------
  // /start handler with Deep Linking (Case-Insensitive & Typo-Tolerant)
  // -------------------------------------------------------------
  const handleStart = async (ctx) => {
    let payload = ctx.startPayload || '';
    if (!payload && ctx.match && ctx.match[2]) {
      payload = ctx.match[2].trim();
    }
    const userId = ctx.from?.id;

    // 1. Referral Deep Link: ref_<inviter_id>
    if (payload.startsWith('ref_')) {
      const inviterId = payload.replace('ref_', '').trim();
      if (inviterId && String(inviterId) !== String(userId)) {
        try {
          const res = await processReferral(env, inviterId, userId);
          if (res.awarded) {
            try {
              await ctx.telegram.sendMessage(
                inviterId,
                `🎉 *Referral Bonus!*\nA user joined using your link. You earned *+${res.points} Points*! 🪙`,
                { parse_mode: 'Markdown' }
              );
            } catch (e) {}
          }
        } catch (err) {
          console.error('Referral processing error:', err);
        }
      }
    }

    // 2. Shortener Verification Deep Link: verify_<token>
    if (payload.startsWith('verify_')) {
      const token = payload.replace('verify_', '').trim();
      try {
        const verifyRes = await verifyTokenAndGrantPass(env, token, userId);
        if (verifyRes.success) {
          await ctx.reply(
            `🎉 *Access Unlocked & Points Earned!*\n\n` +
            `• You received: *+${verifyRes.reward_points} Points* 🪙\n` +
            `• Current Balance: *${verifyRes.current_points} Points* 🪙\n\n` +
            `Delivering your requested content now...`,
            { parse_mode: 'Markdown' }
          );

          if (verifyRes.post_id) {
            const isAdmin = await isAdminUser(env, userId);
            const post = await getPostById(env, verifyRes.post_id, userId, isAdmin);
            if (post) {
              return await sendPostToUser(ctx, env, post, verifyRes.post_id);
            }
          }
          return await showMainMenu(ctx);
        } else {
          return await ctx.reply(
            `⚠️ *Verification Link Invalid or Expired*\n\nPlease generate a new access link.`,
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Main Menu', 'main_menu')]])
            }
          );
        }
      } catch (vErr) {
        console.error('Verification error:', vErr);
        return await ctx.reply('⚠️ Verification failed. Please try again.');
      }
    }

    // 3a. Single File Deep Link: file_<post_id>_<file_id>
    const singleFileMatch = payload.match(/^file_(\d+)_(\d+)$/);
    if (singleFileMatch) {
      const postId = singleFileMatch[1];
      const targetFileId = Number(singleFileMatch[2]);

      try {
        const isAdmin = await isAdminUser(env, ctx.from?.id);
        const post = await getPostById(env, postId, ctx.from?.id, isAdmin);

        if (!post) {
          return await ctx.reply('⚠️ Post or file not found.', {
            ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Main Menu', 'main_menu')]])
          });
        }

        if (post.status !== 'published' && !isAdmin) {
          return await ctx.reply('🔒 This post is not yet published.', {
            ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Main Menu', 'main_menu')]])
          });
        }

        // Force Join Check
        const fj = await checkForceJoin(ctx, env, ctx.from?.id);
        if (!fj.passed) {
          const buttons = fj.unjoined.map(ch => [Markup.button.url(`📢 Join ${ch.channel_title}`, ch.invite_link)]);
          buttons.push([Markup.button.callback('🔄 I Have Joined (Check Again)', `check_force_file_${postId}_${targetFileId}`)]);
          buttons.push([Markup.button.callback('🔙 Main Menu', 'main_menu')]);

          return await ctx.reply(
            `🔒 *Channel Membership Required*\n\nTo download this file, please join our official channels below:`,
            { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
          );
        }

        // Shortener & Points Locker Check
        const locker = await checkLockerPass(ctx, env, ctx.from?.id, postId);
        if (!locker.passed) {
          const buttons = [
            [Markup.button.url(`🔗 Complete Task (+${locker.rewardPoints} Pts)`, locker.verifyUrl)],
            [Markup.button.callback('🔄 Regenerate Link', `regen_verify_${postId}`)],
            [Markup.button.callback('🎁 Invite Friends', 'user_menu_invite')],
            [Markup.button.callback('🔙 Main Menu', 'main_menu')]
          ];

          return await ctx.reply(
            `🔐 *Points Required for Download*\n\n` +
            `• *Post Title:* \`${escapeMarkdown(post.title)}\`\n` +
            `• *Points Required:* \`${locker.requiredPoints} Points\` 🪙\n` +
            `• *Your Current Balance:* \`${locker.currentPoints} Points\` 🪙\n\n` +
            `Complete a quick task (+${locker.rewardPoints} Points) or invite friends to unlock access:`,
            { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
          );
        }

        recordPostView(env, {
          post_id: Number(postId),
          user_id: Number(ctx.from.id),
          username: ctx.from.username || null,
          first_name: ctx.from.first_name || ''
        }).catch(() => {});

        const allFiles = (post.folders || []).flatMap(f => f.files || []);
        const targetFile = allFiles.find(f => Number(f.id) === targetFileId || Number(f.channel_message_id) === targetFileId);

        if (!targetFile) {
          return await ctx.reply('⚠️ Requested file was not found in this post.', {
            ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Main Menu', 'main_menu')]])
          });
        }

        return await sendSingleFileToUser(ctx, env, post, targetFile);
      } catch (err) {
        console.error('Error handling /start file deep-link:', err);
        return await ctx.reply('⚠️ Error loading file. Please try again.');
      }
    }

    // 3. Post Deep Link: post_<post_id> or post<post_id>
    const postMatch = payload.match(/^post_?(\d+)$/);
    if (postMatch) {
      const postId = postMatch[1];
      
      try {
        const isAdmin = await isAdminUser(env, ctx.from?.id);
        const post = await getPostById(env, postId, ctx.from?.id, isAdmin);
        
        if (!post) {
          return await ctx.reply('⚠️ Post not found or has been removed.', {
            ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Main Menu', 'main_menu')]])
          });
        }

        if (post.status !== 'published' && !isAdmin) {
          return await ctx.reply('🔒 This post is not yet published.', {
            ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Main Menu', 'main_menu')]])
          });
        }

        // Force Join Check
        const fj = await checkForceJoin(ctx, env, ctx.from?.id);
        if (!fj.passed) {
          const buttons = fj.unjoined.map(ch => [Markup.button.url(`📢 Join ${ch.channel_title}`, ch.invite_link)]);
          buttons.push([Markup.button.callback('🔄 I Have Joined (Check Again)', `check_force_post_${postId}`)]);
          buttons.push([Markup.button.callback('🔙 Main Menu', 'main_menu')]);

          return await ctx.reply(
            `🔒 *Channel Membership Required*\n\n` +
            `To view this post and download its files, please join our official channels below:`,
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard(buttons)
            }
          );
        }

        // Shortener & Points Locker Check
        const locker = await checkLockerPass(ctx, env, ctx.from?.id, postId);
        if (!locker.passed) {
          const buttons = [
            [Markup.button.url(`🔗 Complete Task (+${locker.rewardPoints} Pts)`, locker.verifyUrl)],
            [Markup.button.callback('🔄 Regenerate Link', `regen_verify_${postId}`)],
            [Markup.button.callback('🎁 Invite Friends', 'user_menu_invite')],
            [Markup.button.callback('🔙 Main Menu', 'main_menu')]
          ];

          return await ctx.reply(
            `🔐 *Points Required for Download*\n\n` +
            `• *Post Title:* \`${escapeMarkdown(post.title)}\`\n` +
            `• *Points Required:* \`${locker.requiredPoints} Points\` 🪙\n` +
            `• *Your Current Balance:* \`${locker.currentPoints} Points\` 🪙\n\n` +
            `Complete a quick monetized shortener task (+${locker.rewardPoints} Points) or invite friends to unlock access:`,
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard(buttons)
            }
          );
        }

        recordPostView(env, {
          post_id: Number(postId),
          user_id: Number(ctx.from.id),
          username: ctx.from.username || null,
          first_name: ctx.from.first_name || ''
        }).catch(() => {});

        return await sendPostToUser(ctx, env, post, postId);

      } catch (err) {
        console.error('Error handling /start post deep-link:', err);
        return await ctx.reply('⚠️ Error loading post content. Please try again.');
      }
    }

    // Default Main Menu
    return await showMainMenu(ctx);
  };

  bot.start(handleStart);
  bot.hears(/^\/(start|Start|START|stsrt)(?:@\w+)?(?:\s+(.*))?$/i, handleStart);

  bot.action('main_menu', async (ctx) => {
    const userId = ctx.from?.id;
    const isAdmin = await isAdminUser(env, userId);
    if (isAdmin) {
      return await showMainMenu(ctx);
    }
    if (ctx.callbackQuery) await ctx.answerCbQuery();
    return await sendPostFeedToUser(ctx, env, 1);
  });

  bot.action('admin_main_menu', async (ctx) => {
    const userId = ctx.from?.id;
    const isAdmin = await isAdminUser(env, userId);
    if (!isAdmin) {
      if (ctx.callbackQuery) await ctx.answerCbQuery('⛔ Admin access only');
      return await sendPostFeedToUser(ctx, env, 1);
    }
    return await showMainMenu(ctx);
  });

  // -------------------------------------------------------------
  // Feed Pagination Callback: bot_feed_page_<N>
  // -------------------------------------------------------------
  bot.action(/^bot_feed_page_(\d+)$/, async (ctx) => {
    const page = Number(ctx.match[1]) || 1;
    await ctx.answerCbQuery(`Loading page ${page}...`);
    return await sendPostFeedToUser(ctx, env, page);
  });

  // -------------------------------------------------------------
  // In-Bot Like Toggle Callback: bot_like_<postId>
  // -------------------------------------------------------------
  bot.action(/^bot_like_(\d+)$/, async (ctx) => {
    try {
      const postId = Number(ctx.match[1]);
      const userId = Number(ctx.from?.id);
      if (!userId || !postId) return await ctx.answerCbQuery();

      const res = await toggleLike(env, { post_id: postId, user_id: userId });
      const liked = res.liked;
      const likeCount = res.like_count || 0;

      await ctx.answerCbQuery(liked ? '❤️ You liked this post!' : '🤍 Post unliked.');

      // Update message reply markup in place
      const currentMarkup = ctx.callbackQuery?.message?.reply_markup?.inline_keyboard;
      if (currentMarkup && Array.isArray(currentMarkup)) {
        const updatedMarkup = currentMarkup.map(row => {
          return row.map(btn => {
            if (btn.callback_data === `bot_like_${postId}`) {
              return Markup.button.callback(
                liked ? `❤️ Liked (${likeCount})` : `🤍 Like (${likeCount})`,
                `bot_like_${postId}`
              );
            }
            return btn;
          });
        });

        await ctx.editMessageReplyMarkup({ inline_keyboard: updatedMarkup }).catch(() => {});
      }
    } catch (e) {
      console.warn('Like callback error:', e.message);
      await ctx.answerCbQuery('Failed to update like');
    }
  });

  // -------------------------------------------------------------
  // In-Bot Post Delivery from Feed: bot_get_post_<postId>
  // -------------------------------------------------------------
  bot.action(/^bot_get_post_(\d+)$/, async (ctx) => {
    const postId = ctx.match[1];
    await ctx.answerCbQuery('Fetching file...');
    try {
      const isAdmin = await isAdminUser(env, ctx.from?.id);
      const post = await getPostById(env, postId, ctx.from?.id, isAdmin);
      if (!post) return await ctx.reply('⚠️ Post not found or has been removed.');

      // Force Join Check
      const fj = await checkForceJoin(ctx, env, ctx.from?.id);
      if (!fj.passed) {
        const buttons = fj.unjoined.map(ch => [Markup.button.url(`📢 Join ${ch.channel_title}`, ch.invite_link)]);
        buttons.push([Markup.button.callback('🔄 I Have Joined (Check Again)', `check_force_post_${postId}`)]);
        buttons.push([Markup.button.callback('🔙 Back to Feed', 'main_menu')]);

        return await ctx.reply(
          `🔒 *Channel Membership Required*\n\n` +
          `To view this post and download its files, please join our official channels below:`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
          }
        );
      }

      // Shortener & Points Locker Check
      const locker = await checkLockerPass(ctx, env, ctx.from?.id, postId);
      if (!locker.passed) {
        const buttons = [
          [Markup.button.url(`🔗 Complete Task (+${locker.rewardPoints} Pts)`, locker.verifyUrl)],
          [Markup.button.callback('🔄 Regenerate Link', `regen_verify_${postId}`)],
          [Markup.button.callback('🎁 Invite Friends', 'user_menu_invite')],
          [Markup.button.callback('🔙 Back to Feed', 'main_menu')]
        ];

        return await ctx.reply(
          `🔐 *Points Required for Download*\n\n` +
          `• *Post Title:* \`${escapeMarkdown(post.title)}\`\n` +
          `• *Points Required:* \`${locker.requiredPoints} Points\` 🪙\n` +
          `• *Your Current Balance:* \`${locker.currentPoints} Points\` 🪙\n\n` +
          `Complete a quick shortener task to unlock access:`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
          }
        );
      }

      return await sendPostToUser(ctx, env, post, postId);
    } catch (err) {
      console.error('Error in bot_get_post callback:', err);
      return await ctx.reply('⚠️ Error retrieving post content. Please try again.');
    }
  });

  // -------------------------------------------------------------
  // Check Force Join Callback
  // -------------------------------------------------------------
  bot.action(/^check_force_post_(\d+)$/, async (ctx) => {
    const postId = ctx.match[1];
    await ctx.answerCbQuery('Checking membership...');

    const fj = await checkForceJoin(ctx, env, ctx.from?.id);
    if (!fj.passed) {
      const buttons = fj.unjoined.map(ch => [Markup.button.url(`📢 Join ${ch.channel_title}`, ch.invite_link)]);
      buttons.push([Markup.button.callback('🔄 I Have Joined (Check Again)', `check_force_post_${postId}`)]);
      buttons.push([Markup.button.callback('🔙 Main Menu', 'main_menu')]);

      return await ctx.reply(
        `⚠️ You have not joined all required channels yet. Please join them first:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    }

    const isAdmin = await isAdminUser(env, ctx.from?.id);
    const post = await getPostById(env, postId, ctx.from?.id, isAdmin);
    if (!post) return await ctx.reply('⚠️ Post not found.');

    return await sendPostToUser(ctx, env, post, postId);
  });

  bot.action(/^check_force_file_(\d+)_(\d+)$/, async (ctx) => {
    const postId = ctx.match[1];
    const targetFileId = Number(ctx.match[2]);
    await ctx.answerCbQuery('Checking membership...');

    const fj = await checkForceJoin(ctx, env, ctx.from?.id);
    if (!fj.passed) {
      const buttons = fj.unjoined.map(ch => [Markup.button.url(`📢 Join ${ch.channel_title}`, ch.invite_link)]);
      buttons.push([Markup.button.callback('🔄 I Have Joined (Check Again)', `check_force_file_${postId}_${targetFileId}`)]);
      buttons.push([Markup.button.callback('🔙 Main Menu', 'main_menu')]);

      return await ctx.reply(
        `⚠️ You have not joined all required channels yet. Please join them first:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    }

    const isAdmin = await isAdminUser(env, ctx.from?.id);
    const post = await getPostById(env, postId, ctx.from?.id, isAdmin);
    if (!post) return await ctx.reply('⚠️ Post not found.');

    const allFiles = (post.folders || []).flatMap(f => f.files || []);
    const targetFile = allFiles.find(f => Number(f.id) === targetFileId || Number(f.channel_message_id) === targetFileId);
    if (!targetFile) return await ctx.reply('⚠️ Requested file was not found.');

    return await sendSingleFileToUser(ctx, env, post, targetFile);
  });

  // -------------------------------------------------------------
  // Check Locker Pass Callback
  // -------------------------------------------------------------
  bot.action(/^check_pass_post_(\d+)$/, async (ctx) => {
    const postId = ctx.match[1];
    await ctx.answerCbQuery('Checking access pass...');

    const locker = await checkLockerPass(ctx, env, ctx.from?.id, postId);
    if (!locker.passed) {
      const buttons = [
        [Markup.button.url('🔓 Verify Link & Unlock Access', locker.verifyUrl)],
        [Markup.button.callback('🔄 Check Access', `check_pass_post_${postId}`)],
        [Markup.button.callback('🔙 Main Menu', 'main_menu')]
      ];

      return await ctx.reply(
        `⚠️ Access pass is not yet active. Please complete verification first.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    }

    const isAdmin = await isAdminUser(env, ctx.from?.id);
    const post = await getPostById(env, postId, ctx.from?.id, isAdmin);
    if (!post) return await ctx.reply('⚠️ Post not found.');

    return await sendPostToUser(ctx, env, post, postId);
  });

  // -------------------------------------------------------------
  // Regenerate Verify Link Callback
  // -------------------------------------------------------------
  bot.action(/^regen_verify_(\d+)$/, async (ctx) => {
    const postId = ctx.match[1];
    await ctx.answerCbQuery('Generating fresh link...');
    const userId = ctx.from?.id;

    try {
      const tokenObj = await createVerifyToken(env, userId, postId);
      const post = await getPostById(env, postId, userId, true);

      const buttons = [
        [Markup.button.url(`🔗 Complete Task (+${tokenObj.reward_points} Pts)`, tokenObj.verify_url)],
        [Markup.button.callback('🔄 Regenerate Link Again', `regen_verify_${postId}`)],
        [Markup.button.callback('🎁 Invite Friends', 'user_menu_invite')],
        [Markup.button.callback('🔙 Main Menu', 'main_menu')]
      ];

      return await ctx.reply(
        `✨ *Fresh Verification Link Generated!*\n\n` +
        `• *Post:* \`${escapeMarkdown(post?.title || 'Download')}\`\n` +
        `• *Shortener:* \`${tokenObj.shortener_name}\`\n` +
        `• *Reward:* \`+${tokenObj.reward_points} Points\` 🪙\n\n` +
        `Tap below to complete task and unlock downloads:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    } catch (e) {
      console.error('Error generating token:', e);
      return await ctx.reply('⚠️ Failed to generate verification link. Please try again.');
    }
  });

  // -------------------------------------------------------------
  // Folder Click Callback: Send Files & Links
  // -------------------------------------------------------------
  bot.action(/^folder_(\d+)$/, async (ctx) => {
    const folderId = ctx.match[1];

    try {
      await ctx.answerCbQuery('Fetching folder contents...');

      const fj = await checkForceJoin(ctx, env, ctx.from?.id);
      if (!fj.passed) {
        const buttons = fj.unjoined.map(ch => [Markup.button.url(`📢 Join ${ch.channel_title}`, ch.invite_link)]);
        return await ctx.reply(
          `🔒 *Channel Membership Required*\nPlease join the required channels to access folder files:`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
          }
        );
      }

      const files = await getFolderFiles(env, folderId);

      if (!files || files.length === 0) {
        return await ctx.reply('📁 This folder has no files or links.');
      }

      await ctx.reply(`📁 Sending ${files.length} item(s)...`);

      for (const file of files) {
        try {
          const isLink = file.mime_type === 'link' || file.file_id?.startsWith('http://') || file.file_id?.startsWith('https://');

          if (isLink) {
            const linkTitle = file.file_name || 'Download Link';
            const linkUrl = file.file_id;
            
            await ctx.reply(
              `🔗 *${escapeMarkdown(linkTitle)}*\n\n${escapeMarkdown(linkUrl)}`,
              {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                  [Markup.button.url('📥 Open / Download Link', linkUrl)]
                ])
              }
            );
          } else if (file.channel_message_id && env.CHANNEL_ID) {
            await ctx.telegram.copyMessage(
              ctx.chat.id,
              env.CHANNEL_ID,
              Number(file.channel_message_id)
            );
          } else if (file.file_id) {
            await ctx.telegram.sendDocument(ctx.chat.id, file.file_id);
          }
        } catch (copyErr) {
          console.error(`Failed to deliver file ${file.id}:`, copyErr);
          await ctx.reply(`⚠️ Could not deliver item: ${file.file_name || 'File'}`);
        }
      }
    } catch (err) {
      console.error('Error handling folder callback:', err);
      await ctx.reply('⚠️ Failed to load contents for this folder.');
    }
  });

  // -------------------------------------------------------------
  // User Actions: Browse Posts & Saved Posts & Invite Friends
  // -------------------------------------------------------------
  const handleBrowsePosts = async (ctx, page = 1) => {
    try {
      if (ctx.callbackQuery) await ctx.answerCbQuery();
      const posts = await getPublishedPosts(env, ctx.from?.id);
      if (!posts || posts.length === 0) {
        const text = '📭 No published posts available right now.';
        const keyboard = Markup.inlineKeyboard([[Markup.button.callback('🔙 Main Menu', 'main_menu')]]);
        if (ctx.callbackQuery?.message) {
          try {
            return await ctx.editMessageText(text, keyboard);
          } catch (e) {}
        }
        return await ctx.reply(text, keyboard);
      }

      const PAGE_SIZE = 10;
      const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
      const curPage = Math.max(1, Math.min(page, totalPages));
      const pagePosts = posts.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

      const buttons = pagePosts.map(p => {
        const star = p.is_promoted ? '⭐ [Exclusive] ' : '';
        const displayTitle = (star + p.title).length > 32 ? (star + p.title).slice(0, 31) + '…' : (star + p.title);
        return [
          Markup.button.callback(
            displayTitle,
            `user_view_post_${p.id}`
          )
        ];
      });

      // Pagination controls row
      if (totalPages > 1) {
        const navRow = [];
        if (curPage > 1) {
          navRow.push(Markup.button.callback('⬅️ Prev', `user_browse_page_${curPage - 1}`));
        }
        navRow.push(Markup.button.callback(`📄 ${curPage}/${totalPages} (${posts.length})`, 'noop'));
        if (curPage < totalPages) {
          navRow.push(Markup.button.callback('Next ➡️', `user_browse_page_${curPage + 1}`));
        }
        buttons.push(navRow);
      }

      buttons.push([
        Markup.button.webApp('🚀 Open in Mini App', appUrl),
        Markup.button.callback('🔙 Main Menu', 'main_menu')
      ]);

      const text = `🔍 *Explore Published Content* (Page ${curPage}/${totalPages}):\nTap a post below to view files & links:`;
      const keyboard = Markup.inlineKeyboard(buttons);

      if (ctx.callbackQuery?.message) {
        try {
          return await ctx.editMessageText(text, {
            parse_mode: 'Markdown',
            ...keyboard
          });
        } catch (e) {
          // If message cannot be edited (e.g. content identical), ignore or fallback
        }
      }

      return await ctx.reply(text, {
        parse_mode: 'Markdown',
        ...keyboard
      });
    } catch (err) {
      console.error('Error browsing posts:', err);
      return await ctx.reply('⚠️ Failed to load posts.');
    }
  };

  bot.action('user_browse_posts', async (ctx) => handleBrowsePosts(ctx, 1));
  bot.action(/^user_browse_page_(\d+)$/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10) || 1;
    return await handleBrowsePosts(ctx, page);
  });

  bot.action(/^user_view_post_(\d+)$/, async (ctx) => {
    const postId = ctx.match[1];
    await ctx.answerCbQuery();
    const isAdmin = await isAdminUser(env, ctx.from?.id);
    const post = await getPostById(env, postId, ctx.from?.id, isAdmin);
    if (!post) return await ctx.reply('⚠️ Post not found.');
    return await sendPostToUser(ctx, env, post, postId);
  });

  const handleSavedPosts = async (ctx, page = 1) => {
    try {
      if (ctx.callbackQuery) await ctx.answerCbQuery();
      const saved = await getSavedPosts(env, ctx.from?.id);
      if (!saved || saved.length === 0) {
        const text = '🔖 You have no saved bookmarks yet.\nBrowse posts and tap Save to bookmark them!';
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('🔍 Browse Posts', 'user_browse_posts')],
          [Markup.button.callback('🔙 Main Menu', 'main_menu')]
        ]);
        if (ctx.callbackQuery?.message) {
          try {
            return await ctx.editMessageText(text, keyboard);
          } catch (e) {}
        }
        return await ctx.reply(text, keyboard);
      }

      const PAGE_SIZE = 10;
      const totalPages = Math.max(1, Math.ceil(saved.length / PAGE_SIZE));
      const curPage = Math.max(1, Math.min(page, totalPages));
      const pagePosts = saved.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

      const buttons = pagePosts.map(p => [
        Markup.button.callback(`🔖 ${p.title.slice(0, 28)}`, `user_view_post_${p.id}`)
      ]);

      if (totalPages > 1) {
        const navRow = [];
        if (curPage > 1) {
          navRow.push(Markup.button.callback('⬅️ Prev', `user_saved_page_${curPage - 1}`));
        }
        navRow.push(Markup.button.callback(`📄 ${curPage}/${totalPages} (${saved.length})`, 'noop'));
        if (curPage < totalPages) {
          navRow.push(Markup.button.callback('Next ➡️', `user_saved_page_${curPage + 1}`));
        }
        buttons.push(navRow);
      }

      buttons.push([Markup.button.callback('🔙 Main Menu', 'main_menu')]);

      const text = `🔖 *Your Bookmarked Posts* (Page ${curPage}/${totalPages}):\nTap a post to access:`;
      const keyboard = Markup.inlineKeyboard(buttons);

      if (ctx.callbackQuery?.message) {
        try {
          return await ctx.editMessageText(text, {
            parse_mode: 'Markdown',
            ...keyboard
          });
        } catch (e) {}
      }

      return await ctx.reply(text, {
        parse_mode: 'Markdown',
        ...keyboard
      });
    } catch (err) {
      console.error('Error loading saved posts:', err);
      return await ctx.reply('⚠️ Failed to load saved bookmarks.');
    }
  };

  bot.action('user_menu_saved', async (ctx) => handleSavedPosts(ctx, 1));
  bot.action(/^user_saved_page_(\d+)$/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10) || 1;
    return await handleSavedPosts(ctx, page);
  });

  const handleUserPoints = async (ctx) => {
    const userId = ctx.from?.id;
    if (ctx.callbackQuery) await ctx.answerCbQuery();
    const u = await getUser(env, userId);
    const settings = await getSettings(env);

    return await ctx.reply(
      `🪙 *Your Points Balance:*\n\n` +
      `• *Current Balance:* \`${u?.points || 0} Points\`\n` +
      `• *Cost Per Download:* \`${settings.points_per_post_download || 1} Point(s)\`\n` +
      `• *Referral Reward:* \`+${settings.referral_points || 10} Points\` per friend invited\n\n` +
      `Earn more points by inviting friends or completing monetized shortener tasks!`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🎁 Invite Friends', 'user_menu_invite')],
          [Markup.button.callback('🔙 Main Menu', 'main_menu')]
        ])
      }
    );
  };

  bot.action('user_menu_points', handleUserPoints);

  const handleInviteFriends = async (ctx) => {
    const userId = ctx.from?.id;
    if (ctx.callbackQuery) await ctx.answerCbQuery();
    const botInfo = await ctx.telegram.getMe();
    const refLink = `https://t.me/${botInfo.username}?start=ref_${userId}`;
    const settings = await getSettings(env);

    return await ctx.reply(
      `🎁 *Invite Friends & Earn Points*\n\n` +
      `Share your personal referral link with friends. Whenever a friend joins the bot, you will earn *+${settings.referral_points || 10} Points*! 🪙\n\n` +
      `🔗 *Your Referral Link:*\n\`${refLink}\``,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.url('📲 Share to Telegram', `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Join xmi Hub for premium downloads & resources!')}`)],
          [Markup.button.callback('🔙 Main Menu', 'main_menu')]
        ])
      }
    );
  };

  bot.action('user_menu_invite', handleInviteFriends);

  // -------------------------------------------------------------
  // Admin Management & Stats
  // -------------------------------------------------------------
  const handleStats = async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) {
      return await ctx.reply('⛔ Unauthorized. Admin access only.');
    }

    try {
      const stats = await getGlobalStats(env);
      let text = `📊 *xmi Hub Analytics & Statistics*\n\n` +
        `👥 *Total Users:* \`${stats.total_users}\`\n\n` +
        `📄 *Total Posts:* \`${stats.total_posts}\`\n` +
        `   • 🟢 Published: \`${stats.published_posts}\`\n` +
        `   • 🟡 Drafts: \`${stats.draft_posts}\`\n` +
        `   • 🟣 Scheduled: \`${stats.scheduled_posts}\`\n` +
        `   • ⭐ Featured: \`${stats.promoted_posts}\`\n\n` +
        `👁️ *Total Impressions / Views:* \`${stats.total_views}\`\n` +
        `📥 *Total File Downloads:* \`${stats.total_file_accesses}\`\n` +
        `❤️ *Total Likes:* \`${stats.total_likes}\`\n` +
        `💬 *Total Comments:* \`${stats.total_comments}\`\n\n` +
        `🔗 *Monetized Verifications:* \`${stats.total_verifications}\`\n` +
        `🎁 *Total Referrals:* \`${stats.total_referrals}\`\n` +
        `🛡️ *Force Join Checks:* \`${stats.total_force_joins}\`\n` +
        `🪙 *Points Awarded:* \`${stats.total_points_distributed}\` | *Spent:* \`${stats.total_points_spent}\``;

      if (stats.top_views && stats.top_views.length > 0) {
        text += `\n\n🔥 *Top 5 Most Popular Posts:*\n`;
        stats.top_views.forEach((p, i) => {
          text += `  ${i + 1}. *${escapeMarkdown(p.title)}* — \`${p.view_count} views\`\n`;
        });
      }

      if (stats.top_likes && stats.top_likes.length > 0) {
        text += `\n❤️ *Top 5 Most Liked Posts:*\n`;
        stats.top_likes.forEach((p, i) => {
          text += `  ${i + 1}. *${escapeMarkdown(p.title)}* — \`${p.like_count} likes\`\n`;
        });
      }

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('🔄 Refresh Stats', 'admin_refresh_stats'),
          Markup.button.callback('📑 Manage Posts', 'admin_post_list')
        ],
        [Markup.button.callback('🔙 Main Menu', 'admin_main_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.answerCbQuery('Stats refreshed');
        try {
          return await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
        } catch (e) {
          return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
        }
      } else {
        return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (err) {
      console.error('Stats error:', err);
      return await ctx.reply(`⚠️ Failed to load stats: ${err.message}`);
    }
  };

  bot.command('stats', handleStats);
  bot.action('admin_stats', handleStats);
  bot.action('admin_refresh_stats', handleStats);

  const handleAdminPosts = async (ctx, page = 1) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) {
      return await ctx.reply('⛔ Unauthorized. Admin access only.');
    }

    try {
      if (ctx.callbackQuery) await ctx.answerCbQuery();
      const posts = await getAllPostsForAdmin(env);
      if (!posts || posts.length === 0) {
        const text = '📭 No posts found in database.';
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('➕ Create New Post', 'admin_menu_addpost')],
          [Markup.button.callback('🔙 Main Menu', 'admin_main_menu')]
        ]);
        if (ctx.callbackQuery?.message) {
          try {
            return await ctx.editMessageText(text, keyboard);
          } catch (e) {}
        }
        return await ctx.reply(text, keyboard);
      }

      const PAGE_SIZE = 10;
      const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
      const curPage = Math.max(1, Math.min(page, totalPages));
      const pagePosts = posts.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

      const buttons = pagePosts.map(p => {
        const statusIcon = p.status === 'published' ? '🟢' : p.status === 'scheduled' ? '🟣' : '🟡';
        const star = p.is_promoted ? '⭐ Exclusive ' : '';
        const displayTitle = p.title.length > 24 ? p.title.slice(0, 24) + '…' : p.title;
        return [
          Markup.button.callback(
            `${statusIcon} ${star}${displayTitle}`,
            `admin_post_view_${p.id}`
          )
        ];
      });

      if (totalPages > 1) {
        const navRow = [];
        if (curPage > 1) {
          navRow.push(Markup.button.callback('⬅️ Prev', `admin_posts_page_${curPage - 1}`));
        }
        navRow.push(Markup.button.callback(`📄 ${curPage}/${totalPages} (${posts.length})`, 'noop'));
        if (curPage < totalPages) {
          navRow.push(Markup.button.callback('Next ➡️', `admin_posts_page_${curPage + 1}`));
        }
        buttons.push(navRow);
      }

      buttons.push([
        Markup.button.callback('➕ Create New Post', 'admin_menu_addpost'),
        Markup.button.callback('📊 Stats', 'admin_stats')
      ]);
      buttons.push([Markup.button.callback('🔙 Main Menu', 'admin_main_menu')]);

      const text = `👑 *Admin Panel: Posts Management* (Page ${curPage}/${totalPages})\nSelect any post to edit or manage:`;
      const keyboard = Markup.inlineKeyboard(buttons);

      if (ctx.callbackQuery?.message) {
        try {
          return await ctx.editMessageText(text, {
            parse_mode: 'Markdown',
            ...keyboard
          });
        } catch (e) {}
      }

      return await ctx.reply(text, {
        parse_mode: 'Markdown',
        ...keyboard
      });
    } catch (err) {
      console.error('Admin posts error:', err);
      return await ctx.reply(`⚠️ Failed to load posts: ${err.message}`);
    }
  };

  bot.command('admin', async (ctx) => handleAdminPosts(ctx, 1));
  bot.command('posts', async (ctx) => handleAdminPosts(ctx, 1));
  bot.action('admin_post_list', async (ctx) => handleAdminPosts(ctx, 1));
  bot.action(/^admin_posts_page_(\d+)$/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10) || 1;
    return await handleAdminPosts(ctx, page);
  });

  // -------------------------------------------------------------
  // Admin Single Post View & Detailed Controls
  // -------------------------------------------------------------
  bot.action(/^admin_post_view_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    try {
      const post = await getPostById(env, postId, userId, true);
      if (!post) {
        await ctx.answerCbQuery('Post not found');
        return await ctx.reply('⚠️ Post not found.');
      }

      await ctx.answerCbQuery();
      const statusIcon = post.status === 'published' ? '🟢 Published' : post.status === 'scheduled' ? '🟣 Scheduled' : '🟡 Draft';
      const protectLabel = post.protect_content ? '🔒 Protect: ON' : '🔓 Protect: OFF';
      const timerLabel = (post.auto_delete_minutes !== null && post.auto_delete_minutes !== undefined)
        ? (post.auto_delete_minutes === 0 ? 'Disabled (0m)' : `${post.auto_delete_minutes}m`)
        : 'Default';
      const botUsername = env.BOT_USERNAME || ctx.botInfo?.username || 'Xminty_bot';
      const botPostUrl = `https://t.me/${botUsername}?start=post_${post.id}`;
      const miniAppPostUrl = `https://t.me/${botUsername}/app?startapp=post_${post.id}`;
      const webUrl = env.WEB_APP_URL ? `${env.WEB_APP_URL.replace(/\/$/, '')}?post_id=${post.id}` : '';

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('🔗 📋 Get / Copy Links', `admin_post_links_${post.id}`),
          Markup.button.callback('📢 Broadcast Post', `admin_bc_post_ask_${post.id}`)
        ],
        [
          Markup.button.callback('✏️ Edit Title', `admin_edit_title_${post.id}`),
          Markup.button.callback('🖼️ Edit Image', `admin_edit_img_${post.id}`)
        ],
        [
          Markup.button.callback('🔗 Edit Link', `admin_edit_link_${post.id}`),
          Markup.button.callback('📁 Add Files/Folders', `admin_edit_files_${post.id}`)
        ],
        [
          Markup.button.callback('🗑️ Manage & Remove Files', `admin_manage_files_${post.id}`)
        ],
        [
          Markup.button.callback(protectLabel, `admin_post_protect_${post.id}`),
          Markup.button.callback(`⏳ Timer: ${timerLabel}`, `admin_edit_timer_${post.id}`)
        ],
        [
          Markup.button.callback(
            post.status === 'published' ? '📝 Unpublish to Draft' : '🚀 Publish Now',
            `admin_post_toggle_${post.id}`
          ),
          Markup.button.callback(
            post.is_promoted ? '⭐ Unfeature' : '⭐ Promote/Pin',
            `admin_post_promote_${post.id}`
          )
        ],
        [
          Markup.button.callback('🗑️ Delete Post', `admin_post_del_ask_${post.id}`)
        ],
        [
          Markup.button.callback('🔙 Back to Posts List', 'admin_post_list'),
          Markup.button.callback('🏠 Main Menu', 'admin_main_menu')
        ]
      ]);

      return await ctx.reply(
        `📌 *${escapeMarkdown(post.title)}*\n\n` +
        `• *Post ID:* \`#${post.id}\`\n` +
        `• *Status:* ${statusIcon}\n` +
        `• *Content Protection:* ${post.protect_content ? '🔒 Enabled (No Forward/Save)' : '🔓 Disabled'}\n` +
        `• *Auto-Delete Timer:* ⏳ ${timerLabel}\n` +
        (post.category ? `• *Category:* ${escapeMarkdown(post.category)}\n` : '') +
        (post.tags ? `• *Tags:* ${escapeMarkdown(post.tags)}\n` : '') +
        `• *Folders:* ${post.folders?.length || 0}\n` +
        `• *Views:* ${post.view_count || 0}\n` +
        `• *Likes:* ${post.like_count}\n` +
        `• *Comments:* ${post.comment_count}\n` +
        (post.direct_link ? `• *Direct Link:* ${escapeMarkdown(post.direct_link)}\n` : '') +
        `\n🔗 *Direct Links (Tap to copy):*\n` +
        `• 🤖 *Bot:* \`${botPostUrl}\`\n` +
        `• 📱 *App:* \`${miniAppPostUrl}\`\n` +
        (webUrl ? `• 🌐 *Web:* \`${webUrl}\`\n` : ''),
        {
          parse_mode: 'Markdown',
          ...keyboard
        }
      );
    } catch (err) {
      console.error('Error viewing admin post:', err);
      await ctx.answerCbQuery('Error loading post');
    }
  });

  // Dedicated Post Links & Sharing Viewer
  bot.action(/^admin_post_links_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    try {
      const post = await getPostById(env, postId, userId, true);
      if (!post) {
        await ctx.answerCbQuery('Post not found');
        return;
      }
      await ctx.answerCbQuery();
      const botUsername = env.BOT_USERNAME || ctx.botInfo?.username || 'Xminty_bot';
      const botPostUrl = `https://t.me/${botUsername}?start=post_${post.id}`;
      const miniAppPostUrl = `https://t.me/${botUsername}/app?startapp=post_${post.id}`;
      const webUrl = env.WEB_APP_URL ? `${env.WEB_APP_URL.replace(/\/$/, '')}?post_id=${post.id}` : '';
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botPostUrl)}&text=${encodeURIComponent(`Check out "${post.title}"!`)}`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.url('🤖 Open Bot Link', botPostUrl),
          Markup.button.url('📱 Open Mini App', miniAppPostUrl)
        ],
        [
          Markup.button.url('📤 Share Link to Telegram', shareUrl),
          Markup.button.callback('📢 Broadcast Post', `admin_bc_post_ask_${post.id}`)
        ],
        [
          Markup.button.callback('🔙 Return to Post', `admin_post_view_${post.id}`)
        ]
      ]);

      let msg = `🔗 *Direct Links for Post #${post.id}*\n\n` +
        `📌 *Title:* *${escapeMarkdown(post.title)}*\n\n` +
        `🤖 *Telegram Bot Deep Link:*\n` +
        `\`${botPostUrl}\`\n_(Tap to copy • Opens this post directly in the bot)_\n\n` +
        `📱 *Telegram Mini App Link:*\n` +
        `\`${miniAppPostUrl}\`\n_(Tap to copy • Opens this post inside the Mini App)_\n\n`;

      if (webUrl) {
        msg += `🌐 *Direct Web Link:*\n\`${webUrl}\`\n_(Tap to copy)_\n\n`;
      }

      msg += `💡 *Tip:* Send either link to users or channels; tapping it immediately loads this exact post!`;

      return await ctx.reply(msg, {
        parse_mode: 'Markdown',
        ...keyboard
      });
    } catch (e) {
      console.error('Error showing post links:', e);
      await ctx.answerCbQuery('Error loading links');
    }
  });

  // Toggle Content Protection
  bot.action(/^admin_post_protect_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    try {
      const post = await getPostById(env, postId, userId, true);
      const newProtect = !post.protect_content;
      await updatePost(env, postId, { protect_content: newProtect });
      await ctx.answerCbQuery(newProtect ? '🔒 Content Protection Enabled' : '🔓 Content Protection Disabled');
      
      const updated = await getPostById(env, postId, userId, true);
      const statusIcon = updated.status === 'published' ? '🟢 Published' : updated.status === 'scheduled' ? '🟣 Scheduled' : '🟡 Draft';
      const protectLabel = updated.protect_content ? '🔒 Protect: ON' : '🔓 Protect: OFF';
      const timerLabel = (updated.auto_delete_minutes !== null && updated.auto_delete_minutes !== undefined)
        ? (updated.auto_delete_minutes === 0 ? 'Disabled (0m)' : `${updated.auto_delete_minutes}m`)
        : 'Default';

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✏️ Edit Title', `admin_edit_title_${updated.id}`),
          Markup.button.callback('🖼️ Edit Image', `admin_edit_img_${updated.id}`)
        ],
        [
          Markup.button.callback('🔗 Edit Link', `admin_edit_link_${updated.id}`),
          Markup.button.callback('📁 Add Files/Folders', `admin_edit_files_${updated.id}`)
        ],
        [
          Markup.button.callback('🗑️ Manage & Remove Files', `admin_manage_files_${updated.id}`)
        ],
        [
          Markup.button.callback(protectLabel, `admin_post_protect_${updated.id}`),
          Markup.button.callback(`⏳ Timer: ${timerLabel}`, `admin_edit_timer_${updated.id}`)
        ],
        [
          Markup.button.callback(
            updated.status === 'published' ? '📝 Unpublish to Draft' : '🚀 Publish Now',
            `admin_post_toggle_${updated.id}`
          ),
          Markup.button.callback(
            updated.is_promoted ? '⭐ Unfeature' : '⭐ Promote/Pin',
            `admin_post_promote_${updated.id}`
          )
        ],
        [
          Markup.button.callback('📢 Broadcast Post to Users', `admin_bc_post_ask_${updated.id}`)
        ],
        [
          Markup.button.callback('🗑️ Delete Post', `admin_post_del_ask_${updated.id}`)
        ],
        [
          Markup.button.callback('🔙 Back to Posts List', 'admin_post_list')
        ]
      ]);

      return await ctx.reply(
        `📌 *${escapeMarkdown(updated.title)}*\n\n` +
        `• *Post ID:* \`#${updated.id}\`\n` +
        `• *Status:* ${statusIcon}\n` +
        `• *Content Protection:* ${updated.protect_content ? '🔒 Enabled (No Forward/Save)' : '🔓 Disabled'}\n` +
        `• *Auto-Delete Timer:* ⏳ ${timerLabel}\n` +
        (updated.category ? `• *Category:* ${escapeMarkdown(updated.category)}\n` : '') +
        (updated.tags ? `• *Tags:* ${escapeMarkdown(updated.tags)}\n` : '') +
        `• *Folders:* ${updated.folders?.length || 0}\n` +
        `• *Views:* ${updated.view_count || 0}\n` +
        `• *Likes:* ${updated.like_count}\n` +
        `• *Comments:* ${updated.comment_count}\n` +
        (updated.direct_link ? `• *Direct Link:* ${escapeMarkdown(updated.direct_link)}\n` : ''),
        {
          parse_mode: 'Markdown',
          ...keyboard
        }
      );
    } catch (err) {
      await ctx.answerCbQuery('Failed to update protection');
    }
  });

  // Edit Auto Delete Timer Menu
  bot.action(/^admin_edit_timer_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    await ctx.answerCbQuery();

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('⏱️ 5 Minutes', `admin_set_timer_${postId}_5`),
        Markup.button.callback('⏱️ 15 Minutes', `admin_set_timer_${postId}_15`)
      ],
      [
        Markup.button.callback('⏱️ 30 Minutes', `admin_set_timer_${postId}_30`),
        Markup.button.callback('⏱️ 60 Minutes', `admin_set_timer_${postId}_60`)
      ],
      [
        Markup.button.callback('⏱️ 2 Hours', `admin_set_timer_${postId}_120`),
        Markup.button.callback('⏱️ 24 Hours', `admin_set_timer_${postId}_1440`)
      ],
      [
        Markup.button.callback('🚫 Disable (Never Delete)', `admin_set_timer_${postId}_0`),
        Markup.button.callback('🔄 Reset to Global Default', `admin_set_timer_${postId}_default`)
      ],
      [
        Markup.button.callback('✏️ Type Custom Minutes', `admin_type_timer_${postId}`),
        Markup.button.callback('🔙 Return to Post', `admin_post_view_${postId}`)
      ]
    ]);

    return await ctx.reply(
      `⏳ *Set Auto-Delete Timer for Post #${postId}*\n\n` +
      `Choose how long files & links should remain in the user's chat before self-destructing:\n\n` +
      `• *Presets:* Select any duration button below\n` +
      `• *Disable:* Content stays permanently in chat\n` +
      `• *Global Default:* Uses hub default setting (currently 30 min)\n` +
      `• *Custom:* Type any exact minutes`,
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );
  });

  bot.action(/^admin_set_timer_(\d+)_(\w+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    const valStr = ctx.match[2];
    const minutes = valStr === 'default' ? null : parseInt(valStr, 10);

    await updatePost(env, postId, { auto_delete_minutes: minutes });
    await ctx.answerCbQuery(`Timer set to: ${valStr === 'default' ? 'Global Default' : (minutes === 0 ? 'Disabled' : minutes + 'm')}`);

    return await ctx.reply(
      `✅ *Auto-Delete Timer Updated!*\n\n` +
      `Post #${postId} timer is now: *${valStr === 'default' ? 'Global Default' : (minutes === 0 ? 'Disabled (Never Delete)' : minutes + ' Minutes')}*`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Return to Post', `admin_post_view_${postId}`)]])
      }
    );
  });

  bot.action(/^admin_type_timer_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    await setSession(env, userId, {
      step: 'EDIT_AUTO_DELETE_TIMER',
      editPostId: postId
    });

    await ctx.answerCbQuery();
    return await ctx.reply(
      `⏳ *Type Custom Timer Minutes:*\n\n` +
      `Please reply with the number of minutes (e.g. \`45\`, \`180\`, or \`0\` to disable):`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', `admin_post_view_${postId}`)]])
      }
    );
  });

  // Toggle Promote / Feature
  bot.action(/^admin_post_promote_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    try {
      const post = await getPostById(env, postId, userId, true);
      const newPromoted = !post.is_promoted;
      await togglePromotePost(env, postId, newPromoted);
      await ctx.answerCbQuery(newPromoted ? 'Post Featured & Pinned!' : 'Post unfeatured');
      
      const updated = await getPostById(env, postId, userId, true);
      const statusIcon = updated.status === 'published' ? '🟢 Published' : updated.status === 'scheduled' ? '🟣 Scheduled' : '🟡 Draft';
      const protectLabel = updated.protect_content ? '🔒 Protect: ON' : '🔓 Protect: OFF';
      const timerLabel = (updated.auto_delete_minutes !== null && updated.auto_delete_minutes !== undefined)
        ? (updated.auto_delete_minutes === 0 ? 'Disabled (0m)' : `${updated.auto_delete_minutes}m`)
        : 'Default';

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✏️ Edit Title', `admin_edit_title_${updated.id}`),
          Markup.button.callback('🖼️ Edit Image', `admin_edit_img_${updated.id}`)
        ],
        [
          Markup.button.callback('🔗 Edit Link', `admin_edit_link_${updated.id}`),
          Markup.button.callback('📁 Add Files/Folders', `admin_edit_files_${updated.id}`)
        ],
        [
          Markup.button.callback(protectLabel, `admin_post_protect_${updated.id}`),
          Markup.button.callback(`⏳ Timer: ${timerLabel}`, `admin_edit_timer_${updated.id}`)
        ],
        [
          Markup.button.callback(
            updated.status === 'published' ? '📝 Unpublish to Draft' : '🚀 Publish Now',
            `admin_post_toggle_${updated.id}`
          ),
          Markup.button.callback(
            updated.is_promoted ? '⭐ Unfeature' : '⭐ Promote/Pin',
            `admin_post_promote_${updated.id}`
          )
        ],
        [
          Markup.button.callback('🗑️ Delete Post', `admin_post_del_ask_${updated.id}`)
        ],
        [
          Markup.button.callback('🔙 Back to Posts List', 'admin_post_list')
        ]
      ]);

      return await ctx.reply(
        `📌 *${escapeMarkdown(updated.title)}*\n\n` +
        `• *Post ID:* \`#${updated.id}\`\n` +
        `• *Status:* ${statusIcon}\n` +
        `• *Content Protection:* ${updated.protect_content ? '🔒 Enabled (No Forward/Save)' : '🔓 Disabled'}\n` +
        `• *Auto-Delete Timer:* ⏳ ${timerLabel}\n` +
        (updated.category ? `• *Category:* ${escapeMarkdown(updated.category)}\n` : '') +
        (updated.tags ? `• *Tags:* ${escapeMarkdown(updated.tags)}\n` : '') +
        `• *Folders:* ${updated.folders?.length || 0}\n` +
        `• *Views:* ${updated.view_count || 0}\n` +
        `• *Likes:* ${updated.like_count}\n` +
        `• *Comments:* ${updated.comment_count}\n` +
        (updated.direct_link ? `• *Direct Link:* ${escapeMarkdown(updated.direct_link)}\n` : ''),
        {
          parse_mode: 'Markdown',
          ...keyboard
        }
      );
    } catch (err) {
      await ctx.answerCbQuery('Failed to update feature');
    }
  });

  // Toggle Publish / Draft
  bot.action(/^admin_post_toggle_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    try {
      const post = await getPostById(env, postId, userId, true);
      const newStatus = post.status === 'published' ? 'draft' : 'published';
      await updatePost(env, postId, { status: newStatus });
      await ctx.answerCbQuery(`Status updated to ${newStatus}`);
      return await handleAdminPosts(ctx);
    } catch (err) {
      await ctx.answerCbQuery('Failed to update status');
    }
  });

  // Delete Confirmation Dialog
  bot.action(/^admin_post_del_ask_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    try {
      const post = await getPostById(env, postId, userId, true);
      await ctx.answerCbQuery();

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🗑️ Yes, Delete Permanently', `admin_post_del_confirm_${postId}`)],
        [Markup.button.callback('❌ Cancel', `admin_post_view_${postId}`)]
      ]);

      return await ctx.reply(
        `⚠️ *Delete Confirmation*\n\n` +
        `Are you sure you want to permanently delete *"${escapeMarkdown(post?.title || 'this post')}"*?\n\n` +
        `This will remove all associated files and folders permanently.`,
        {
          parse_mode: 'Markdown',
          ...keyboard
        }
      );
    } catch (e) {
      await ctx.answerCbQuery('Error');
    }
  });

  // Delete Confirmed
  bot.action(/^admin_post_del_confirm_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    try {
      await deletePost(env, postId);
      await ctx.answerCbQuery('Post deleted successfully');
      await ctx.reply('🗑️ *Post has been deleted successfully.*', { parse_mode: 'Markdown' });
      return await handleAdminPosts(ctx);
    } catch (err) {
      await ctx.answerCbQuery('Failed to delete');
    }
  });

  // Broadcast Post to all users Ask
  bot.action(/^admin_bc_post_ask_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    try {
      const post = await getPostById(env, postId, userId, true);
      if (!post) {
        await ctx.answerCbQuery('Post not found');
        return;
      }
      await ctx.answerCbQuery();

      const allUserIds = await getAllUserIds(env);
      const blockedSet = await getBlockedUserIds(env);
      const activeUserIds = allUserIds.filter(id => !blockedSet.has(String(id)));

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(`📢 Yes, Broadcast to ${activeUserIds.length} Users`, `admin_bc_post_confirm_${postId}`)],
        [Markup.button.callback('❌ Cancel', `admin_post_view_${postId}`)]
      ]);

      return await ctx.reply(
        `📢 *Broadcast Post Confirmation*\n\n` +
        `• *Post:* *"${escapeMarkdown(post.title || 'Post #' + postId)}"*\n` +
        `• *Active Target Audience:* \`${activeUserIds.length}\` users\n` +
        `• *Blocked/Excluded:* \`${blockedSet.size}\` users\n` +
        `• *Total Registered:* \`${allUserIds.length}\` users\n` +
        `• *Protection:* ${post.protect_content ? '🔒 Enabled (No Forward/Save)' : '🔓 Disabled'}\n\n` +
        `Are you sure you want to broadcast this post to all active users now?`,
        {
          parse_mode: 'Markdown',
          ...keyboard
        }
      );
    } catch (e) {
      console.error('Error in admin_bc_post_ask:', e);
      await ctx.answerCbQuery('Error loading broadcast details');
    }
  });

  // Broadcast Post Confirmed
  bot.action(/^admin_bc_post_confirm_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    try {
      const post = await getPostById(env, postId, userId, true);
      if (!post) {
        return await ctx.reply('⚠️ Post not found.');
      }
      await ctx.answerCbQuery('Starting broadcast...');

      const allUserIds = await getAllUserIds(env);
      const blockedSet = await getBlockedUserIds(env);
      const targetUserIds = allUserIds.filter(id => !blockedSet.has(String(id)));

      await ctx.reply(`📡 Broadcasting post *"${escapeMarkdown(post.title)}"* to \`${targetUserIds.length}\` active users in background...`, { parse_mode: 'Markdown' });

      const settings = await getSettings(env);
      const hubTimer = parseInt(settings.auto_delete_minutes || 0, 10);
      const autoDeleteMinutes = (post.auto_delete_minutes !== null && post.auto_delete_minutes !== undefined)
        ? parseInt(post.auto_delete_minutes, 10)
        : hubTimer;
      const protectContent = !!(post.protect_content ?? (settings.protect_content === 'true' || settings.protect_content === true));

      const botUsername = env.BOT_USERNAME || ctx.botInfo?.username || 'Xminty_bot';
      const appUrl = `https://t.me/${botUsername}/app?startapp=post_${post.id}`;
      const botPostUrl = `https://t.me/${botUsername}?start=post_${post.id}`;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botPostUrl)}&text=${encodeURIComponent(`Check out "${post.title}"!`)}`;

      // Construct Buttons
      const inlineButtons = [];
      if (post.direct_link) {
        inlineButtons.push([
          Markup.button.callback('📥 Get File / Download', `bot_get_post_${post.id}`),
          Markup.button.url(post.direct_link_title || '🔗 Access Link', post.direct_link)
        ]);
      } else {
        inlineButtons.push([
          Markup.button.callback('📥 Get File / Download', `bot_get_post_${post.id}`)
        ]);
      }
      inlineButtons.push([
        Markup.button.url('🚀 Open in Mini App', appUrl),
        Markup.button.url('📤 Share Post', shareUrl)
      ]);

      const captionText = `📌 *${escapeMarkdown(post.title)}*\n\n` +
        (post.category && post.category !== 'All' ? `🏷️ *Category:* ${escapeMarkdown(post.category)}\n` : '') +
        (post.tags ? `🔖 *Tags:* ${escapeMarkdown(post.tags)}\n\n` : '\n') +
        `👇 Tap below to view details and access files!`;

      let sentCount = 0;
      let failedCount = 0;
      const failedDetails = [];
      const ephemeralRecords = [];

      for (const targetId of targetUserIds) {
        try {
          let sentMid = null;
          const previewImg = post.preview_image;
          if (previewImg && (previewImg.startsWith('http://') || previewImg.startsWith('https://'))) {
            try {
              const res = await ctx.telegram.sendPhoto(targetId, previewImg, {
                caption: captionText,
                parse_mode: 'Markdown',
                protect_content: protectContent,
                ...Markup.inlineKeyboard(inlineButtons)
              });
              sentMid = res.message_id;
              sentCount++;
            } catch (pErr) {
              const res = await ctx.telegram.sendMessage(targetId, captionText, {
                parse_mode: 'Markdown',
                protect_content: protectContent,
                ...Markup.inlineKeyboard(inlineButtons)
              });
              sentMid = res.message_id;
              sentCount++;
            }
          } else {
            const res = await ctx.telegram.sendMessage(targetId, captionText, {
              parse_mode: 'Markdown',
              protect_content: protectContent,
              ...Markup.inlineKeyboard(inlineButtons)
            });
            sentMid = res.message_id;
            sentCount++;
          }

          if (sentMid) {
            // Broadcast messages are permanent and do not auto-delete
          } else {
            failedCount++;
            failedDetails.push({ user_id: targetId, reason: 'Telegram message delivery failed' });
          }
        } catch (targetErr) {
          failedCount++;
          const errMsg = targetErr.message || String(targetErr);
          failedDetails.push({ user_id: targetId, reason: errMsg });
          if (/blocked|deactivated|chat not found|user is deactivated/i.test(errMsg)) {
            await updateUserBlockedStatus(env, targetId, true);
          }
        }
      }

      let summaryText = `✅ *Post Broadcast Complete!*\n\n` +
        `• 🚀 *Successfully Sent:* \`${sentCount}\`\n` +
        `• ❌ *Failed:* \`${failedCount}\`\n` +
        `• 👥 *Total Users:* \`${userIds.length}\`\n` +
        `• ♾️ *Expiry:* \`None (Permanent)\``;

      if (failedDetails.length > 0) {
        summaryText += `\n\n⚠️ *Failure Breakdown:*\n` +
          failedDetails.slice(0, 10).map(f => `• User \`#${f.user_id}\`: _${escapeMarkdown(f.reason)}_`).join('\n') +
          (failedDetails.length > 10 ? `\n_...and ${failedDetails.length - 10} more_` : '');
      }

      return await ctx.reply(summaryText, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Return to Post', `admin_post_view_${postId}`)]])
      });
    } catch (err) {
      console.error('Error broadcasting post:', err);
      await ctx.reply('⚠️ Failed to broadcast post: ' + err.message);
    }
  });

  // -------------------------------------------------------------
  // Settings Panel in Telegram (Buttons Only)
  // -------------------------------------------------------------
  const handleSettingsMenu = async (ctx) => {
    const userId = ctx.from?.id;
    if (!(await isAdminUser(env, userId))) return;

    if (ctx.callbackQuery) await ctx.answerCbQuery();

    const settings = await getSettings(env);
    const channels = await getForceChannels(env);

    const refStatus = settings.referral_enabled ? '🟢 ON' : '🔴 OFF';
    const shortStatus = settings.shortener_enabled ? '🟢 ON' : '🔴 OFF';
    const bannerStatus = settings.banner_enabled ? '🟢 ON' : '🔴 OFF';
    const forceStatus = settings.force_join_enabled ? '🟢 ON' : '🔴 OFF';
    const protectAllStatus = settings.protect_all_posts ? '🟢 ON' : '🔴 OFF';
    const reqStartStatus = settings.require_bot_start_enabled ? '🟢 ON' : '🔴 OFF';

    const text = `⚙️ *Hub Settings & Rules*\n\n` +
      `• 🎁 *Referrals & Points:* ${refStatus} (\`${settings.referral_points || 10} pts\`)\n` +
      `• 🔗 *Shortener Locker:* ${shortStatus}\n` +
      `• 🔒 *Restrict Forward All:* ${protectAllStatus}\n` +
      `• ⏳ *Global Auto-Delete:* \`${settings.auto_delete_minutes || 30} minutes\`\n` +
      `• 🪙 *Points per Download:* \`${settings.points_per_post_download || 1} pt\`\n` +
      `• 🖼️ *Sponsor Banner:* ${bannerStatus}\n` +
      `• 📢 *Force Join Channels:* ${forceStatus} (\`${channels.length} channel(s)\`)\n` +
      `• 🛑 *Require Bot Start in App:* ${reqStartStatus}\n\n` +
      `Tap any toggle button below:`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(`🎁 Referrals: ${refStatus}`, 'admin_toggle_ref'),
        Markup.button.callback(`🔗 Shortener: ${shortStatus}`, 'admin_toggle_shortener')
      ],
      [
        Markup.button.callback(`🔒 Restrict Forward: ${protectAllStatus}`, 'admin_toggle_protect_all'),
        Markup.button.callback(`🖼️ Banner: ${bannerStatus}`, 'admin_toggle_banner')
      ],
      [
        Markup.button.callback(`📢 Force Join: ${forceStatus}`, 'admin_toggle_forcejoin'),
        Markup.button.callback('➕ Add Force Channel', 'admin_add_channel_btn')
      ],
      [
        Markup.button.callback(`🛑 Require Start: ${reqStartStatus}`, 'admin_toggle_reqstart'),
        Markup.button.callback('✏️ Start Prompt Text', 'admin_set_reqstart_msg')
      ],
      [
        Markup.button.callback('📋 View Channels', 'admin_view_channels_btn'),
        Markup.button.callback('👥 Manage Admins', 'admin_menu_admins')
      ],
      [
        Markup.button.callback('💾 Storage Meter', 'admin_menu_storage'),
        Markup.button.callback('🔙 Back to Main Menu', 'admin_main_menu')
      ]
    ]);

    if (ctx.callbackQuery) {
      try {
        return await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      } catch (e) {
        return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }
    } else {
      return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
  };

  bot.action('admin_menu_settings', handleSettingsMenu);

  bot.action('admin_toggle_ref', async (ctx) => {
    const settings = await getSettings(env);
    await updateSetting(env, 'referral_enabled', !settings.referral_enabled);
    return await handleSettingsMenu(ctx);
  });

  bot.action('admin_toggle_shortener', async (ctx) => {
    const settings = await getSettings(env);
    await updateSetting(env, 'shortener_enabled', !settings.shortener_enabled);
    return await handleSettingsMenu(ctx);
  });

  bot.action('admin_toggle_protect_all', async (ctx) => {
    const settings = await getSettings(env);
    await updateSetting(env, 'protect_all_posts', !settings.protect_all_posts);
    return await handleSettingsMenu(ctx);
  });

  bot.action('admin_toggle_banner', async (ctx) => {
    const settings = await getSettings(env);
    await updateSetting(env, 'banner_enabled', !settings.banner_enabled);
    return await handleSettingsMenu(ctx);
  });

  bot.action('admin_toggle_forcejoin', async (ctx) => {
    const settings = await getSettings(env);
    await updateSetting(env, 'force_join_enabled', !settings.force_join_enabled);
    return await handleSettingsMenu(ctx);
  });

  bot.action('admin_toggle_reqstart', async (ctx) => {
    const settings = await getSettings(env);
    await updateSetting(env, 'require_bot_start_enabled', !settings.require_bot_start_enabled);
    return await handleSettingsMenu(ctx);
  });

  bot.action('admin_set_reqstart_msg', async (ctx) => {
    const userId = ctx.from?.id;
    if (!(await isAdminUser(env, userId))) return;

    await setSession(env, userId, { step: 'AWAITING_REQSTART_MSG' });
    await ctx.answerCbQuery();

    const currentSettings = await getSettings(env);
    const currMsg = currentSettings.require_bot_start_message || 'Please start our official bot to unlock full access and view content.';
    const currLink = currentSettings.require_bot_start_link || '';

    return await ctx.reply(
      `🛑 *Configure Require Bot Start Message & Link*\n\n` +
      `Current Message:\n_"${escapeMarkdown(currMsg)}"_\n\n` +
      `Current Custom Link:\n\`${currLink || 'Default (https://t.me/Xminty_bot?start=start)'}\`\n\n` +
      `Send your new message and optional link in this format:\n` +
      `\`<Your Prompt Message> | <Custom Link or empty>\`\n\n` +
      `*Example:*\n` +
      `\`Please start our bot first to unlock access! | https://t.me/Xminty_bot?start=start\``,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'admin_menu_settings')]])
      }
    );
  });

  bot.action('admin_add_channel_btn', async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    await setSession(env, userId, { step: 'AWAITING_FORCE_CHANNEL' });
    await ctx.answerCbQuery();

    return await ctx.reply(
      '📢 *Add Force Join Channel*\n\n' +
      'Please send the channel details in the format:\n' +
      '`<Channel ID> | <Channel Title> | <Invite Link>`\n\n' +
      '*Example:* `-1001234567890 | Official Channel | https://t.me/mychannel`\n\n' +
      '*(Make sure this bot is added as an Administrator in your channel!)*',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'admin_menu_settings')]])
      }
    );
  });

  bot.action('admin_view_channels_btn', async (ctx) => {
    const channels = await getForceChannels(env);
    await ctx.answerCbQuery();

    if (!channels || channels.length === 0) {
      return await ctx.reply('ℹ️ No force join channels configured yet.', {
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Back to Settings', 'admin_menu_settings')]])
      });
    }

    let text = `📢 *Configured Force Join Channels (${channels.length}):*\n\n`;
    channels.forEach((c, idx) => {
      text += `${idx + 1}. *${escapeMarkdown(c.channel_title || 'Channel')}*\n   ID: \`${c.channel_id}\`\n   Link: ${c.invite_link}\n\n`;
    });

    const buttons = channels.map(c => [
      Markup.button.callback(`🗑️ Remove: ${c.channel_title.slice(0, 15)}`, `admin_remove_channel_${c.channel_id}`)
    ]);
    buttons.push([Markup.button.callback('🔙 Back to Settings', 'admin_menu_settings')]);

    return await ctx.reply(text, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...Markup.inlineKeyboard(buttons)
    });
  });

  bot.action(/^admin_remove_channel_(.+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const channelId = ctx.match[1];
    await removeForceChannel(env, channelId);
    await ctx.answerCbQuery('Channel removed!');
    return await handleSettingsMenu(ctx);
  });

  // -------------------------------------------------------------
  // Admins & Users Management
  // -------------------------------------------------------------
  const handleAdminsMenu = async (ctx) => {
    const userId = ctx.from?.id;
    if (!(await isAdminUser(env, userId))) return;

    if (ctx.callbackQuery) await ctx.answerCbQuery();

    const admins = await getAllAdmins(env);
    let text = `👥 *Multi-Admin Management*\n\n` +
      `Current Admins (${admins.length}):\n`;

    admins.forEach((adm, idx) => {
      text += `${idx + 1}. \`${adm.user_id}\` — *${escapeMarkdown(adm.name || 'Admin')}* (Added: ${formatIST(adm.created_at, false)})\n`;
    });

    text += `\nAdmins have full access to create/edit posts, broadcast, manage storage, and configure hub rules.`;

    const buttons = [
      [
        Markup.button.callback('➕ Add Admin', 'admin_add_admin_ask'),
        Markup.button.callback('👥 View Users Directory', 'admin_view_users')
      ]
    ];

    admins.forEach(adm => {
      if (String(adm.user_id) !== String(env.ADMIN_ID)) {
        buttons.push([Markup.button.callback(`🗑️ Remove Admin: ${adm.name || adm.user_id}`, `admin_remove_admin_${adm.user_id}`)]);
      }
    });

    buttons.push([Markup.button.callback('🔙 Back to Hub Settings', 'admin_menu_settings')]);

    return await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  };

  bot.action('admin_menu_admins', handleAdminsMenu);

  bot.action('admin_view_users', async (ctx) => {
    const userId = ctx.from?.id;
    if (!(await isAdminUser(env, userId))) return;
    await ctx.answerCbQuery();

    try {
      const users = await getAllUsers(env);
      let text = `👥 *Registered Bot Users Directory*\n\n` +
        `• *Total Users:* \`${users.length}\`\n\n`;

      if (users.length === 0) {
        text += `_No registered users found yet._`;
      } else {
        const topUsers = users.slice(0, 20);
        topUsers.forEach((u, i) => {
          const uName = u.username ? `[@${escapeMarkdown(u.username)}](https://t.me/${u.username})` : `[${escapeMarkdown(u.first_name || 'User')}](tg://user?id=${u.id})`;
          const actStr = u.last_activity ? ` • 🕒 ${formatIST(u.last_activity)}` : '';
          text += `${i + 1}. ${uName} (\`#${u.id}\`) — 🪙 ${u.points || 0} pts${actStr}\n`;
        });
        if (users.length > 20) {
          text += `\n_...and ${users.length - 20} more users (view and search all in Mini App Admin Hub)._`;
        }
      }

      return await ctx.reply(text, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Refresh', 'admin_view_users')],
          [Markup.button.callback('🔙 Back to Admins', 'admin_menu_admins')]
        ])
      });
    } catch (e) {
      return await ctx.reply('⚠️ Error fetching users: ' + e.message);
    }
  });

  bot.action('admin_add_admin_ask', async (ctx) => {
    const userId = ctx.from?.id;
    if (!(await isAdminUser(env, userId))) return;

    await setSession(env, userId, { step: 'ADD_ADMIN_USER_ID' });
    await ctx.answerCbQuery();

    return await ctx.reply(
      `👥 *Add New Admin*\n\n` +
      `Please reply with the Telegram **User ID** of the person you want to make admin.\n` +
      `You can also provide a name:\n` +
      `• Format: \`<User ID> | <Full Name / Note>\`\n` +
      `• Example: \`987654321 | Alex Partner\``,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'admin_menu_admins')]])
      }
    );
  });

  bot.action(/^admin_del_admin_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!(await isAdminUser(env, userId))) return;

    const targetId = ctx.match[1];
    try {
      await deleteAdmin(env, targetId);
      await ctx.answerCbQuery('Admin removed successfully');
      return await handleAdminsMenu(ctx);
    } catch (e) {
      await ctx.answerCbQuery(e.message);
      return await ctx.reply(`⚠️ ${e.message}`);
    }
  });

  // -------------------------------------------------------------
  // Supabase Live Storage Meter Handlers
  // -------------------------------------------------------------
  const handleStorageMenu = async (ctx) => {
    const userId = ctx.from?.id;
    if (!(await isAdminUser(env, userId))) return;

    if (ctx.callbackQuery) await ctx.answerCbQuery();

    try {
      const stats = await getDatabaseStorageStats(env);

      // Create a visual ASCII progress bar (10 blocks)
      const filledBlocks = Math.min(10, Math.max(0, Math.round(stats.used_percentage / 10)));
      const emptyBlocks = 10 - filledBlocks;
      const bar = '🟩'.repeat(filledBlocks === 0 ? 1 : filledBlocks) + '⬜'.repeat(emptyBlocks);

      const text = `💾 *Supabase Database Live Storage Meter*\n\n` +
        `• *Tier:* \`${stats.tier_name}\`\n` +
        `• *Database Limit:* \`${stats.free_tier_limit_mb} MB\` (Free Forever)\n` +
        `• *Estimated Usage:* \`${stats.estimated_size_mb} MB\` (\`${stats.used_percentage}%\` used)\n` +
        `• *Free Space:* \`${stats.free_percentage}%\` remaining\n` +
        `• *Capacity Remaining:* \`~${stats.posts_capacity_remaining.toLocaleString()} more posts\` 🚀\n\n` +
        `*Storage Bar:*\n${bar} \`${stats.used_percentage}%\`\n\n` +
        `📊 *Database Record Breakdown:*\n` +
        `• 📄 Posts: \`${stats.posts_count}\`\n` +
        `• 📁 Folders: \`${stats.folders_count}\`\n` +
        `• 📥 Files/Links: \`${stats.files_count}\`\n` +
        `• 👥 Users: \`${stats.users_count}\`\n` +
        `• 💬 Comments: \`${stats.comments_count}\`\n` +
        `• ❤️ Likes: \`${stats.likes_count}\`\n` +
        `• ⏳ Ephemeral Queue: \`${stats.ephemeral_count}\`\n\n` +
        `*Why it uses very little space:*\n` +
        `PostgreSQL stores only lightweight text/metadata (~0.85 KB/post). Large files are stored on Telegram CDN channels, keeping Supabase free forever!`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🧹 Clean & Optimize Database', 'admin_db_optimize')],
        [
          Markup.button.callback('🔄 Refresh Storage', 'admin_menu_storage'),
          Markup.button.callback('🔙 Main Menu', 'admin_main_menu')
        ]
      ]);

      return await ctx.reply(text, {
        parse_mode: 'Markdown',
        ...keyboard
      });
    } catch (e) {
      console.error('Storage stats error:', e);
      return await ctx.reply(`⚠️ Failed to fetch storage stats: ${e.message}`);
    }
  };

  bot.action('admin_menu_storage', handleStorageMenu);

  bot.action('admin_db_optimize', async (ctx) => {
    const userId = ctx.from?.id;
    if (!(await isAdminUser(env, userId))) return;

    await ctx.answerCbQuery('Optimizing database...');
    try {
      const res = await optimizeDatabase(env);
      await ctx.reply(`🧹 *${res.message}*`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Return to Storage Meter', 'admin_menu_storage')]])
      });
    } catch (e) {
      await ctx.reply(`⚠️ Optimization failed: ${e.message}`);
    }
  });

  // -------------------------------------------------------------
  // Bot-side Post Inline Editors
  // -------------------------------------------------------------
  bot.action(/^admin_edit_title_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    await setSession(env, userId, {
      step: 'EDIT_TITLE',
      editPostId: postId
    });

    await ctx.answerCbQuery();
    return await ctx.reply(
      '✏️ *Edit Title:*\nPlease send the new **Title** for this post:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', `admin_post_view_${postId}`)]
        ])
      }
    );
  });

  bot.action(/^admin_edit_img_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    const post = await getPostById(env, postId, userId, true);

    await setSession(env, userId, {
      step: 'EDIT_IMAGE',
      editPostId: postId
    });

    await ctx.answerCbQuery();

    if (post?.preview_image) {
      try {
        await ctx.replyWithPhoto(post.preview_image, {
          caption: `🖼️ *Current Preview Image:*\n${post.preview_image}`,
          parse_mode: 'Markdown'
        });
      } catch (imgErr) {
        await ctx.reply(`🖼️ *Current Preview Image:*\n${post.preview_image}`);
      }
    } else {
      await ctx.reply('ℹ️ This post does not currently have a preview image.');
    }

    return await ctx.reply(
      '🖼️ *Edit Preview Image:*\nPlease send a new image URL, upload a photo, or tap Remove Image:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🗑️ Remove Image', `admin_edit_img_remove_${postId}`)],
          [Markup.button.callback('❌ Cancel', `admin_post_view_${postId}`)]
        ])
      }
    );
  });

  bot.action(/^admin_edit_img_remove_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    await updatePost(env, postId, { preview_image: null });
    await clearSession(env, userId);
    await ctx.answerCbQuery('Preview image removed');
    return await ctx.reply('✅ Image removed successfully!', {
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Return to Post', `admin_post_view_${postId}`)]
      ])
    });
  });

  bot.action(/^admin_edit_link_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    const post = await getPostById(env, postId, userId, true);

    await setSession(env, userId, {
      step: 'EDIT_LINK',
      editPostId: postId
    });

    await ctx.answerCbQuery();

    // Send current link info to admin
    if (post?.direct_link) {
      await ctx.reply(
        `🔗 *Current Link:*\n${post.direct_link}\n• *Label:* ${post.direct_link_title || 'Open / Download Link'}`,
        { disable_web_page_preview: true }
      );
    } else {
      await ctx.reply('ℹ️ This post does not currently have a direct link set.');
    }

    return await ctx.reply(
      '🔗 *Edit Direct Link:*\nPlease send the new link URL and optional button label:\n• `https://mega.nz/... HD Pack`',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🗑️ Remove Direct Link', `admin_edit_link_remove_${postId}`)],
          [Markup.button.callback('❌ Cancel', `admin_post_view_${postId}`)]
        ])
      }
    );
  });

  bot.action(/^admin_edit_link_remove_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    await updatePost(env, postId, { direct_link: null, direct_link_title: null });
    await clearSession(env, userId);
    await ctx.answerCbQuery('Direct link removed');
    return await ctx.reply('✅ Direct link removed successfully!', {
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Return to Post', `admin_post_view_${postId}`)]
      ])
    });
  });

  // Recalculates total post file size across all folders and updates post title if applicable
  const recalculatePostSizeTitle = async (env, postId) => {
    try {
      const post = await getPostById(env, postId, 0, true);
      if (!post) return;
      const folders = post.folders || [];
      let totalBytes = 0;
      for (const fld of folders) {
        if (fld.files) {
          for (const f of fld.files) {
            totalBytes += Number(f.size) || 0;
          }
        }
      }
      if (totalBytes > 0) {
        const formatted = formatBytes(totalBytes);
        const m = post.title.match(/^(Post\s*#\d+)/i);
        let newTitle = post.title;
        if (m) {
          newTitle = `${m[1]} (${formatted})`;
        } else if (!post.title.includes('(')) {
          newTitle = `${post.title} (${formatted})`;
        } else {
          newTitle = post.title.replace(/\([^\)]+\)$/, `(${formatted})`);
        }
        if (newTitle !== post.title) {
          await updatePost(env, postId, { title: newTitle });
        }
      }
    } catch (e) {
      console.warn('Recalculate post size warning:', e.message);
    }
  };

  // 1. Post Folders Hub: Shows all folders as buttons + Create Folder button
  const showPostFoldersHub = async (ctx, postId, notice = '') => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const post = await getPostById(env, postId, userId, true);
    if (!post) {
      return await ctx.reply('⚠️ Post not found.');
    }

    const cleanTitle = cleanPostDisplayTitle(post.title, post.id);
    const folders = post.folders || [];

    let text = notice ? `${notice}\n\n` : '';
    text += `📂 *Folders & Files Manager*\n\n` +
      `• *Post:* ${escapeMarkdown(cleanTitle)}\n` +
      `• *Post ID:* \`#${post.id}\`\n` +
      `• *Folders:* ${folders.length}\n\n`;

    if (folders.length > 0) {
      text += `👇 *Select a folder below to view, add files, rename, or manage:*`;
    } else {
      text += `ℹ️ *No folders created yet.*\nTap **➕ Create New Folder** below to add your first folder!`;
    }

    const buttons = [];

    // Show each folder as a button with file count
    for (const fld of folders) {
      const fCount = fld.files ? fld.files.length : 0;
      buttons.push([
        Markup.button.callback(`📁 ${fld.name} (${fCount} ${fCount === 1 ? 'file' : 'files'})`, `admin_fld_view_${fld.id}_${postId}`)
      ]);
    }

    // Action buttons
    buttons.push([Markup.button.callback('➕ Create New Folder', `admin_fld_new_${postId}`)]);
    buttons.push([
      Markup.button.callback(post.direct_link ? '🔗 Edit Direct Link' : '🔗 Add Direct Link', `admin_edit_link_${postId}`),
      Markup.button.callback('🔙 Return to Post', `admin_post_view_${postId}`)
    ]);

    const keyboard = Markup.inlineKeyboard(buttons);
    if (ctx.callbackQuery) {
      try {
        return await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      } catch (e) {
        return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }
    } else {
      return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
  };

  // 2. Folder View: Shows folder details, files list, edit name, add files, remove files
  const showFolderView = async (ctx, folderId, postId, notice = '') => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const [folder, post] = await Promise.all([
      getFolderById(env, folderId),
      getPostById(env, postId, userId, true)
    ]);

    if (!folder) {
      return await showPostFoldersHub(ctx, postId, '⚠️ Folder not found or deleted.');
    }

    const files = folder.files || [];
    const totalBytes = files.reduce((acc, f) => acc + (Number(f.size) || 0), 0);
    const sizeText = totalBytes > 0 ? ` (${formatBytes(totalBytes)})` : '';
    const postTitle = cleanPostDisplayTitle(post?.title, postId);

    let text = notice ? `${notice}\n\n` : '';
    text += `📁 *Folder:* \`${escapeMarkdown(folder.name)}\`\n` +
      `• *Post:* ${escapeMarkdown(postTitle)} (\`#${postId}\`)\n` +
      `• *Files:* ${files.length} item(s)${sizeText}\n\n`;

    if (files.length > 0) {
      text += `📄 *Files in this folder:*\n`;
      files.forEach((f, idx) => {
        const icon = f.mime_type === 'link' ? '🔗' : '📄';
        const fSize = f.size > 0 ? ` _(${formatBytes(f.size)})_` : '';
        text += `${idx + 1}. ${icon} ${escapeMarkdown(f.file_name || 'File')}${fSize}\n`;
      });
    } else {
      text += `_This folder is currently empty._\nTap **➕ Add Files / Links** below to upload!`;
    }

    const buttons = [
      [
        Markup.button.callback('➕ Add Files / Links', `admin_fld_add_${folder.id}_${postId}`),
        Markup.button.callback('✏️ Edit Folder Name', `admin_fld_rename_${folder.id}_${postId}`)
      ]
    ];

    if (files.length > 0) {
      buttons.push([Markup.button.callback('🗑️ Remove Files', `admin_fld_remove_${folder.id}_${postId}`)]);
    }

    buttons.push([
      Markup.button.callback('🗑️ Delete Whole Folder', `admin_fld_delconf_${folder.id}_${postId}`),
      Markup.button.callback('🔙 Back to Folders List', `admin_folders_hub_${postId}`)
    ]);

    const keyboard = Markup.inlineKeyboard(buttons);
    if (ctx.callbackQuery) {
      try {
        return await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      } catch (e) {
        return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }
    } else {
      return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
  };

  // 3. Remove Files View: Tap any file to delete it
  const showFolderRemoveFiles = async (ctx, folderId, postId, notice = '') => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const folder = await getFolderById(env, folderId);
    if (!folder) {
      return await showPostFoldersHub(ctx, postId, '⚠️ Folder not found.');
    }

    const files = folder.files || [];
    let text = notice ? `${notice}\n\n` : '';
    text += `🗑️ *Remove Files from: \`${escapeMarkdown(folder.name)}\`*\n\n`;

    if (files.length === 0) {
      text += `_No files remaining in this folder._\n`;
    } else {
      text += `Tap on any file below to delete it from this folder:\n`;
    }

    const buttons = [];
    for (const f of files) {
      const icon = f.mime_type === 'link' ? '🔗' : '📄';
      const fName = (f.file_name || 'File').length > 25 ? (f.file_name || 'File').substring(0, 22) + '...' : (f.file_name || 'File');
      buttons.push([
        Markup.button.callback(`🗑️ Delete: ${icon} ${fName}`, `admin_fld_delfile_${f.id}_${folder.id}_${postId}`)
      ]);
    }

    buttons.push([
      Markup.button.callback('🔙 Back to Folder', `admin_fld_view_${folder.id}_${postId}`)
    ]);

    const keyboard = Markup.inlineKeyboard(buttons);
    if (ctx.callbackQuery) {
      try {
        return await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      } catch (e) {
        return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }
    } else {
      return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
  };

  // Callback Routes for Folders & Files
  bot.action(/^admin_folders_hub_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    return await showPostFoldersHub(ctx, ctx.match[1]);
  });

  bot.action(/^admin_edit_files_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    return await showPostFoldersHub(ctx, ctx.match[1]);
  });

  bot.action(/^admin_manage_files_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    return await showPostFoldersHub(ctx, ctx.match[1]);
  });

  bot.action(/^admin_fld_view_(\d+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    return await showFolderView(ctx, ctx.match[1], ctx.match[2]);
  });

  bot.action(/^admin_fld_new_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    await setSession(env, userId, {
      step: 'AWAITING_NEW_FOLDER_NAME',
      postId: postId
    });
    await ctx.answerCbQuery();

    const text = `📁 *Create New Folder*\n\nPlease type the name for this folder (e.g. \`Lecture Notes\`, \`PDF Documents\`, \`Audio Track\`):`;
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('❌ Cancel', `admin_folders_hub_${postId}`)]
    ]);

    return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action(/^admin_fld_rename_(\d+)_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const folderId = ctx.match[1];
    const postId = ctx.match[2];
    const folder = await getFolderById(env, folderId);

    await setSession(env, userId, {
      step: 'AWAITING_RENAME_FOLDER',
      folderId: folderId,
      postId: postId
    });
    await ctx.answerCbQuery();

    const text = `✏️ *Rename Folder*\n\nCurrent name: *${escapeMarkdown(folder?.name || 'Folder')}*\n\nPlease type the new name for this folder:`;
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('❌ Cancel', `admin_fld_view_${folderId}_${postId}`)]
    ]);

    return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action(/^admin_fld_add_(\d+)_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const folderId = ctx.match[1];
    const postId = ctx.match[2];
    const folder = await getFolderById(env, folderId);

    await setSession(env, userId, {
      step: 'AWAITING_FOLDER_FILES',
      activeFolderId: folderId,
      activePostId: postId,
      folderName: folder?.name || 'Folder'
    });
    await ctx.answerCbQuery();

    const text = `📥 *Upload Mode: \`${escapeMarkdown(folder?.name || 'Folder')}\`*\n\n` +
      `Send your files now:\n` +
      `• 📄 Documents, PDFs, ZIPs, APKs\n` +
      `• 📸 Photos & Images\n` +
      `• 🎬 Videos\n` +
      `• 🎵 Audio / Music\n` +
      `• 🔗 Links (send URL starting with http:// or https://)\n\n` +
      `💡 *Tip:* You can select and send multiple files at once!\n` +
      `When finished, tap **✅ Done Uploading** below.`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Done Uploading', `admin_fld_view_${folderId}_${postId}`)],
      [Markup.button.callback('🔙 Back to Folder', `admin_fld_view_${folderId}_${postId}`)]
    ]);

    return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action(/^admin_fld_remove_(\d+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    return await showFolderRemoveFiles(ctx, ctx.match[1], ctx.match[2]);
  });

  bot.action(/^admin_fld_delfile_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const fileId = ctx.match[1];
    const folderId = ctx.match[2];
    const postId = ctx.match[3];

    try {
      await deleteFile(env, fileId);
      recalculatePostSizeTitle(env, postId).catch(() => {});
      await ctx.answerCbQuery('✅ File deleted');
    } catch (err) {
      console.error('Error deleting file:', err);
      await ctx.answerCbQuery('❌ Failed to delete file');
    }

    return await showFolderRemoveFiles(ctx, folderId, postId);
  });

  bot.action(/^admin_fld_delconf_(\d+)_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const folderId = ctx.match[1];
    const postId = ctx.match[2];
    const folder = await getFolderById(env, folderId);

    await ctx.answerCbQuery();
    const text = `⚠️ *Are you sure you want to delete folder "${escapeMarkdown(folder?.name || 'Folder')}"?*\n\n` +
      `This will permanently remove this folder and all files inside it.`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🗑️ Yes, Delete Folder', `admin_fld_delete_${folderId}_${postId}`)],
      [Markup.button.callback('❌ Cancel', `admin_fld_view_${folderId}_${postId}`)]
    ]);

    if (ctx.callbackQuery) {
      try {
        return await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      } catch (e) {
        return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }
    } else {
      return await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
  });

  bot.action(/^admin_fld_delete_(\d+)_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const folderId = ctx.match[1];
    const postId = ctx.match[2];

    try {
      await deleteFolder(env, folderId);
      recalculatePostSizeTitle(env, postId).catch(() => {});
      await ctx.answerCbQuery('✅ Folder deleted');
      return await showPostFoldersHub(ctx, postId, '✅ Folder deleted successfully.');
    } catch (err) {
      console.error('Error deleting folder:', err);
      await ctx.answerCbQuery('❌ Failed to delete folder');
      return await showFolderView(ctx, folderId, postId, '❌ Failed to delete folder.');
    }
  });

  // -------------------------------------------------------------
  // Broadcast Flow (Button Triggered)
  // -------------------------------------------------------------
  const startBroadcastFlow = async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) {
      return await ctx.reply('⛔ Unauthorized. Admin access only.');
    }

    await setSession(env, userId, {
      step: 'BROADCAST_TEXT',
      broadcastMessage: '',
      broadcastPhoto: null,
      broadcastBtnText: null,
      broadcastBtnUrl: null
    });

    if (ctx.callbackQuery) await ctx.answerCbQuery();

    return await ctx.reply(
      '📢 *Step 1/3: Broadcast Announcement*\n\n' +
      'Please send the **Text Message** you would like to broadcast to all registered users (Markdown formatting supported):',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', 'step_cancel')]
        ])
      }
    );
  };

  bot.command('broadcast', startBroadcastFlow);
  bot.action('admin_menu_broadcast', startBroadcastFlow);

  bot.action('broadcast_skip_photo', async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const session = await getSession(env, userId);
    if (!session || session.step !== 'BROADCAST_PHOTO') return await ctx.answerCbQuery('Expired');

    session.broadcastPhoto = null;
    session.step = 'BROADCAST_BUTTON';
    await setSession(env, userId, session);
    await ctx.answerCbQuery('Skipped photo');

    return await ctx.reply(
      '🔗 *Step 3/3: Action Button (Optional)*\n\n' +
      'Send button label and link in format: `Button Label | https://example.com`\nor tap Skip:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('⏩ Skip Button', 'broadcast_skip_button')],
          [Markup.button.callback('❌ Cancel', 'step_cancel')]
        ])
      }
    );
  });

  bot.action('broadcast_skip_button', async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const session = await getSession(env, userId);
    if (!session || session.step !== 'BROADCAST_BUTTON') return await ctx.answerCbQuery('Expired');

    session.broadcastBtnText = null;
    session.broadcastBtnUrl = null;
    session.step = 'BROADCAST_CONFIRM';
    await setSession(env, userId, session);
    await ctx.answerCbQuery('Skipped button');

    return await sendBroadcastPreview(ctx, session);
  });

  async function sendBroadcastPreview(ctx, session) {
    const buttons = [
      [Markup.button.callback('🚀 Send Broadcast to All Users', 'broadcast_send_confirm')],
      [Markup.button.callback('❌ Cancel', 'step_cancel')]
    ];

    let previewInfo = `📢 *Broadcast Preview:*\n\n` +
      `• *Message:* ${session.broadcastMessage}\n` +
      (session.broadcastPhoto ? `• *Photo Attached:* Yes\n` : '') +
      (session.broadcastBtnText ? `• *Button:* [${session.broadcastBtnText}](${session.broadcastBtnUrl})\n` : '');

    return await ctx.reply(previewInfo, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  }

  bot.action('broadcast_send_confirm', async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const session = await getSession(env, userId);
    if (!session || session.step !== 'BROADCAST_CONFIRM') return await ctx.answerCbQuery('Session expired');

    await ctx.answerCbQuery('Sending broadcast...');
    await clearSession(env, userId);

    const userIds = await getAllUserIds(env);
    await ctx.reply(`📡 Broadcasting to ${userIds.length} users in background...`);

    let sent = 0;
    let failed = 0;
    const failedDetails = [];

    const keyboard = (session.broadcastBtnText && session.broadcastBtnUrl)
      ? Markup.inlineKeyboard([[Markup.button.url(session.broadcastBtnText, session.broadcastBtnUrl)]])
      : undefined;

    for (const targetId of userIds) {
      try {
        if (session.broadcastPhoto) {
          await ctx.telegram.sendPhoto(targetId, session.broadcastPhoto, {
            caption: session.broadcastMessage,
            parse_mode: 'Markdown',
            ...keyboard
          });
        } else {
          await ctx.telegram.sendMessage(targetId, session.broadcastMessage, {
            parse_mode: 'Markdown',
            ...keyboard
          });
        }
        sent++;
      } catch (e) {
        failed++;
        const reasonMsg = e.message || 'Error';
        if (/blocked|deactivated|forbidden/i.test(reasonMsg)) {
          updateUserBlockedStatus(env, targetId, true).catch(() => {});
        }
        failedDetails.push({ user_id: targetId, reason: reasonMsg });
      }
    }

    let summaryText = `✅ *Broadcast Complete!*\n\n` +
      `• 🚀 *Sent Successfully:* \`${sent}\`\n` +
      `• ❌ *Failed / Blocked:* \`${failed}\`\n` +
      `• 👥 *Total Targeted:* \`${userIds.length}\``;

    if (failedDetails.length > 0) {
      summaryText += `\n\n⚠️ *Failure Reasons Breakdown:*\n` +
        failedDetails.slice(0, 10).map(f => `• User \`#${f.user_id}\`: _${escapeMarkdown(f.reason)}_`).join('\n') +
        (failedDetails.length > 10 ? `\n_...and ${failedDetails.length - 10} more_` : '');
    }

    return await ctx.reply(summaryText, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Main Menu', 'admin_main_menu')]])
    });
  });

  // -------------------------------------------------------------
  // Cancel Command & Button Callback
  // -------------------------------------------------------------
  const handleCancel = async (ctx) => {
    const session = await getSession(env, ctx.from.id);
    if (session) {
      if (session.postId && session.step.startsWith('AWAITING_')) {
        try {
          await deletePost(env, session.postId);
        } catch (e) {
          console.warn('Could not delete temporary post record on cancel:', e);
        }
      }
      await clearSession(env, ctx.from.id);
      if (ctx.callbackQuery) await ctx.answerCbQuery('Action cancelled');
      return await ctx.reply('❌ Action was cancelled.', {
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Main Menu', 'main_menu')]])
      });
    }
    if (ctx.callbackQuery) await ctx.answerCbQuery('No active action');
    return await ctx.reply('ℹ️ No active action to cancel.', {
      ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Main Menu', 'main_menu')]])
    });
  };

  bot.command('cancel', handleCancel);
  bot.action('step_cancel', handleCancel);

  // -------------------------------------------------------------
  // Post Creation Flow (Button Triggered)
  // -------------------------------------------------------------
  const startAddPostFlow = async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) {
      return await ctx.reply('⛔ Unauthorized. Admin access only.');
    }

    const nextNum = await getNextPostNumber(env);
    const defaultTitle = `Post #${nextNum}`;

    const sessionData = {
      step: 'AWAITING_TITLE',
      postId: null,
      postNumber: nextNum,
      title: defaultTitle,
      preview_image: null,
      direct_link: null,
      direct_link_title: null,
      currentFiles: [],
      foldersCount: 0
    };

    await setSession(env, userId, sessionData);
    if (ctx.callbackQuery) await ctx.answerCbQuery();

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(`⏩ Use Default: ${defaultTitle}`, 'step_use_default_title')],
      [Markup.button.callback('❌ Cancel', 'step_cancel')]
    ]);

    return await ctx.reply(
      `📝 *Step 1/3: Post Title*\n\n` +
      `Default Title: *${defaultTitle}*\n\n` +
      `• Send a title, or\n` +
      `• Send folder/file size (e.g. *226.8 MB*) to make it *${defaultTitle} (226.8 MB)*, or\n` +
      `• Tap the button below to use default:`,
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );
  };

  bot.action('step_use_default_title', async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const session = await getSession(env, userId);
    if (!session || session.step !== 'AWAITING_TITLE') {
      return await ctx.answerCbQuery('Action not available');
    }

    const nextNum = session.postNumber || (await getNextPostNumber(env));
    session.title = `Post #${nextNum}`;
    session.step = 'AWAITING_IMAGE';
    await setSession(env, userId, session);
    await ctx.answerCbQuery();

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⏩ Skip Image', 'step_skip_image')],
      [Markup.button.callback('❌ Cancel', 'step_cancel')]
    ]);

    return await ctx.reply(
      `🖼️ *Step 2/3: Preview Image*\n\n` +
      `Post Title: *${escapeMarkdown(session.title)}*\n\n` +
      `Send an image URL (e.g. \`https://catbox.moe/...\`) or upload a photo, or tap Skip:`,
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );
  });

  bot.command('addpost', startAddPostFlow);
  bot.action('admin_menu_addpost', startAddPostFlow);

  bot.action('step_skip_image', async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const session = await getSession(env, userId);
    if (!session || session.step !== 'AWAITING_IMAGE') {
      return await ctx.answerCbQuery('Action not available');
    }

    session.preview_image = null;
    await setSession(env, userId, session);
    await ctx.answerCbQuery('Skipped image');

    return await sendContentChoicePrompt(ctx, session);
  });

  async function sendContentChoicePrompt(ctx, session) {
    session.step = 'CHOOSING_CONTENT_MODE';
    await setSession(env, ctx.from.id, session);

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔗 Add Direct Link (No Folder)', 'mode_direct_link')],
      [Markup.button.callback('📂 Upload Media & Organize Folders', 'mode_folders')],
      [Markup.button.callback('🚀 Publish Now (Title & Image only)', 'action_publish')],
      [Markup.button.callback('❌ Cancel', 'step_cancel')]
    ]);

    return await ctx.reply(
      `🎯 *Step 3/3: Choose Content Type*\n\n` +
      `How would you like to attach content to *"${escapeMarkdown(session.title)}"*?\n\n` +
      `• **Direct Link:** Single download link without folders\n` +
      `• **Folders & Files:** Group multiple files & links into named folders\n` +
      `• **Publish Now:** Publish text & preview image only`,
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );
  }

  bot.action('mode_direct_link', async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const session = await getSession(env, userId);
    if (!session) return await ctx.answerCbQuery('Session expired');

    session.step = 'AWAITING_DIRECT_LINK';
    await setSession(env, userId, session);
    await ctx.answerCbQuery();

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('❌ Cancel', 'step_cancel')]
    ]);

    return await ctx.reply(
      '🔗 *Send Direct Link:*\n\n' +
      'Paste your URL and optional label:\n' +
      '• `https://drive.google.com/file/d/xxx Course PDF Notes`\n' +
      '• `https://mega.nz/folder/xxx HD Pack`\n\n' +
      '*(No folder needed)*',
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );
  });

  bot.action('mode_folders', async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    let session = await getSession(env, userId);
    if (!session || !session.title) {
      return await ctx.answerCbQuery('Session expired');
    }

    if (!session.postId) {
      const post = await createPost(env, {
        title: session.title,
        preview_image: session.preview_image || null,
        direct_link: session.direct_link || null,
        direct_link_title: session.direct_link_title || null,
        status: 'draft',
        created_by: userId
      });
      session.postId = post.id;
      await setSession(env, userId, session);
    }

    await ctx.answerCbQuery();
    return await showPostFoldersHub(ctx, session.postId);
  });

  async function sendStep3Prompt(ctx, session) {
    if (session?.postId) {
      return await showPostFoldersHub(ctx, session.postId);
    }
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📂 Open Folders Manager', 'mode_folders')],
      [Markup.button.callback('🔗 Add Direct Link', 'mode_direct_link')],
      [Markup.button.callback('❌ Cancel', 'step_cancel')]
    ]);
    return await ctx.reply(
      '📂 *Folder & File Manager*\n\nTap below to open your folders and start uploading files:',
      { parse_mode: 'Markdown', ...keyboard }
    );
  }

  bot.action('step_prompt_folder_name', async (ctx) => {
    await ctx.answerCbQuery();
    return await ctx.reply(
      '📁 *Please type the Folder Name* (e.g. `Cheat Sheets`, `Lecture Materials`) to group the buffered files:',
      { parse_mode: 'Markdown' }
    );
  });

  const handleFinishFolders = async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const session = await getSession(env, userId);
    if (!session || !session.title) {
      if (ctx.callbackQuery) await ctx.answerCbQuery('No active post creation');
      return await ctx.reply('ℹ️ You are not currently creating a post.');
    }

    if (session.currentFiles && session.currentFiles.length > 0) {
      try {
        if (!session.postId) {
          const post = await createPost(env, {
            title: session.title,
            preview_image: session.preview_image || null,
            direct_link: session.direct_link || null,
            direct_link_title: session.direct_link_title || null,
            status: 'draft',
            created_by: userId
          });
          session.postId = post.id;
        }

        const folder = await createFolder(env, {
          post_id: session.postId,
          name: 'General Resources'
        });
        const filesToInsert = session.currentFiles.map(f => ({
          ...f,
          folder_id: folder.id
        }));
        await createFiles(env, filesToInsert);
        session.foldersCount = (session.foldersCount || 0) + 1;
        session.currentFiles = [];
        await ctx.reply(`📁 Saved ${filesToInsert.length} buffered item(s) into "General Resources" folder.`);
      } catch (e) {
        console.error('Error auto-saving buffered items on done:', e);
      }
    }

    session.step = 'AWAITING_PUBLISH_CHOICE';
    await setSession(env, userId, session);

    if (ctx.callbackQuery) await ctx.answerCbQuery();

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Publish Now', 'action_publish')],
      [Markup.button.callback(session.direct_link ? '🔗 Edit Direct Link' : '🔗 Add Direct Link', 'mode_direct_link')],
      [Markup.button.callback('📂 Upload More Files/Folders', 'mode_folders')],
      [Markup.button.callback('📅 Schedule', 'action_schedule')],
      [Markup.button.callback('📝 Save as Draft', 'action_draft')]
    ]);

    return await ctx.reply(
      `🎉 *Post Ready for Publishing!*\n\n` +
      `• *Title:* ${escapeMarkdown(session.title)}\n` +
      (session.direct_link ? `• *Direct Link:* ${escapeMarkdown(session.direct_link)}\n` : '') +
      `• *Folders Created:* ${session.foldersCount || 0}\n\n` +
      `Choose how you would like to publish this post:`,
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );
  };

  bot.command('done', handleFinishFolders);
  bot.action('step_finish_folders', handleFinishFolders);

  // -------------------------------------------------------------
  // Publish / Schedule / Draft Actions
  // -------------------------------------------------------------
  bot.action('action_draft', async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const session = await getSession(env, userId);
    if (!session || !session.title) {
      await ctx.answerCbQuery('Session expired.');
      return await ctx.reply('⚠️ Session expired.');
    }

    try {
      let postId = session.postId;
      if (!postId) {
        const created = await createPost(env, {
          title: session.title,
          preview_image: session.preview_image || null,
          direct_link: session.direct_link || null,
          direct_link_title: session.direct_link_title || null,
          status: 'draft',
          created_by: userId
        });
        postId = created.id;
      } else {
        await updatePost(env, postId, {
          title: session.title,
          preview_image: session.preview_image || null,
          direct_link: session.direct_link || null,
          direct_link_title: session.direct_link_title || null,
          status: 'draft'
        });
      }

      await clearSession(env, userId);
      await ctx.answerCbQuery('Saved as draft');

      return await ctx.reply(
        `📝 *Post Saved as Draft!*\n\n` +
        `Post ID: \`${postId}\`\n` +
        `Title: *${escapeMarkdown(session.title)}*`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📑 Manage Posts', 'admin_post_list')],
            [Markup.button.callback('🏠 Main Menu', 'admin_main_menu')]
          ])
        }
      );
    } catch (err) {
      console.error('Failed to save draft:', err);
      return await ctx.reply(`⚠️ Failed to save draft: ${err.message}`);
    }
  });

  bot.action('action_publish', async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const session = await getSession(env, userId);
    if (!session || !session.title) {
      await ctx.answerCbQuery('Session expired.');
      return await ctx.reply('⚠️ Session expired.');
    }

    try {
      let postId = session.postId;
      if (!postId) {
        const created = await createPost(env, {
          title: session.title,
          preview_image: session.preview_image || null,
          direct_link: session.direct_link || null,
          direct_link_title: session.direct_link_title || null,
          status: 'published',
          created_by: userId
        });
        postId = created.id;
      } else {
        await updatePost(env, postId, {
          title: session.title,
          preview_image: session.preview_image || null,
          direct_link: session.direct_link || null,
          direct_link_title: session.direct_link_title || null,
          status: 'published'
        });
      }

      await clearSession(env, userId);
      await ctx.answerCbQuery('Published!');

      const botInfo = await ctx.telegram.getMe().catch(() => ({ username: 'Xminty_bot' }));
      const botUsername = env.BOT_USERNAME || botInfo?.username || 'Xminty_bot';
      const deepLink = `https://t.me/${botUsername}?start=post_${postId}`;

      return await ctx.reply(
        `🚀 *Post Published Successfully!*\n\n` +
        `• *Title:* ${escapeMarkdown(session.title)}\n` +
        `• *Deep Link:* ${deepLink}\n\n` +
        `This post is now live on the Web App and ready for all users.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('🔗 Open Post Link', deepLink)],
            [Markup.button.callback('📑 Manage Posts', 'admin_post_list')],
            [Markup.button.callback('🏠 Main Menu', 'admin_main_menu')]
          ])
        }
      );
    } catch (err) {
      console.error('Failed to publish post:', err);
      return await ctx.reply(`⚠️ Failed to publish post: ${err.message}`);
    }
  });

  bot.action('action_schedule', async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const session = await getSession(env, userId);
    if (!session || !session.title) {
      await ctx.answerCbQuery('Session expired.');
      return await ctx.reply('⚠️ Session expired.');
    }

    session.step = 'AWAITING_SCHEDULE_TIME';
    await setSession(env, userId, session);
    await ctx.answerCbQuery('Awaiting schedule date');

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('❌ Cancel', 'step_cancel')]
    ]);

    return await ctx.reply(
      `📅 *Schedule Post*\n\n` +
      `Please reply with the publish date and time in Indian Standard Time (IST).\n` +
      `*Format:* \`YYYY-MM-DD HH:MM\`\n` +
      `*Example:* \`2026-10-15 14:30\``,
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );
  });

  // -------------------------------------------------------------
  // Reply Keyboard Text Router & Multi-step Message Handler
  // -------------------------------------------------------------
  bot.on('message', async (ctx) => {
    const userId = ctx.from?.id;
    const text = ctx.message.text ? ctx.message.text.trim() : null;

    // 1. Check for persistent reply keyboard button clicks
    if (text) {
      const isAdmin = await isAdminUser(env, userId);
      if (isAdmin) {
        if (text === '➕ Add Post') return await startAddPostFlow(ctx);
        if (text === '📑 Manage Posts') return await handleAdminPosts(ctx);
        if (text === '📊 Stats' || text === '📊 Hub Stats') return await handleStats(ctx);
        if (text === '📢 Broadcast') return await startBroadcastFlow(ctx);
        if (text === '⚙️ Settings') return await handleSettingsMenu(ctx);
      }
      if (text === '🔍 Browse Posts' || text === '🔍 Browse All Posts') return await handleBrowsePosts(ctx);
      if (text === '🔖 Saved Posts' || text === '🔖 My Saved Posts') return await handleSavedPosts(ctx);
      if (text === '🎁 Invite Friends') return await handleInviteFriends(ctx);
      if (text === '❌ Cancel') return await handleCancel(ctx);
    }

    // 2. Multi-step session handling
    const session = await getSession(env, userId);
    if (!session || !session.step) return;

    // STEP: EDIT_AUTO_DELETE_TIMER
    if (session.step === 'EDIT_AUTO_DELETE_TIMER') {
      if (!text) return await ctx.reply('⚠️ Please enter a number in minutes (e.g. 15, 30, 60, or 0 to disable).');
      const minutes = parseInt(text.trim(), 10);
      if (isNaN(minutes) || minutes < 0) {
        return await ctx.reply('⚠️ Please enter a valid non-negative number of minutes.');
      }

      const postId = session.editPostId;
      await updatePost(env, postId, { auto_delete_minutes: minutes });
      await clearSession(env, userId);

      return await ctx.reply(
        `✅ *Auto-Delete Timer Updated!*\n\nPost #${postId} timer is set to: *${minutes === 0 ? 'Disabled (Never Delete)' : minutes + ' Minutes'}*`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Return to Post View', `admin_post_view_${postId}`)]])
        }
      );
    }

    // STEP: ADD_ADMIN_USER_ID
    if (session.step === 'ADD_ADMIN_USER_ID') {
      if (!text) return await ctx.reply('⚠️ Please send the Telegram User ID of the new admin.');
      const parts = text.split('|').map(s => s.trim());
      const newAdminId = parseInt(parts[0], 10);
      const adminName = parts[1] || '';

      if (isNaN(newAdminId) || newAdminId <= 0) {
        return await ctx.reply('⚠️ Invalid Telegram User ID. Please enter a positive numerical ID.');
      }

      try {
        await addAdmin(env, {
          user_id: newAdminId,
          full_name: adminName,
          added_by: userId
        });
        await clearSession(env, userId);

        return await ctx.reply(
          `✅ *Admin Added Successfully!*\n\n• *User ID:* \`${newAdminId}\`\n• *Name/Note:* ${escapeMarkdown(adminName || 'Co-Admin')}\n\nThis user now has full admin privileges in both the Bot and Web App.`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.callback('👥 Return to Admins List', 'admin_menu_admins')]])
          }
        );
      } catch (e) {
        return await ctx.reply(`⚠️ Failed to add admin: ${e.message}`);
      }
    }

    // STEP: AWAITING_FORCE_CHANNEL
    if (session.step === 'AWAITING_FORCE_CHANNEL') {
      if (!text || !text.includes('|')) {
        return await ctx.reply('⚠️ Invalid format. Format: `<Channel ID> | <Channel Title> | <Invite Link>`');
      }
      const parts = text.split('|').map(s => s.trim());
      const channel_id = parts[0];
      const channel_title = parts[1];
      const invite_link = parts[2];

      if (!channel_id || !channel_title || !invite_link) {
        return await ctx.reply('⚠️ Please provide Channel ID, Channel Title, and Invite Link separated by `|`.');
      }

      await addForceChannel(env, { channel_id, channel_title, invite_link });
      await clearSession(env, userId);

      return await ctx.reply(
        `✅ *Channel Added Successfully!*\n\n• *Title:* ${escapeMarkdown(channel_title)}\n• *ID:* \`${channel_id}\``,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('⚙️ Return to Settings', 'admin_menu_settings')]])
        }
      );
    }

    // STEP: AWAITING_REQSTART_MSG
    if (session.step === 'AWAITING_REQSTART_MSG') {
      if (!text) {
        return await ctx.reply('⚠️ Please send a valid message text.');
      }
      let promptMsg = text.trim();
      let promptLink = '';
      if (text.includes('|')) {
        const parts = text.split('|').map(s => s.trim());
        promptMsg = parts[0] || 'Please start our official bot to unlock full access and view content.';
        promptLink = parts[1] || '';
      }

      await updateSetting(env, 'require_bot_start_message', promptMsg);
      if (promptLink) {
        await updateSetting(env, 'require_bot_start_link', promptLink);
      }
      await clearSession(env, userId);

      return await ctx.reply(
        `✅ *Require Bot Start Prompt Saved!*\n\n` +
        `• *Message:* ${escapeMarkdown(promptMsg)}\n` +
        `• *Link:* \`${promptLink || 'Default (Bot Link)'}\``,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('⚙️ Return to Settings', 'admin_menu_settings')]])
        }
      );
    }

    // STEP: EDIT_TITLE
    if (session.step === 'EDIT_TITLE') {
      if (!text) return await ctx.reply('⚠️ Please send a valid text title.');

      const postId = session.editPostId;
      await updatePost(env, postId, { title: text });
      await clearSession(env, userId);

      return await ctx.reply(
        `✅ *Title Updated Successfully!*\n\nNew Title: *"${escapeMarkdown(text)}"*\n`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Return to Post View', `admin_post_view_${postId}`)]
          ])
        }
      );
    }

    // STEP: EDIT_IMAGE
    if (session.step === 'EDIT_IMAGE') {
      let imageUrl = null;
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        imageUrl = text;
      } else if (ctx.message.photo) {
        const photoArr = ctx.message.photo;
        const highestRes = photoArr[photoArr.length - 1];
        try {
          const fileLink = await ctx.telegram.getFileLink(highestRes.file_id);
          imageUrl = fileLink.href;
        } catch (e) {
          console.warn('Could not get photo link:', e);
        }
      }

      if (!imageUrl) {
        return await ctx.reply('⚠️ Please send a valid HTTP(S) image URL or upload a photo.');
      }

      const postId = session.editPostId;
      await updatePost(env, postId, { preview_image: imageUrl });
      await clearSession(env, userId);

      return await ctx.reply(
        `✅ *Preview Image Updated Successfully!*`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Return to Post View', `admin_post_view_${postId}`)]
          ])
        }
      );
    }

    // STEP: EDIT_LINK
    if (session.step === 'EDIT_LINK') {
      if (!text || (!text.startsWith('http://') && !text.startsWith('https://') && !text.includes('://'))) {
        return await ctx.reply('⚠️ Please send a valid link starting with http:// or https://');
      }

      const parts = text.split(/\s+/);
      const urlPart = parts.find(p => p.startsWith('http://') || p.startsWith('https://'));
      const labelParts = parts.filter(p => p !== urlPart).join(' ');

      const postId = session.editPostId;
      await updatePost(env, postId, {
        direct_link: urlPart,
        direct_link_title: labelParts || 'Open / Download Link'
      });
      await clearSession(env, userId);

      return await ctx.reply(
        `✅ *Direct Link Updated Successfully!*\n\n• *Link:* ${escapeMarkdown(urlPart)}\n• *Label:* ${escapeMarkdown(labelParts || 'Open / Download Link')}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Return to Post View', `admin_post_view_${postId}`)]
          ])
        }
      );
    }

    // STEP: BROADCAST_TEXT
    if (session.step === 'BROADCAST_TEXT') {
      if (!text) return await ctx.reply('⚠️ Please send text content for the broadcast.');

      session.broadcastMessage = text;
      session.step = 'BROADCAST_PHOTO';
      await setSession(env, userId, session);

      return await ctx.reply(
        '🖼️ *Step 2/3: Attach Photo (Optional)*\n\nUpload a photo or send an image URL, or tap Skip:',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('⏩ Skip Photo', 'broadcast_skip_photo')],
            [Markup.button.callback('❌ Cancel', 'step_cancel')]
          ])
        }
      );
    }

    // STEP: BROADCAST_PHOTO
    if (session.step === 'BROADCAST_PHOTO') {
      let photoUrl = null;
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        photoUrl = text;
      } else if (ctx.message.photo) {
        const photoArr = ctx.message.photo;
        const highestRes = photoArr[photoArr.length - 1];
        try {
          const fileLink = await ctx.telegram.getFileLink(highestRes.file_id);
          photoUrl = fileLink.href;
        } catch (e) {}
      }

      session.broadcastPhoto = photoUrl;
      session.step = 'BROADCAST_BUTTON';
      await setSession(env, userId, session);

      return await ctx.reply(
        '🔗 *Step 3/3: Action Button (Optional)*\n\nSend button label and link in format: `Button Label | https://example.com`\nor tap Skip:',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('⏩ Skip Button', 'broadcast_skip_button')],
            [Markup.button.callback('❌ Cancel', 'step_cancel')]
          ])
        }
      );
    }

    // STEP: BROADCAST_BUTTON
    if (session.step === 'BROADCAST_BUTTON') {
      if (text && text.includes('|')) {
        const parts = text.split('|').map(s => s.trim());
        session.broadcastBtnText = parts[0];
        session.broadcastBtnUrl = parts[1];
      }

      session.step = 'BROADCAST_CONFIRM';
      await setSession(env, userId, session);

      return await sendBroadcastPreview(ctx, session);
    }

    // STEP 1: Awaiting Title
    if (session.step === 'AWAITING_TITLE') {
      const nextNum = session.postNumber || (await getNextPostNumber(env));
      const defaultTitle = `Post #${nextNum}`;
      const trimmed = (text || '').trim();

      if (!trimmed || trimmed.toLowerCase() === '/skip' || trimmed.toLowerCase() === 'skip') {
        session.title = defaultTitle;
      } else {
        const isSizeOnly = /^\(?[0-9]+(\.[0-9]+)?\s*(B|KB|MB|GB|TB)\)?$/i.test(trimmed);
        if (isSizeOnly) {
          const cleanSize = trimmed.replace(/[()]/g, '').trim();
          session.title = `Post #${nextNum} (${cleanSize})`;
        } else {
          session.title = trimmed;
        }
      }

      session.step = 'AWAITING_IMAGE';
      await setSession(env, userId, session);

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⏩ Skip Image', 'step_skip_image')],
        [Markup.button.callback('❌ Cancel', 'step_cancel')]
      ]);

      return await ctx.reply(
        `🖼️ *Step 2/3: Preview Image*\n\n` +
        `Post Title: *${escapeMarkdown(session.title)}*\n\n` +
        `Send an image URL (e.g. \`https://catbox.moe/...\`) or upload a photo, or tap Skip:`,
        {
          parse_mode: 'Markdown',
          ...keyboard
        }
      );
    }

    // STEP 2: Awaiting Image
    if (session.step === 'AWAITING_IMAGE') {
      let imageUrl = null;

      if (text && text.toLowerCase() !== 'skip') {
        if (text.startsWith('http://') || text.startsWith('https://')) {
          imageUrl = text;
        } else {
          return await ctx.reply('⚠️ Please send a valid HTTP(S) image URL or tap Skip.');
        }
      } else if (ctx.message.photo) {
        const photoArr = ctx.message.photo;
        const highestRes = photoArr[photoArr.length - 1];
        try {
          const fileLink = await ctx.telegram.getFileLink(highestRes.file_id);
          imageUrl = fileLink.href;
        } catch (e) {
          console.warn('Could not get photo link:', e);
        }
      }

      if (imageUrl) {
        session.preview_image = imageUrl;
        await setSession(env, userId, session);
      }

      return await sendContentChoicePrompt(ctx, session);
    }

    // Direct Link Mode
    if (session.step === 'AWAITING_DIRECT_LINK') {
      if (!text || (!text.startsWith('http://') && !text.startsWith('https://') && !text.includes('://'))) {
        return await ctx.reply('⚠️ Please send a valid link starting with http:// or https://');
      }

      const parts = text.split(/\s+/);
      const urlPart = parts.find(p => p.startsWith('http://') || p.startsWith('https://'));
      const labelParts = parts.filter(p => p !== urlPart).join(' ');

      session.direct_link = urlPart;
      session.direct_link_title = labelParts || 'Open / Download Link';

      if (labelParts) {
        const sizeMatch = labelParts.match(/[0-9]+(\.[0-9]+)?\s*(B|KB|MB|GB|TB)/i);
        if (sizeMatch) {
          const s = sizeMatch[0].trim();
          const m = session.title.match(/^(Post\s*#\d+)/i);
          if (m) {
            session.title = `${m[1]} (${s})`;
          } else if (!session.title.includes('(')) {
            session.title = `${session.title} (${s})`;
          }
        }
      }

      session.step = 'AWAITING_PUBLISH_CHOICE';
      await setSession(env, userId, session);

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🚀 Publish Now', 'action_publish')],
        [Markup.button.callback('📂 Also Add Files / Folders', 'mode_folders')],
        [Markup.button.callback('📅 Schedule', 'action_schedule')],
        [Markup.button.callback('📝 Save as Draft', 'action_draft')],
        [Markup.button.callback('❌ Cancel', 'step_cancel')]
      ]);

      return await ctx.reply(
        `🎉 *Post Ready!*\n\n` +
        `• *Title:* ${escapeMarkdown(session.title)}\n` +
        `• *Direct Link:* ${escapeMarkdown(session.direct_link)}\n` +
        `• *Button Label:* ${escapeMarkdown(session.direct_link_title)}\n\n` +
        `Choose how to save this post:`,
        {
          parse_mode: 'Markdown',
          ...keyboard
        }
      );
    }

    // 1. Create New Folder Name Step
    if (session.step === 'AWAITING_NEW_FOLDER_NAME') {
      if (!text || text.startsWith('/')) return;
      const folderName = text.trim();
      const postId = session.postId;

      try {
        const folder = await createFolder(env, {
          post_id: Number(postId),
          name: folderName
        });
        session.step = null;
        await setSession(env, userId, session);
        return await showFolderView(ctx, folder.id, postId, `✅ Folder "*${escapeMarkdown(folderName)}*" created!`);
      } catch (err) {
        console.error('Error creating folder:', err);
        return await ctx.reply(`⚠️ Failed to create folder: ${err.message}`, {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Folders', `admin_folders_hub_${postId}`)]
          ])
        });
      }
    }

    // 2. Rename Folder Step
    if (session.step === 'AWAITING_RENAME_FOLDER') {
      if (!text || text.startsWith('/')) return;
      const newName = text.trim();
      const folderId = session.folderId;
      const postId = session.postId;

      try {
        await updateFolder(env, folderId, { name: newName });
        session.step = null;
        await setSession(env, userId, session);
        return await showFolderView(ctx, folderId, postId, `✅ Folder renamed to "*${escapeMarkdown(newName)}*"!`);
      } catch (err) {
        console.error('Error renaming folder:', err);
        return await ctx.reply(`⚠️ Failed to rename folder: ${err.message}`, {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Folder', `admin_fld_view_${folderId}_${postId}`)]
          ])
        });
      }
    }

    // 3. Folders and Files Upload Mode
    if (session.step === 'AWAITING_FOLDER_FILES' || session.step === 'AWAITING_FOLDERS') {
      let folderId = session.activeFolderId;
      let postId = session.activePostId || session.postId;

      // If active folder is not specified but postId is known, find or auto-create a folder
      if (!folderId && postId) {
        const existingFolders = await getPostFoldersWithFiles(env, postId);
        if (existingFolders && existingFolders.length > 0) {
          folderId = existingFolders[0].id;
          session.activeFolderId = folderId;
        } else {
          const newFld = await createFolder(env, { post_id: Number(postId), name: 'General Resources' });
          folderId = newFld.id;
          session.activeFolderId = folderId;
        }
      }

      if (!folderId) {
        return await ctx.reply('⚠️ Please create or select a folder first before uploading files.', {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📂 Open Folders Manager', postId ? `admin_folders_hub_${postId}` : 'admin_post_list')]
          ])
        });
      }

      const msg = ctx.message;
      let itemMeta = null;

      if (text && (text.startsWith('http://') || text.startsWith('https://') || text.includes('://'))) {
        const parts = text.split(/\s+/);
        const urlPart = parts.find(p => p.startsWith('http://') || p.startsWith('https://'));
        const labelParts = parts.filter(p => p !== urlPart).join(' ');

        if (urlPart) {
          itemMeta = {
            file_id: urlPart,
            channel_message_id: null,
            file_name: labelParts || 'Download Link',
            mime_type: 'link',
            size: 0
          };
        }
      }

      if (!itemMeta) {
        if (msg.photo) {
          const photo = msg.photo[msg.photo.length - 1];
          itemMeta = {
            file_id: photo.file_id,
            file_name: 'Photo_' + Date.now().toString().slice(-4) + '.jpg',
            mime_type: 'image/jpeg',
            size: photo.file_size || 0
          };
        } else if (msg.document) {
          itemMeta = {
            file_id: msg.document.file_id,
            file_name: msg.document.file_name || 'Document',
            mime_type: msg.document.mime_type || 'application/octet-stream',
            size: msg.document.file_size || 0
          };
        } else if (msg.video) {
          itemMeta = {
            file_id: msg.video.file_id,
            file_name: msg.video.file_name || 'Video_' + Date.now().toString().slice(-4) + '.mp4',
            mime_type: msg.video.mime_type || 'video/mp4',
            size: msg.video.file_size || 0
          };
        } else if (msg.audio) {
          itemMeta = {
            file_id: msg.audio.file_id,
            file_name: msg.audio.file_name || msg.audio.title || 'Audio_' + Date.now().toString().slice(-4) + '.mp3',
            mime_type: msg.audio.mime_type || 'audio/mpeg',
            size: msg.audio.file_size || 0
          };
        }
      }

      if (itemMeta) {
        let channelMessageId = null;
        if (itemMeta.mime_type !== 'link' && env.CHANNEL_ID) {
          try {
            const copied = await ctx.telegram.copyMessage(env.CHANNEL_ID, ctx.chat.id, msg.message_id, {
              caption: ''
            });
            channelMessageId = copied.message_id;
          } catch (copyErr) {
            console.warn('Channel copy warning:', copyErr.message);
          }
        }

        try {
          await createFiles(env, [{
            folder_id: Number(folderId),
            file_id: itemMeta.file_id,
            channel_message_id: channelMessageId,
            file_name: itemMeta.file_name,
            mime_type: itemMeta.mime_type,
            size: itemMeta.size || 0
          }]);

          if (postId) {
            recalculatePostSizeTitle(env, postId).catch(() => {});
          }
        } catch (dbErr) {
          console.error('Error saving file to folder:', dbErr);
          return await ctx.reply(`⚠️ Failed to save file to folder: ${dbErr.message}`);
        }

        const icon = itemMeta.mime_type === 'link' ? '🔗' : '📥';
        const fSize = itemMeta.size > 0 ? ` (${formatBytes(itemMeta.size)})` : '';
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('✅ Done Uploading', `admin_fld_view_${folderId}_${postId}`)],
          [Markup.button.callback('📂 View All Folders', `admin_folders_hub_${postId}`)]
        ]);

        return await ctx.reply(
          `${icon} *Added to folder:* \`${escapeMarkdown(itemMeta.file_name)}\`${fSize}\n\n` +
          `_Send more files or links, or tap Done below:_`,
          {
            parse_mode: 'Markdown',
            ...keyboard
          }
        );
      }
    }

    // Schedule Time (in IST)
    if (session.step === 'AWAITING_SCHEDULE_TIME') {
      if (!text) {
        return await ctx.reply('⚠️ Please send a valid date string (e.g. `2026-10-15 14:30`) in Indian Standard Time (IST).');
      }

      let dateString = text.trim().replace(' ', 'T');
      if (!dateString.includes('+') && !dateString.endsWith('Z')) {
        if (dateString.length === 16) {
          dateString += ':00+05:30';
        } else if (dateString.length === 19) {
          dateString += '+05:30';
        } else {
          dateString += '+05:30';
        }
      }
      const parsedDate = new Date(dateString);

      if (isNaN(parsedDate.getTime()) || parsedDate.getTime() <= Date.now()) {
        return await ctx.reply(
          '⚠️ Invalid date or the date is in the past.\n' +
          'Please provide a future date in IST format: `YYYY-MM-DD HH:MM` (e.g. `2026-10-15 14:30`)'
        );
      }

      try {
        let postId = session.postId;
        if (!postId) {
          const post = await createPost(env, {
            title: session.title,
            preview_image: session.preview_image || null,
            direct_link: session.direct_link || null,
            direct_link_title: session.direct_link_title || null,
            status: 'scheduled',
            scheduled_at: parsedDate.toISOString(),
            created_by: userId
          });
          postId = post.id;
        } else {
          await updatePost(env, postId, {
            title: session.title,
            preview_image: session.preview_image || null,
            direct_link: session.direct_link || null,
            direct_link_title: session.direct_link_title || null,
            status: 'scheduled',
            scheduled_at: parsedDate.toISOString()
          });
        }

        await clearSession(env, userId);

        return await ctx.reply(
          `📅 *Post Successfully Scheduled!*\n\n` +
          `• *Title:* ${escapeMarkdown(session.title)}\n` +
          `• *Publish Date (IST):* ${formatIST(parsedDate)}\n\n` +
          `The Cloudflare Cron Trigger will automatically publish this post when the scheduled time arrives.`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('📑 Manage Posts', 'admin_post_list')],
              [Markup.button.callback('🏠 Main Menu', 'admin_main_menu')]
            ])
          }
        );
      } catch (err) {
        console.error('Failed to schedule post:', err);
        return await ctx.reply(`⚠️ Failed to schedule post: ${err.message}`);
      }
    }
  });

  return bot;
}
