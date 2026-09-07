import { Telegraf, Markup } from 'telegraf';
import {
  saveOrUpdateUser,
  getPostById,
  getAllPostsForAdmin,
  getPublishedPosts,
  getSavedPosts,
  getPostFoldersWithFiles,
  getFolderFiles,
  createPost,
  updatePost,
  deletePost,
  togglePromotePost,
  createFolder,
  createFiles,
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
  getAllUsers,
  getUser,
  isAdminUser,
  getAdmins,
  addAdmin,
  deleteAdmin,
  getDatabaseStorageStats,
  optimizeDatabase,
  recordPostView,
  recordFileAccess
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
    for (const ch of channels) {
      try {
        const member = await ctx.telegram.getChatMember(ch.channel_id, userId);
        const validStatuses = ['creator', 'administrator', 'member', 'restricted'];
        if (!validStatuses.includes(member.status)) {
          unjoined.push(ch);
        }
      } catch (e) {
        console.warn(`Could not check membership for channel ${ch.channel_id}:`, e.message);
        unjoined.push(ch);
      }
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
  // Record view count & file access / download
  if (postId && ctx.from?.id) {
    recordPostView(env, {
      post_id: Number(postId),
      user_id: Number(ctx.from.id),
      username: ctx.from.username || null,
      first_name: ctx.from.first_name || ''
    }).catch(e => console.warn('Record view warning in bot:', e.message));

    recordFileAccess(env, {
      post_id: Number(postId),
      item_name: post.title || `Post #${postId}`,
      user_id: Number(ctx.from.id),
      username: ctx.from.username || null,
      first_name: ctx.from.first_name || ''
    }).catch(e => console.warn('Record file access warning in bot:', e.message));
  }

  const folders = await getPostFoldersWithFiles(env, postId);
  const settings = await getSettings(env);
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

  // 6. Send Expires Warning as a SEPARATE MESSAGE
  if (autoDeleteMinutes > 0) {
    const minuteUnit = autoDeleteMinutes === 1 ? '1 minute' : `${autoDeleteMinutes} minutes`;
    const noticeText = `⏳ ⚠️ *Auto-Delete Warning:*\n\n` +
      `This message and all files/links above will automatically self-destruct & delete in *${minuteUnit}*!\n\n` +
      (protectContent
        ? `🔒 *Content protection is enabled (forwarding & saving restricted).*`
        : `👉 *Please forward or save to your Saved Messages now before they disappear.*`);

    try {
      const noticeMsg = await ctx.reply(noticeText, {
        parse_mode: 'Markdown',
        protect_content: protectContent
      });
      if (noticeMsg?.message_id) sentMessageIds.push(noticeMsg.message_id);
    } catch (nErr) {
      console.warn('Failed to send auto-delete notice:', nErr.message);
    }

    // Register all sent message IDs for auto-deletion
    if (sentMessageIds.length > 0) {
      const deleteAt = new Date(Date.now() + autoDeleteMinutes * 60 * 1000).toISOString();
      const records = sentMessageIds.map(mid => ({
        chat_id: ctx.chat.id,
        message_id: mid,
        delete_at: deleteAt,
        is_deleted: false
      }));
      await addEphemeralMessages(env, records);
    }
  }

  // Background cleanup of any past expired messages
  await processEphemeralDeletions(env).catch(e => console.warn('Ephemeral cleanup warning:', e.message));
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
  // Main Menu Presenter (Buttons Only)
  // -------------------------------------------------------------
  async function showMainMenu(ctx) {
    const userId = ctx.from?.id;
    const isAdmin = await isAdminUser(env, userId);
    const settings = await getSettings(env);
    const userAppUrl = appUrl ? (appUrl.includes('?') ? `${appUrl}&user_id=${userId}` : `${appUrl}?user_id=${userId}`) : appUrl;

    try {
      if (userAppUrl.startsWith('https://')) {
        await ctx.setChatMenuButton({
          type: 'web_app',
          text: '🚀 Open App',
          web_app: { url: userAppUrl }
        });
      }
    } catch (e) {}

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
          Markup.button.callback('🔍 Browse Posts', 'user_browse_posts')
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
      // Regular User Panel
      let userPoints = 0;
      const u = await getUser(env, userId);
      userPoints = u?.points || 0;

      const inlineButtons = [
        [Markup.button.webApp('🚀 Launch Mini App', userAppUrl)],
        [
          Markup.button.callback('🔍 Browse Posts', 'user_browse_posts'),
          Markup.button.callback('🔖 Saved Posts', 'user_menu_saved')
        ]
      ];

      if (settings.referral_enabled) {
        inlineButtons.push([
          Markup.button.callback(`🪙 My Points: ${userPoints}`, 'user_menu_points'),
          Markup.button.callback('🎁 Invite Friends', 'user_menu_invite')
        ]);
      }

      const text = `👋 *Welcome to xmi Content Hub!*\n\n` +
        `• Access premium content, downloads, and exclusive files.\n` +
        (settings.referral_enabled ? `• 🪙 *Your Balance:* \`${userPoints} Points\`\n` : '') +
        `\nTap **Launch Mini App** or choose an option below:`;

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
    }
  }

  // -------------------------------------------------------------
  // /start handler with Deep Linking
  // -------------------------------------------------------------
  bot.start(async (ctx) => {
    const payload = ctx.startPayload || '';
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

    // 3. Post Deep Link: post_<post_id>
    if (payload.startsWith('post_')) {
      const postId = payload.replace('post_', '').trim();
      
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

        return await sendPostToUser(ctx, env, post, postId);

      } catch (err) {
        console.error('Error handling /start post deep-link:', err);
        return await ctx.reply('⚠️ Error loading post content. Please try again.');
      }
    }

    // Default Main Menu
    return await showMainMenu(ctx);
  });

  bot.action('main_menu', showMainMenu);
  bot.action('admin_main_menu', showMainMenu);

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
        const star = p.is_promoted ? '⭐ ' : '';
        return [
          Markup.button.callback(
            `${star}${p.title.slice(0, 28)}`,
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
        const star = p.is_promoted ? '⭐ ' : '';
        const displayTitle = p.title.length > 26 ? p.title.slice(0, 26) + '…' : p.title;
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

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✏️ Edit Title', `admin_edit_title_${post.id}`),
          Markup.button.callback('🖼️ Edit Image', `admin_edit_img_${post.id}`)
        ],
        [
          Markup.button.callback('🔗 Edit Link', `admin_edit_link_${post.id}`),
          Markup.button.callback('📁 Add Files/Folders', `admin_edit_files_${post.id}`)
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
          Markup.button.callback('📢 Broadcast Post to Users', `admin_bc_post_ask_${post.id}`)
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
        (post.direct_link ? `• *Direct Link:* ${escapeMarkdown(post.direct_link)}\n` : ''),
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
      await ctx.answerCbQuery();

      const userIds = await getAllRegisteredUserIds(env);
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📢 Yes, Broadcast to All Users', `admin_bc_post_confirm_${postId}`)],
        [Markup.button.callback('❌ Cancel', `admin_post_view_${postId}`)]
      ]);

      return await ctx.reply(
        `📢 *Broadcast Post Confirmation*\n\n` +
        `• *Post:* *"${escapeMarkdown(post?.title || 'Post #' + postId)}"*\n` +
        `• *Target Audience:* ${userIds.length} registered users\n` +
        `• *Protection:* ${post?.protect_content ? '🔒 Enabled' : '🔓 Disabled'}\n\n` +
        `Are you sure you want to broadcast this post to all users now?`,
        {
          parse_mode: 'Markdown',
          ...keyboard
        }
      );
    } catch (e) {
      await ctx.answerCbQuery('Error');
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
      const userIds = await getAllRegisteredUserIds(env);
      await ctx.reply(`📡 Broadcasting post *"${escapeMarkdown(post.title)}"* to ${userIds.length} users in background...`, { parse_mode: 'Markdown' });

      const settings = await getSettings(env);
      const hubTimer = parseInt(settings.auto_delete_minutes || 0, 10);
      const autoDeleteMinutes = (post.auto_delete_minutes !== null && post.auto_delete_minutes !== undefined)
        ? parseInt(post.auto_delete_minutes, 10)
        : hubTimer;
      const protectContent = !!(post.protect_content ?? (settings.protect_content === 'true' || settings.protect_content === true));

      const miniAppUrl = env.APP_URL || 'https://telegram.org';
      const webAppUrl = `${miniAppUrl.replace(/\/$/, '')}?post_id=${post.id}`;
      const inlineButtons = [];
      if (post.direct_link) {
        inlineButtons.push([Markup.button.url(post.link_name || '🔗 Access Link', post.direct_link)]);
      }
      inlineButtons.push([Markup.button.webApp('🚀 Open in App', webAppUrl)]);

      const captionText = `📌 *${escapeMarkdown(post.title)}*\n\n` +
        (post.category ? `🏷️ *Category:* ${escapeMarkdown(post.category)}\n` : '') +
        (post.tags ? `🔖 *Tags:* ${escapeMarkdown(post.tags)}\n\n` : '\n') +
        `👇 Tap below to view details and access files!`;

      let sentCount = 0;
      let failedCount = 0;
      const failedDetails = [];
      const ephemeralRecords = [];

      for (const targetId of userIds) {
        try {
          let sentMid = null;
          if (post.preview_image_url) {
            try {
              const res = await ctx.telegram.sendPhoto(targetId, post.preview_image_url, {
                caption: captionText,
                parse_mode: 'Markdown',
                protect_content: protectContent,
                ...Markup.inlineKeyboard(inlineButtons)
              });
              sentMid = res.message_id;
              sentCount++;
            } catch {
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
            if (autoDeleteMinutes > 0) {
              const minuteUnit = autoDeleteMinutes === 1 ? '1 minute' : `${autoDeleteMinutes} minutes`;
              const noticeText = `⏳ ⚠️ *Auto-Delete Warning:*\n\n` +
                `This post message will automatically self-destruct & delete in *${minuteUnit}*!\n\n` +
                (protectContent
                  ? `🔒 *Content protection is enabled (forwarding & saving restricted).*`
                  : `👉 *Please forward or save to your Saved Messages now before it disappears.*`);

              let noticeMid = null;
              try {
                const nRes = await ctx.telegram.sendMessage(targetId, noticeText, {
                  parse_mode: 'Markdown',
                  protect_content: protectContent
                });
                noticeMid = nRes.message_id;
              } catch {}

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
            failedDetails.push({ user_id: targetId, reason: 'Telegram message delivery failed' });
          }
        } catch (targetErr) {
          failedCount++;
          failedDetails.push({ user_id: targetId, reason: targetErr.message || 'Error' });
        }
      }

      if (ephemeralRecords.length > 0) {
        await addEphemeralMessages(env, ephemeralRecords);
      }

      let summaryText = `✅ *Post Broadcast Complete!*\n\n` +
        `• 🚀 *Successfully Sent:* \`${sentCount}\`\n` +
        `• ❌ *Failed:* \`${failedCount}\`\n` +
        `• 👥 *Total Users:* \`${userIds.length}\``;

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

    const text = `⚙️ *Hub Settings & Rules*\n\n` +
      `• 🎁 *Referrals & Points:* ${refStatus} (\`${settings.referral_points || 10} pts\`)\n` +
      `• 🔗 *Shortener Locker:* ${shortStatus}\n` +
      `• 🔒 *Restrict Forward All:* ${protectAllStatus}\n` +
      `• ⏳ *Global Auto-Delete:* \`${settings.auto_delete_minutes || 30} minutes\`\n` +
      `• 🪙 *Points per Download:* \`${settings.points_per_post_download || 1} pt\`\n` +
      `• 🖼️ *Sponsor Banner:* ${bannerStatus}\n` +
      `• 📢 *Force Join Channels:* ${forceStatus} (\`${channels.length} channel(s)\`)\n\n` +
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
      return await ctx.reply('📢 No force-join channels added yet.', {
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Back to Settings', 'admin_menu_settings')]])
      });
    }

    const buttons = channels.map(ch => [
      Markup.button.callback(`🗑️ Remove ${ch.channel_title}`, `admin_del_channel_${ch.id}`)
    ]);
    buttons.push([Markup.button.callback('🔙 Back to Settings', 'admin_menu_settings')]);

    return await ctx.reply(
      '📢 *Registered Force Join Channels:*\nTap to remove any channel:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
  });

  bot.action(/^admin_del_channel_(\d+)$/, async (ctx) => {
    const id = ctx.match[1];
    await removeForceChannel(env, id);
    await ctx.answerCbQuery('Channel removed');
    return await handleSettingsMenu(ctx);
  });

  // -------------------------------------------------------------
  // Admins Management Handlers
  // -------------------------------------------------------------
  const handleAdminsMenu = async (ctx) => {
    const userId = ctx.from?.id;
    if (!(await isAdminUser(env, userId))) return;

    if (ctx.callbackQuery) await ctx.answerCbQuery();

    const admins = await getAdmins(env);
    let text = `👥 *Admins Management*\n\n` +
      `All added admins have full management permissions (create/edit/delete posts, broadcast, monetization, and add other admins).\n\n` +
      `*Current Admins (${admins.length}):*\n`;

    admins.forEach((a, i) => {
      const badge = a.is_primary ? '👑 Primary Owner' : '🛡️ Co-Admin';
      const name = a.full_name || a.username || `User ${a.user_id}`;
      text += `${i + 1}. *${escapeMarkdown(name)}* (\`${a.user_id}\`) — ${badge}\n`;
    });

    const buttons = [];
    admins.filter(a => !a.is_primary).forEach(a => {
      const name = a.full_name || a.username || `ID ${a.user_id}`;
      buttons.push([Markup.button.callback(`🗑️ Remove Admin ${name}`, `admin_del_admin_${a.user_id}`)]);
    });

    buttons.push([
      Markup.button.callback('➕ Add New Admin', 'admin_add_admin_ask'),
      Markup.button.callback('👥 View Registered Users', 'admin_view_users')
    ]);
    buttons.push([
      Markup.button.callback('🔙 Main Menu', 'admin_main_menu')
    ]);

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
          text += `${i + 1}. ${uName} (\`#${u.id}\`) — 🪙 ${u.points || 0} pts • 🔄 ${u.interactions || 1} acts\n`;
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
    await setSession(env, userId, {
      step: 'EDIT_IMAGE',
      editPostId: postId
    });

    await ctx.answerCbQuery();
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

  bot.action(/^admin_edit_files_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (!(await isAdminUser(env, userId))) return;

    const postId = ctx.match[1];
    const post = await getPostById(env, postId, userId, true);

    await setSession(env, userId, {
      step: 'AWAITING_FOLDERS',
      postId: postId,
      title: post?.title || '',
      currentFiles: [],
      foldersCount: post?.folders?.length || 0
    });

    await ctx.answerCbQuery();

    // Deliver all current files & links of this post to the admin
    let sentCount = 0;
    if (post?.folders && post.folders.length > 0) {
      await ctx.reply(`📁 *Sending current files for Post #${postId}...*`, { parse_mode: 'Markdown' });
      for (const fld of post.folders) {
        if (fld.files && fld.files.length > 0) {
          for (const file of fld.files) {
            try {
              if (file.mime_type === 'link') {
                await ctx.reply(`🔗 *[${escapeMarkdown(fld.name)}]* [${escapeMarkdown(file.file_name)}](${file.file_id})`, {
                  parse_mode: 'Markdown',
                  disable_web_page_preview: true
                });
                sentCount++;
              } else if (file.channel_message_id && env.CHANNEL_ID) {
                await ctx.telegram.copyMessage(ctx.chat.id, env.CHANNEL_ID, Number(file.channel_message_id), {
                  caption: `📁 Folder: ${fld.name} | File: ${file.file_name}`
                });
                sentCount++;
              } else if (file.file_id) {
                await ctx.telegram.sendDocument(ctx.chat.id, file.file_id, {
                  caption: `📁 Folder: ${fld.name} | File: ${file.file_name}`
                });
                sentCount++;
              }
            } catch (deliverErr) {
              console.warn(`Failed to send current file ${file.id} to admin:`, deliverErr.message);
            }
          }
        }
      }
    }

    if (sentCount === 0 && (!post?.folders || post.folders.length === 0)) {
      await ctx.reply('ℹ️ This post currently has no files or folders attached.');
    }

    return await sendStep3Prompt(ctx, { currentFiles: [], foldersCount: post?.folders?.length || 0, title: post?.title });
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
        failedDetails.push({ user_id: targetId, reason: e.message || 'Error' });
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

    const sessionData = {
      step: 'AWAITING_TITLE',
      postId: null,
      title: '',
      preview_image: null,
      direct_link: null,
      direct_link_title: null,
      currentFiles: [],
      foldersCount: 0
    };

    await setSession(env, userId, sessionData);
    if (ctx.callbackQuery) await ctx.answerCbQuery();

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('❌ Cancel', 'step_cancel')]
    ]);

    return await ctx.reply(
      '📝 *Step 1/3: Post Title*\n\n' +
      'Please send the **Title** for your new post:',
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );
  };

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

    const session = await getSession(env, userId);
    if (!session) return await ctx.answerCbQuery('Session expired');

    session.step = 'AWAITING_FOLDERS';
    session.currentFiles = [];
    session.foldersCount = 0;
    await setSession(env, userId, session);
    await ctx.answerCbQuery();

    return await sendStep3Prompt(ctx, session);
  });

  async function sendStep3Prompt(ctx, session) {
    const bufferCount = session.currentFiles?.length || 0;

    let text = `📂 *Folder Upload Mode*\n\n`;
    text += `1️⃣ **Send Files / Links:** (Documents, Videos, Photos, Audio, URLs)\n`;
    text += `2️⃣ **Organize:** Type a Folder Name to group buffered items\n`;
    text += `3️⃣ **Finish:** Tap Done when finished.\n\n`;

    if (bufferCount > 0) {
      text += `📥 *Current Buffer:* ${bufferCount} item(s) waiting for folder name.\n`;
    }

    const buttons = [];
    if (bufferCount > 0) {
      buttons.push([Markup.button.callback('📁 Save Buffer into Folder', 'step_prompt_folder_name')]);
    }
    buttons.push([Markup.button.callback(session.direct_link ? '🔗 Change Direct Link' : '🔗 Add Direct Link', 'mode_direct_link')]);
    buttons.push([
      Markup.button.callback('✅ Done & Review Post', 'step_finish_folders'),
      Markup.button.callback('❌ Cancel', 'step_cancel')
    ]);

    return await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
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

      const botInfo = await ctx.telegram.getMe();
      const deepLink = `https://t.me/${botInfo.username}?start=post_${postId}`;

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
      `Please reply with the publish date and time in UTC.\n` +
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
      if (text === '➕ Add Post') return await startAddPostFlow(ctx);
      if (text === '📑 Manage Posts') return await handleAdminPosts(ctx);
      if (text === '📊 Stats' || text === '📊 Hub Stats') return await handleStats(ctx);
      if (text === '📢 Broadcast') return await startBroadcastFlow(ctx);
      if (text === '⚙️ Settings') return await handleSettingsMenu(ctx);
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
      if (!text) {
        return await ctx.reply('⚠️ Please send a text title for the post.');
      }

      session.title = text;
      session.step = 'AWAITING_IMAGE';
      await setSession(env, userId, session);

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⏩ Skip Image', 'step_skip_image')],
        [Markup.button.callback('❌ Cancel', 'step_cancel')]
      ]);

      return await ctx.reply(
        `🖼️ *Step 2/3: Preview Image*\n\n` +
        `Send an image URL (e.g. \`https://example.com/image.jpg\`) or upload a photo, or tap Skip:`,
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

    // Folders and Files Mode
    if (session.step === 'AWAITING_FOLDERS') {
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
            file_name: 'Photo_' + (session.currentFiles.length + 1) + '.jpg',
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
            file_name: msg.video.file_name || 'Video_' + (session.currentFiles.length + 1) + '.mp4',
            mime_type: msg.video.mime_type || 'video/mp4',
            size: msg.video.file_size || 0
          };
        } else if (msg.audio) {
          itemMeta = {
            file_id: msg.audio.file_id,
            file_name: msg.audio.file_name || msg.audio.title || 'Audio_' + (session.currentFiles.length + 1) + '.mp3',
            mime_type: msg.audio.mime_type || 'audio/mpeg',
            size: msg.audio.file_size || 0
          };
        }
      }

      if (itemMeta) {
        if (itemMeta.mime_type !== 'link') {
          try {
            if (!env.CHANNEL_ID) {
              return await ctx.reply('⚠️ CHANNEL_ID is not configured in Worker environment.');
            }

            const copied = await ctx.telegram.copyMessage(env.CHANNEL_ID, ctx.chat.id, msg.message_id, {
              caption: ''
            });
            itemMeta.channel_message_id = copied.message_id;
          } catch (copyErr) {
            console.error('Error forwarding file to storage channel:', copyErr);
            return await ctx.reply(`⚠️ Failed to store file in channel: ${copyErr.message}. Make sure the bot is an admin in your storage channel.`);
          }
        }

        session.currentFiles.push(itemMeta);
        await setSession(env, userId, session);

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('📁 Name & Save Folder', 'step_prompt_folder_name')],
          [
            Markup.button.callback('✅ Done & Review', 'step_finish_folders'),
            Markup.button.callback('❌ Cancel', 'step_cancel')
          ]
        ]);

        const icon = itemMeta.mime_type === 'link' ? '🔗' : '📥';
        return await ctx.reply(
          `${icon} *Buffered item:* ${escapeMarkdown(itemMeta.file_name)}\n` +
          `_${session.currentFiles.length} item(s) in buffer ready to be saved into a folder._\n\n` +
          `Send more files/links, or type a **Folder Name** below:`,
          {
            parse_mode: 'Markdown',
            ...keyboard
          }
        );
      }

      if (text && !text.startsWith('/')) {
        if (!session.currentFiles || session.currentFiles.length === 0) {
          const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('✅ Done & Review', 'step_finish_folders')],
            [Markup.button.callback('❌ Cancel', 'step_cancel')]
          ]);
          return await ctx.reply(
            '⚠️ No files or links buffered yet. Please send some files or links first, then type the folder name.',
            keyboard
          );
        }

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
            name: text
          });

          const filesToInsert = session.currentFiles.map(f => ({
            folder_id: folder.id,
            file_id: f.file_id,
            channel_message_id: f.channel_message_id || null,
            file_name: f.file_name,
            mime_type: f.mime_type,
            size: f.size
          }));

          await createFiles(env, filesToInsert);

          const savedCount = session.currentFiles.length;
          session.foldersCount = (session.foldersCount || 0) + 1;
          session.currentFiles = [];
          await setSession(env, userId, session);

          const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('➕ Add Next Folder', 'step_prompt_folder_name')],
            [Markup.button.callback('🚀 Finish & Review Post', 'step_finish_folders')]
          ]);

          return await ctx.reply(
            `✅ Saved folder *"${escapeMarkdown(text)}"* with ${savedCount} item(s)!\n\n` +
            `• Send more files/links for another folder, or\n` +
            `• Tap **Finish & Review Post** below:`,
            {
              parse_mode: 'Markdown',
              ...keyboard
            }
          );
        } catch (dbErr) {
          console.error('Error saving folder/files:', dbErr);
          return await ctx.reply(`⚠️ Failed to save folder: ${dbErr.message}`);
        }
      }
    }

    // Schedule Time
    if (session.step === 'AWAITING_SCHEDULE_TIME') {
      if (!text) {
        return await ctx.reply('⚠️ Please send a valid date string (e.g. `2026-10-15 14:30`) in UTC.');
      }

      const parsedDate = new Date(text.includes('T') ? text : text.replace(' ', 'T') + ':00Z');

      if (isNaN(parsedDate.getTime()) || parsedDate.getTime() <= Date.now()) {
        return await ctx.reply(
          '⚠️ Invalid date or the date is in the past.\n' +
          'Please provide a future date in UTC format: `YYYY-MM-DD HH:MM` (e.g. `2026-10-15 14:30`)'
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
          `• *Publish Date (UTC):* ${parsedDate.toUTCString()}\n\n` +
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
