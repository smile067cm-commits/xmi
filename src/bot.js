import { Telegraf, Markup } from 'telegraf';
import {
  saveOrUpdateUser,
  getPostById,
  getAllPostsForAdmin,
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
  getForceChannels,
  processReferral,
  checkUserPass,
  consumeUserPass,
  createVerifyToken,
  verifyTokenAndGrantPass,
  getAllUserIds
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
  if (String(userId) === String(env.ADMIN_ID)) return { passed: true };
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
 * Checks if user has an active pass for monetized shortener locker
 */
async function checkLockerPass(ctx, env, userId, postId) {
  if (String(userId) === String(env.ADMIN_ID)) return { passed: true };
  try {
    const passCheck = await checkUserPass(env, userId);
    if (passCheck.has_pass) {
      await consumeUserPass(env, userId);
      return { passed: true };
    }

    const settings = await getSettings(env);
    if (!settings.shortener_enabled) return { passed: true };

    const token = await createVerifyToken(env, userId, postId);
    const appUrl = env.WEB_APP_URL || 'https://xmi.lakshminighty1.workers.dev';
    let verifyUrl = `${appUrl}/verify?token=${token}`;

    if (settings.shortener_api_url && settings.shortener_api_key) {
      verifyUrl = `${settings.shortener_api_url}?api=${encodeURIComponent(settings.shortener_api_key)}&url=${encodeURIComponent(verifyUrl)}`;
    }

    return {
      passed: false,
      verifyUrl,
      settings
    };
  } catch (err) {
    console.error('Error in checkLockerPass:', err);
    return { passed: true };
  }
}

/**
 * Delivers post details and download buttons to user
 */
async function sendPostToUser(ctx, env, post, postId) {
  const folders = await getPostFoldersWithFiles(env, postId);
  const hasFolders = folders && folders.length > 0;
  const hasDirectLink = Boolean(post.direct_link);

  let messageText = `📌 *${escapeMarkdown(post.title)}*\n\n`;

  const keyboardButtons = [];

  // Direct Link Button
  if (hasDirectLink) {
    const linkLabel = post.direct_link_title || '📥 Open / Download Link';
    keyboardButtons.push([Markup.button.url(`🔗 ${linkLabel}`, post.direct_link)]);
  }

  // Folder Buttons
  if (hasFolders) {
    messageText += `📂 *Content Folders:*\nTap a folder below to access files:\n`;
    folders.forEach(folder => {
      const fileCount = folder.files?.length || 0;
      keyboardButtons.push([
        Markup.button.callback(
          `📁 ${folder.name} (${fileCount} item${fileCount === 1 ? '' : 's'})`,
          `folder_${folder.id}`
        )
      ]);
    });
  }

  const keyboard = Markup.inlineKeyboard(keyboardButtons);

  if (post.preview_image) {
    try {
      return await ctx.replyWithPhoto(post.preview_image, {
        caption: messageText,
        parse_mode: 'Markdown',
        ...keyboard
      });
    } catch (e) {
      console.warn('Failed to send photo preview, falling back to text:', e.message);
    }
  }

  return await ctx.reply(messageText, {
    parse_mode: 'Markdown',
    ...keyboard
  });
}

/**
 * Creates and configures the Telegraf Bot instance
 */
export function createBot(env) {
  const bot = new Telegraf(env.BOT_TOKEN);

  // -------------------------------------------------------------
  // Middleware: User Tracking & Session Loading
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
        await ctx.reply('⚠️ An unexpected error occurred. Please try again later.');
      }
    }
  });

  // -------------------------------------------------------------
  // /start Command (Deep Link, Referrals, Verify, Welcome)
  // -------------------------------------------------------------
  bot.start(async (ctx) => {
    const payload = ctx.startPayload || '';

    // 1. Referral Deep Link: ref_<referrer_id>
    if (payload.startsWith('ref_')) {
      const referrerId = payload.replace('ref_', '').trim();
      try {
        await processReferral(env, ctx.from?.id, referrerId);
      } catch (refErr) {
        console.warn('Referral processing warning:', refErr.message);
      }
    }

    // 2. Shortener Verification Deep Link: verify_<token>
    if (payload.startsWith('verify_')) {
      const token = payload.replace('verify_', '').trim();
      try {
        const record = await verifyTokenAndGrantPass(env, token);
        if (record) {
          const buttons = [];
          if (record.target_post_id) {
            buttons.push([Markup.button.callback('📥 Open Post Now', `check_pass_post_${record.target_post_id}`)]);
          }
          const appUrl = env.WEB_APP_URL || 'https://xmi.lakshminighty1.workers.dev';
          buttons.push([Markup.button.webApp('🚀 Open Mini App', appUrl)]);

          return await ctx.reply(
            `🎉 *Access Pass Granted!*\n\n` +
            `Your verification was successful! You now have unrestricted access to all posts & downloads.`,
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard(buttons)
            }
          );
        } else {
          return await ctx.reply('⚠️ This verification link has expired or has already been used.');
        }
      } catch (vErr) {
        console.error('Error verifying token on /start:', vErr);
        return await ctx.reply('⚠️ Error during verification. Please try again.');
      }
    }

    // 3. Post Deep Link: post_<post_id>
    if (payload.startsWith('post_')) {
      const postId = payload.replace('post_', '').trim();
      
      try {
        const post = await getPostById(env, postId, ctx.from?.id, String(ctx.from?.id) === String(env.ADMIN_ID));
        
        if (!post) {
          return await ctx.reply('⚠️ Post not found or has been removed.');
        }

        const isAdmin = String(ctx.from?.id) === String(env.ADMIN_ID);
        if (post.status !== 'published' && !isAdmin) {
          return await ctx.reply('🔒 This post is not yet published.');
        }

        // Force Join Check
        const fj = await checkForceJoin(ctx, env, ctx.from?.id);
        if (!fj.passed) {
          const buttons = fj.unjoined.map(ch => [Markup.button.url(`📢 Join ${ch.channel_title}`, ch.invite_link)]);
          buttons.push([Markup.button.callback('🔄 I Have Joined (Check Again)', `check_force_post_${postId}`)]);

          return await ctx.reply(
            `🔒 *Channel Membership Required*\n\n` +
            `To view this post and download its files, please join our official channels below:`,
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard(buttons)
            }
          );
        }

        // Shortener Pass Locker Check
        const locker = await checkLockerPass(ctx, env, ctx.from?.id, postId);
        if (!locker.passed) {
          const modeText = locker.settings.shortener_mode === 'time'
            ? `⏱️ *Unlock Pass:* ${locker.settings.shortener_duration_hours || 24} Hours full access to all posts`
            : `📦 *Unlock Pass:* Full access for ${locker.settings.shortener_posts_count || 5} posts`;

          const buttons = [
            [Markup.button.url('🔓 Verify Link & Unlock Access', locker.verifyUrl)],
            [Markup.button.callback('🔄 Check Access', `check_pass_post_${postId}`)]
          ];

          return await ctx.reply(
            `🔐 *Access Verification Required*\n\n` +
            `To access *"${escapeMarkdown(post.title)}"*, complete a quick verification.\n\n` +
            `${modeText}\n\n` +
            `Tap the button below to verify:`,
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

    // 4. Default Welcome Message
    const appUrl = env.WEB_APP_URL || 'https://xmi.lakshminighty1.workers.dev';
    const isAdmin = String(ctx.from?.id) === String(env.ADMIN_ID);

    let welcomeText = `👋 *Welcome ${escapeMarkdown(ctx.from?.first_name || 'there')}!*\n\n`;
    welcomeText += `Explore published posts, curated folders, and downloadable resources directly through our interactive Mini App.\n\n`;
    
    if (isAdmin) {
      welcomeText += `👑 *Admin Commands:*\n`;
      welcomeText += `• /addpost - Create a new post\n`;
      welcomeText += `• /admin - Manage & moderate all posts\n`;
      welcomeText += `• /broadcast - Send announcement to all users\n`;
      welcomeText += `• /stats - View Hub Analytics\n`;
      welcomeText += `• /cancel - Abort current action\n\n`;
    }

    welcomeText += `Tap the button below to launch the Bot App:`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 Open Bot App', appUrl)]
    ]);

    try {
      if (appUrl.startsWith('https://')) {
        await ctx.setChatMenuButton({
          type: 'web_app',
          text: '🚀 Open App',
          web_app: { url: appUrl }
        });
      }
    } catch (e) {
      console.warn('Failed to set chat menu button on /start:', e.message);
    }

    return await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      ...keyboard
    });
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

      return await ctx.reply(
        `⚠️ You have not joined all required channels yet. Please join them first:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    }

    const post = await getPostById(env, postId, ctx.from?.id, String(ctx.from?.id) === String(env.ADMIN_ID));
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
        [Markup.button.callback('🔄 Check Access', `check_pass_post_${postId}`)]
      ];

      return await ctx.reply(
        `⚠️ Access pass is not yet active. Please complete verification first.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    }

    const post = await getPostById(env, postId, ctx.from?.id, String(ctx.from?.id) === String(env.ADMIN_ID));
    if (!post) return await ctx.reply('⚠️ Post not found.');

    return await sendPostToUser(ctx, env, post, postId);
  });

  // -------------------------------------------------------------
  // Folder Click Callback: Send Files & Links
  // -------------------------------------------------------------
  bot.action(/^folder_(\d+)$/, async (ctx) => {
    const folderId = ctx.match[1];

    try {
      await ctx.answerCbQuery('Fetching folder contents...');

      // Force join check
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
  // Admin Management (/admin, /posts, /stats)
  // -------------------------------------------------------------
  const handleStats = async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) {
      return await ctx.reply('⛔ Unauthorized. Admin access only.');
    }

    try {
      const stats = await getGlobalStats(env);
      const text = `📊 *xmi Hub Analytics & Statistics*\n\n` +
        `👥 *Total Users:* \`${stats.total_users}\`\n\n` +
        `📄 *Total Posts:* \`${stats.total_posts}\`\n` +
        `   • 🟢 Published: \`${stats.published_posts}\`\n` +
        `   • 🟡 Drafts: \`${stats.draft_posts}\`\n` +
        `   • 🟣 Scheduled: \`${stats.scheduled_posts}\`\n` +
        `   • ⭐ Featured: \`${stats.promoted_posts}\`\n\n` +
        `👁️ *Total Impressions / Views:* \`${stats.total_views}\`\n` +
        `📥 *Total File & Link Accesses:* \`${stats.total_file_accesses}\`\n` +
        `❤️ *Total Likes:* \`${stats.total_likes}\`\n` +
        `💬 *Total Comments:* \`${stats.total_comments}\``;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Refresh Stats', 'admin_refresh_stats')],
        [Markup.button.callback('📑 Manage Posts', 'admin_post_list')]
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

  const handleAdminPosts = async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) {
      return await ctx.reply('⛔ Unauthorized. Admin access only.');
    }

    try {
      const posts = await getAllPostsForAdmin(env);
      if (!posts || posts.length === 0) {
        return await ctx.reply('📭 No posts found in database.', {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📊 View Stats', 'admin_stats')]
          ])
        });
      }

      const buttons = posts.slice(0, 10).map(p => {
        const statusIcon = p.status === 'published' ? '🟢' : p.status === 'scheduled' ? '🟣' : '🟡';
        return [
          Markup.button.callback(
            `${statusIcon} #${p.id} ${p.title.slice(0, 24)}...`,
            `admin_post_view_${p.id}`
          )
        ];
      });

      buttons.unshift([Markup.button.callback('📊 View Hub Stats', 'admin_stats')]);

      const keyboard = Markup.inlineKeyboard(buttons);
      return await ctx.reply('👑 *Admin Panel: Posts & Management*\nSelect a post to manage or view stats:', {
        parse_mode: 'Markdown',
        ...keyboard
      });
    } catch (err) {
      console.error('Admin posts error:', err);
      return await ctx.reply(`⚠️ Failed to load posts: ${err.message}`);
    }
  };

  bot.command('admin', handleAdminPosts);
  bot.command('posts', handleAdminPosts);

  // -------------------------------------------------------------
  // Admin Single Post View & Detailed Controls
  // -------------------------------------------------------------
  bot.action(/^admin_post_view_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const postId = ctx.match[1];
    try {
      const post = await getPostById(env, postId, userId, true);
      if (!post) {
        await ctx.answerCbQuery('Post not found');
        return await ctx.reply('⚠️ Post not found.');
      }

      await ctx.answerCbQuery();
      const statusIcon = post.status === 'published' ? '🟢 Published' : post.status === 'scheduled' ? '🟣 Scheduled' : '🟡 Draft';

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
          Markup.button.callback('🔙 Back to Posts List', 'admin_post_list')
        ]
      ]);

      return await ctx.reply(
        `📌 *${escapeMarkdown(post.title)}*\n\n` +
        `• *Post ID:* \`#${post.id}\`\n` +
        `• *Status:* ${statusIcon}\n` +
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

  // Toggle Promote / Feature
  bot.action(/^admin_post_promote_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const postId = ctx.match[1];
    try {
      const post = await getPostById(env, postId, userId, true);
      const newPromoted = !post.is_promoted;
      await togglePromotePost(env, postId, newPromoted);
      await ctx.answerCbQuery(newPromoted ? 'Post Featured & Pinned!' : 'Post unfeatured');
      
      // Refresh post view
      const updated = await getPostById(env, postId, userId, true);
      const statusIcon = updated.status === 'published' ? '🟢 Published' : updated.status === 'scheduled' ? '🟣 Scheduled' : '🟡 Draft';

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
    if (String(userId) !== String(env.ADMIN_ID)) return;

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
    if (String(userId) !== String(env.ADMIN_ID)) return;

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
    if (String(userId) !== String(env.ADMIN_ID)) return;

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

  // -------------------------------------------------------------
  // Bot-side Post Inline Editors
  // -------------------------------------------------------------
  // Edit Title
  bot.action(/^admin_edit_title_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

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

  // Edit Image
  bot.action(/^admin_edit_img_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

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
    if (String(userId) !== String(env.ADMIN_ID)) return;

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

  // Edit Direct Link
  bot.action(/^admin_edit_link_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const postId = ctx.match[1];
    await setSession(env, userId, {
      step: 'EDIT_LINK',
      editPostId: postId
    });

    await ctx.answerCbQuery();
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
    if (String(userId) !== String(env.ADMIN_ID)) return;

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

  // Add Files / Folders to Existing Post
  bot.action(/^admin_edit_files_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

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
    return await sendStep3Prompt(ctx, { currentFiles: [], foldersCount: post?.folders?.length || 0, title: post?.title });
  });

  bot.action('admin_post_list', handleAdminPosts);

  // -------------------------------------------------------------
  // Broadcast Command (/broadcast) & Multi-Step Flow
  // -------------------------------------------------------------
  bot.command('broadcast', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) {
      return await ctx.reply('⛔ Unauthorized. Admin access only.');
    }

    await setSession(env, userId, {
      step: 'BROADCAST_TEXT',
      broadcastMessage: '',
      broadcastPhoto: null,
      broadcastBtnText: null,
      broadcastBtnUrl: null
    });

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
  });

  bot.action('broadcast_skip_photo', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

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
    if (String(userId) !== String(env.ADMIN_ID)) return;

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
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || session.step !== 'BROADCAST_CONFIRM') return await ctx.answerCbQuery('Session expired');

    await ctx.answerCbQuery('Sending broadcast...');
    await clearSession(env, userId);

    const userIds = await getAllUserIds(env);
    await ctx.reply(`📡 Broadcasting to ${userIds.length} users in background...`);

    let sent = 0;
    let failed = 0;

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
      }
    }

    return await ctx.reply(
      `✅ *Broadcast Complete!*\n\n` +
      `• *Total Users:* \`${userIds.length}\`\n` +
      `• *Sent Successfully:* \`${sent}\`\n` +
      `• *Failed / Blocked:* \`${failed}\``,
      { parse_mode: 'Markdown' }
    );
  });

  // -------------------------------------------------------------
  // /cancel Command & Button Callback
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
      return await ctx.reply('❌ Action was cancelled.');
    }
    if (ctx.callbackQuery) await ctx.answerCbQuery('No active action');
    return await ctx.reply('ℹ️ No active action to cancel.');
  };

  bot.command('cancel', handleCancel);
  bot.action('step_cancel', handleCancel);

  // -------------------------------------------------------------
  // /addpost Command (Admin Only)
  // -------------------------------------------------------------
  bot.command('addpost', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) {
      return await ctx.reply('⛔ Unauthorized. This command is restricted to the administrator.');
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
  });

  // -------------------------------------------------------------
  // Step 2 & Mode Callbacks
  // -------------------------------------------------------------
  bot.action('step_skip_image', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

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
    if (String(userId) !== String(env.ADMIN_ID)) return;

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
    if (String(userId) !== String(env.ADMIN_ID)) return;

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

  // -------------------------------------------------------------
  // /done Command & Finish Callbacks
  // -------------------------------------------------------------
  const handleFinishFolders = async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || !session.title) {
      if (ctx.callbackQuery) await ctx.answerCbQuery('No active post creation');
      return await ctx.reply('ℹ️ You are not currently creating a post. Use /addpost to start.');
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
  // Publish / Schedule / Draft Callback Queries
  // -------------------------------------------------------------
  bot.action('action_draft', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || !session.title) {
      await ctx.answerCbQuery('Session expired.');
      return await ctx.reply('⚠️ Session expired. Please start over with /addpost.');
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
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('Failed to save draft:', err);
      return await ctx.reply(`⚠️ Failed to save draft: ${err.message}`);
    }
  });

  bot.action('action_publish', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || !session.title) {
      await ctx.answerCbQuery('Session expired.');
      return await ctx.reply('⚠️ Session expired. Please start over with /addpost.');
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
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('Failed to publish post:', err);
      return await ctx.reply(`⚠️ Failed to publish post: ${err.message}`);
    }
  });

  bot.action('action_schedule', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || !session.title) {
      await ctx.answerCbQuery('Session expired.');
      return await ctx.reply('⚠️ Session expired. Please start over with /addpost.');
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
  // Multi-step Message Handler
  // -------------------------------------------------------------
  bot.on('message', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || !session.step) return;

    const text = ctx.message.text ? ctx.message.text.trim() : null;

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

            const copied = await ctx.telegram.copyMessage(env.CHANNEL_ID, ctx.chat.id, msg.message_id);
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
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        console.error('Failed to schedule post:', err);
        return await ctx.reply(`⚠️ Failed to schedule post: ${err.message}`);
      }
    }
  });

  return bot;
}
