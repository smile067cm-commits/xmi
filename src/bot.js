import { Telegraf, Markup } from 'telegraf';
import {
  saveOrUpdateUser,
  getPostById,
  getPostFoldersWithFiles,
  getFolderFiles,
  createPost,
  updatePost,
  createFolder,
  createFiles
} from './db.js';
import { getSession, setSession, clearSession } from './session.js';

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
        // Track user interaction asynchronously in Supabase
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
  // /start Command
  // -------------------------------------------------------------
  bot.start(async (ctx) => {
    const payload = ctx.startPayload || '';

    // Check if deep-link payload: post_<post_id>
    if (payload.startsWith('post_')) {
      const postId = payload.replace('post_', '').trim();
      
      try {
        const post = await getPostById(env, postId, ctx.from?.id);
        
        if (!post) {
          return await ctx.reply('⚠️ Post not found or has been removed.');
        }

        const isAdmin = String(ctx.from?.id) === String(env.ADMIN_ID);
        if (post.status !== 'published' && !isAdmin) {
          return await ctx.reply('🔒 This post is not yet published.');
        }

        // Fetch folders and their files
        const folders = await getPostFoldersWithFiles(env, postId);

        let messageText = `📌 *${escapeMarkdown(post.title)}*\n\n`;
        messageText += `📂 *Available Content Folders:*\nClick a folder below to receive all files in that folder.\n`;

        const keyboardButtons = (folders || []).map(folder => {
          const fileCount = folder.files?.length || 0;
          return [
            Markup.button.callback(
              `📁 ${folder.name} (${fileCount} file${fileCount === 1 ? '' : 's'})`,
              `folder_${folder.id}`
            )
          ];
        });

        if (keyboardButtons.length === 0) {
          messageText += `\n_(No folders uploaded for this post yet)_`;
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

      } catch (err) {
        console.error('Error handling /start post deep-link:', err);
        return await ctx.reply('⚠️ Error loading post content. Please try again.');
      }
    }

    // Default /start welcome message
    const appUrl = env.WEB_APP_URL || 'https://telegram-bot-hub.workers.dev';
    const isAdmin = String(ctx.from?.id) === String(env.ADMIN_ID);

    let welcomeText = `👋 *Welcome ${escapeMarkdown(ctx.from?.first_name || 'there')}!*\n\n`;
    welcomeText += `Explore published posts, curated folders, and downloadable resources directly through our interactive Mini App.\n\n`;
    
    if (isAdmin) {
      welcomeText += `👑 *Admin Commands:*\n`;
      welcomeText += `• /addpost - Create and publish a new post\n`;
      welcomeText += `• /cancel - Cancel current post creation\n\n`;
    }

    welcomeText += `Tap the button below to launch the Bot App:`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 Open Bot App', appUrl)]
    ]);

    return await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  });

  // -------------------------------------------------------------
  // Folder Click Callback: Send Files to User
  // -------------------------------------------------------------
  bot.action(/^folder_(\d+)$/, async (ctx) => {
    const folderId = ctx.match[1];

    try {
      await ctx.answerCbQuery('Fetching folder files...');
      const files = await getFolderFiles(env, folderId);

      if (!files || files.length === 0) {
        return await ctx.reply('📁 This folder has no files.');
      }

      await ctx.reply(`📁 Sending ${files.length} file(s)...`);

      for (const file of files) {
        try {
          if (file.channel_message_id && env.CHANNEL_ID) {
            // Forward/copy stored message from private channel directly to user
            await ctx.telegram.copyMessage(
              ctx.chat.id,
              env.CHANNEL_ID,
              Number(file.channel_message_id)
            );
          } else if (file.file_id) {
            // Fallback to sending by Telegram file_id
            await ctx.telegram.sendDocument(ctx.chat.id, file.file_id);
          }
        } catch (copyErr) {
          console.error(`Failed to deliver file ${file.id}:`, copyErr);
          await ctx.reply(`⚠️ Could not deliver file: ${file.file_name || 'File'}`);
        }
      }
    } catch (err) {
      console.error('Error handling folder callback:', err);
      await ctx.reply('⚠️ Failed to load files for this folder.');
    }
  });

  // -------------------------------------------------------------
  // /cancel Command: Reset Session
  // -------------------------------------------------------------
  bot.command('cancel', async (ctx) => {
    const session = await getSession(env, ctx.from.id);
    if (session) {
      await clearSession(env, ctx.from.id);
      return await ctx.reply('❌ Post creation was cancelled.');
    }
    return await ctx.reply('ℹ️ No active action to cancel.');
  });

  // -------------------------------------------------------------
  // /addpost Command (Admin Only)
  // -------------------------------------------------------------
  bot.command('addpost', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) {
      return await ctx.reply('⛔ Unauthorized. This command is restricted to the administrator.');
    }

    // Initialize multi-step session
    const sessionData = {
      step: 'AWAITING_TITLE',
      postId: null,
      title: '',
      preview_image: null,
      currentFiles: [],
      foldersCount: 0
    };

    await setSession(env, userId, sessionData);

    return await ctx.reply(
      '📝 *Step 1/3: Post Title*\n\n' +
      'Please send the **Title** for your new post.\n\n' +
      '_(Send /cancel anytime to abort)_',
      { parse_mode: 'Markdown' }
    );
  });

  // -------------------------------------------------------------
  // /done Command: Finish Folder Uploading Loop
  // -------------------------------------------------------------
  bot.command('done', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || (session.step !== 'AWAITING_FOLDERS' && session.step !== 'AWAITING_TITLE')) {
      return await ctx.reply('ℹ️ You are not currently creating a post. Use /addpost to start.');
    }

    // Handle any leftover buffered files without folder name
    if (session.currentFiles && session.currentFiles.length > 0) {
      try {
        const folder = await createFolder(env, {
          post_id: session.postId,
          name: 'General Files'
        });
        const filesToInsert = session.currentFiles.map(f => ({
          ...f,
          folder_id: folder.id
        }));
        await createFiles(env, filesToInsert);
        session.foldersCount = (session.foldersCount || 0) + 1;
        session.currentFiles = [];
        await ctx.reply(`📁 Saved ${filesToInsert.length} buffered file(s) into "General Files" folder.`);
      } catch (e) {
        console.error('Error auto-saving buffered files on /done:', e);
      }
    }

    session.step = 'AWAITING_PUBLISH_CHOICE';
    await setSession(env, userId, session);

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📝 Save as Draft', 'action_draft')],
      [Markup.button.callback('📅 Schedule', 'action_schedule')],
      [Markup.button.callback('🚀 Publish Now', 'action_publish')]
    ]);

    return await ctx.reply(
      `🎉 *Post Setup Complete!*\n\n` +
      `• *Title:* ${escapeMarkdown(session.title)}\n` +
      `• *Folders:* ${session.foldersCount || 0}\n\n` +
      `Choose how you would like to publish this post:`,
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );
  });

  // -------------------------------------------------------------
  // Publish / Schedule / Draft Callback Queries
  // -------------------------------------------------------------
  bot.action('action_draft', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || !session.postId) {
      await ctx.answerCbQuery('Session expired.');
      return await ctx.reply('⚠️ Session expired. Please start over with /addpost.');
    }

    await updatePost(env, session.postId, { status: 'draft' });
    await clearSession(env, userId);
    await ctx.answerCbQuery('Saved as draft');

    return await ctx.reply(
      `📝 *Post Saved as Draft!*\n\n` +
      `Post ID: \`${session.postId}\`\n` +
      `Title: *${escapeMarkdown(session.title)}*`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.action('action_publish', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || !session.postId) {
      await ctx.answerCbQuery('Session expired.');
      return await ctx.reply('⚠️ Session expired. Please start over with /addpost.');
    }

    await updatePost(env, session.postId, { status: 'published' });
    await clearSession(env, userId);
    await ctx.answerCbQuery('Published!');

    const botInfo = await ctx.telegram.getMe();
    const deepLink = `https://t.me/${botInfo.username}?start=post_${session.postId}`;

    return await ctx.reply(
      `🚀 *Post Published Successfully!*\n\n` +
      `• *Title:* ${escapeMarkdown(session.title)}\n` +
      `• *Deep Link:* ${deepLink}\n\n` +
      `This post is now live on the Web App and ready for users.`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.action('action_schedule', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || !session.postId) {
      await ctx.answerCbQuery('Session expired.');
      return await ctx.reply('⚠️ Session expired. Please start over with /addpost.');
    }

    session.step = 'AWAITING_SCHEDULE_TIME';
    await setSession(env, userId, session);
    await ctx.answerCbQuery('Awaiting schedule date');

    return await ctx.reply(
      `📅 *Schedule Post*\n\n` +
      `Please reply with the publish date and time in UTC.\n` +
      `*Format:* \`YYYY-MM-DD HH:MM\`\n` +
      `*Example:* \`2026-10-15 14:30\``,
      { parse_mode: 'Markdown' }
    );
  });

  // -------------------------------------------------------------
  // Multi-step Message Handler (Files, Folders, Title, Images)
  // -------------------------------------------------------------
  bot.on('message', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || !session.step) return;

    const text = ctx.message.text ? ctx.message.text.trim() : null;

    // STEP 1: Awaiting Title
    if (session.step === 'AWAITING_TITLE') {
      if (!text) {
        return await ctx.reply('⚠️ Please send a text title for the post.');
      }

      session.title = text;

      // Create draft post in Supabase
      try {
        const post = await createPost(env, {
          title: text,
          preview_image: null,
          status: 'draft',
          created_by: userId
        });

        session.postId = post.id;
        session.step = 'AWAITING_IMAGE';
        await setSession(env, userId, session);

        return await ctx.reply(
          `🖼️ *Step 2/3: Preview Image*\n\n` +
          `Send an image URL (e.g. \`https://example.com/image.jpg\`) or type \`skip\` to continue without an image:`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {
        console.error('Failed to create post in Supabase:', e);
        return await ctx.reply(`⚠️ Failed to create post in database: ${e.message}`);
      }
    }

    // STEP 2: Awaiting Image
    if (session.step === 'AWAITING_IMAGE') {
      let imageUrl = null;

      if (text && text.toLowerCase() !== 'skip') {
        if (text.startsWith('http://') || text.startsWith('https://')) {
          imageUrl = text;
        } else {
          return await ctx.reply('⚠️ Please send a valid HTTP(S) image URL or type `skip`.');
        }
      } else if (ctx.message.photo) {
        // Photo directly uploaded: get link
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
        try {
          await updatePost(env, session.postId, { preview_image: imageUrl });
        } catch (e) {
          console.warn('Failed to update post preview image:', e);
        }
      }

      session.step = 'AWAITING_FOLDERS';
      session.currentFiles = [];
      session.foldersCount = 0;
      await setSession(env, userId, session);

      return await ctx.reply(
        `📂 *Step 3/3: Upload Files & Organize Folders*\n\n` +
        `1️⃣ Send one or more files (*Photos, Documents, Videos, Audio*).\n` +
        `2️⃣ Then type a *Folder Name* (e.g. \`PDF Guides\`, \`HD Wallpapers\`) to group those files.\n` +
        `3️⃣ Repeat for additional folders.\n` +
        `4️⃣ When finished, type /done to complete setup.`,
        { parse_mode: 'Markdown' }
      );
    }

    // STEP 3: Awaiting Folders and Files
    if (session.step === 'AWAITING_FOLDERS') {
      const msg = ctx.message;
      let fileMeta = null;

      // Check if media message
      if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1];
        fileMeta = {
          file_id: photo.file_id,
          file_name: 'Photo_' + (session.currentFiles.length + 1) + '.jpg',
          mime_type: 'image/jpeg',
          size: photo.file_size || 0
        };
      } else if (msg.document) {
        fileMeta = {
          file_id: msg.document.file_id,
          file_name: msg.document.file_name || 'Document',
          mime_type: msg.document.mime_type || 'application/octet-stream',
          size: msg.document.file_size || 0
        };
      } else if (msg.video) {
        fileMeta = {
          file_id: msg.video.file_id,
          file_name: msg.video.file_name || 'Video_' + (session.currentFiles.length + 1) + '.mp4',
          mime_type: msg.video.mime_type || 'video/mp4',
          size: msg.video.file_size || 0
        };
      } else if (msg.audio) {
        fileMeta = {
          file_id: msg.audio.file_id,
          file_name: msg.audio.file_name || msg.audio.title || 'Audio_' + (session.currentFiles.length + 1) + '.mp3',
          mime_type: msg.audio.mime_type || 'audio/mpeg',
          size: msg.audio.file_size || 0
        };
      }

      // If file was sent, forward/copy to private CHANNEL_ID to store permanently
      if (fileMeta) {
        try {
          if (!env.CHANNEL_ID) {
            return await ctx.reply('⚠️ CHANNEL_ID is not configured in Worker environment.');
          }

          const copied = await ctx.telegram.copyMessage(env.CHANNEL_ID, ctx.chat.id, msg.message_id);
          fileMeta.channel_message_id = copied.message_id;

          session.currentFiles.push(fileMeta);
          await setSession(env, userId, session);

          return await ctx.reply(
            `📥 Buffered file: *${escapeMarkdown(fileMeta.file_name)}*\n` +
            `_${session.currentFiles.length} file(s) in buffer ready to be assigned to a folder name._`,
            { parse_mode: 'Markdown' }
          );
        } catch (copyErr) {
          console.error('Error forwarding file to storage channel:', copyErr);
          return await ctx.reply(`⚠️ Failed to store file in channel: ${copyErr.message}. Make sure the bot is an administrator in your storage channel.`);
        }
      }

      // If text sent (and not a command), treat it as the Folder Name
      if (text && !text.startsWith('/')) {
        if (!session.currentFiles || session.currentFiles.length === 0) {
          return await ctx.reply(
            '⚠️ No files buffered yet. Please send one or more files first, then type the folder name. Or type /done if finished.'
          );
        }

        try {
          const folder = await createFolder(env, {
            post_id: session.postId,
            name: text
          });

          const filesToInsert = session.currentFiles.map(f => ({
            folder_id: folder.id,
            file_id: f.file_id,
            channel_message_id: f.channel_message_id,
            file_name: f.file_name,
            mime_type: f.mime_type,
            size: f.size
          }));

          await createFiles(env, filesToInsert);

          const savedCount = session.currentFiles.length;
          session.foldersCount = (session.foldersCount || 0) + 1;
          session.currentFiles = [];
          await setSession(env, userId, session);

          return await ctx.reply(
            `✅ Saved folder *"${escapeMarkdown(text)}"* with ${savedCount} file(s)!\n\n` +
            `Send more files and another folder name, or type /done to complete.`,
            { parse_mode: 'Markdown' }
          );
        } catch (dbErr) {
          console.error('Error saving folder/files:', dbErr);
          return await ctx.reply(`⚠️ Failed to save folder: ${dbErr.message}`);
        }
      }
    }

    // STEP 4: Awaiting Schedule Time
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
        await updatePost(env, session.postId, {
          status: 'scheduled',
          scheduled_at: parsedDate.toISOString()
        });

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

/**
 * Escapes characters for Telegram Markdown v1
 */
function escapeMarkdown(text) {
  if (!text) return '';
  return String(text).replace(/([_*`\[\]])/g, '\\$1');
}
