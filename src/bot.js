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
        messageText += `📂 *Available Content Folders:*\nTap a folder below to access all files and download links:\n`;

        const keyboardButtons = (folders || []).map(folder => {
          const fileCount = folder.files?.length || 0;
          return [
            Markup.button.callback(
              `📁 ${folder.name} (${fileCount} item${fileCount === 1 ? '' : 's'})`,
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
    const appUrl = env.WEB_APP_URL || 'https://xmi.lakshminighty1.workers.dev';
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

    // Automatically set the bottom-left Menu Button for the user's chat
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
  // Folder Click Callback: Send Files & Links to User
  // -------------------------------------------------------------
  bot.action(/^folder_(\d+)$/, async (ctx) => {
    const folderId = ctx.match[1];

    try {
      await ctx.answerCbQuery('Fetching folder contents...');
      const files = await getFolderFiles(env, folderId);

      if (!files || files.length === 0) {
        return await ctx.reply('📁 This folder has no files or links.');
      }

      await ctx.reply(`📁 Sending ${files.length} item(s)...`);

      for (const file of files) {
        try {
          const isLink = file.mime_type === 'link' || file.file_id?.startsWith('http://') || file.file_id?.startsWith('https://');

          if (isLink) {
            // Send external file link with interactive button
            const linkTitle = file.file_name || 'Download / External Link';
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
          await ctx.reply(`⚠️ Could not deliver item: ${file.file_name || 'File'}`);
        }
      }
    } catch (err) {
      console.error('Error handling folder callback:', err);
      await ctx.reply('⚠️ Failed to load contents for this folder.');
    }
  });

  // -------------------------------------------------------------
  // /cancel Command & Button Callback: Reset Session
  // -------------------------------------------------------------
  const handleCancel = async (ctx) => {
    const session = await getSession(env, ctx.from.id);
    if (session) {
      await clearSession(env, ctx.from.id);
      if (ctx.callbackQuery) await ctx.answerCbQuery('Post cancelled');
      return await ctx.reply('❌ Post creation was cancelled.');
    }
    if (ctx.callbackQuery) await ctx.answerCbQuery('No active session');
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
  // Skip Image Button Callback
  // -------------------------------------------------------------
  bot.action('step_skip_image', async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || session.step !== 'AWAITING_IMAGE') {
      return await ctx.answerCbQuery('Action not available');
    }

    session.preview_image = null;
    session.step = 'AWAITING_FOLDERS';
    session.currentFiles = [];
    session.foldersCount = 0;
    await setSession(env, userId, session);
    await ctx.answerCbQuery('Skipped image');

    return await sendStep3Prompt(ctx, session);
  });

  // -------------------------------------------------------------
  // Step 3 Helper: Prompt & Buttons
  // -------------------------------------------------------------
  async function sendStep3Prompt(ctx, session) {
    const bufferCount = session.currentFiles?.length || 0;

    let text = `📂 *Step 3/3: Upload Files & Add Links*\n\n`;
    text += `1️⃣ **Send Files:** (PDFs, Videos, Photos, Audio, Archives)\n`;
    text += `2️⃣ **Or Send Links:** Paste any link (e.g. \`https://drive.google.com/... Notes PDF\`)\n`;
    text += `3️⃣ **Organize:** Type a Folder Name to group buffered items\n`;
    text += `4️⃣ **Finish:** Tap Done when finished.\n\n`;

    if (bufferCount > 0) {
      text += `📥 *Current Buffer:* ${bufferCount} item(s) waiting for folder name.\n`;
    }

    const buttons = [];
    if (bufferCount > 0) {
      buttons.push([Markup.button.callback('📁 Save Buffer into Folder', 'step_prompt_folder_name')]);
    }
    buttons.push([
      Markup.button.callback('✅ Done & Publish', 'step_finish_folders'),
      Markup.button.callback('❌ Cancel', 'step_cancel')
    ]);

    const keyboard = Markup.inlineKeyboard(buttons);

    return await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  }

  bot.action('step_prompt_folder_name', async (ctx) => {
    await ctx.answerCbQuery();
    return await ctx.reply(
      '📁 *Please type the Folder Name* (e.g. `PDF Guides`, `HD Wallpapers`) to save the buffered items into that folder:',
      { parse_mode: 'Markdown' }
    );
  });

  // -------------------------------------------------------------
  // /done Command & Done Button Callback
  // -------------------------------------------------------------
  const handleFinishFolders = async (ctx) => {
    const userId = ctx.from.id;
    if (String(userId) !== String(env.ADMIN_ID)) return;

    const session = await getSession(env, userId);
    if (!session || (session.step !== 'AWAITING_FOLDERS' && session.step !== 'AWAITING_TITLE')) {
      if (ctx.callbackQuery) await ctx.answerCbQuery('No active post creation');
      return await ctx.reply('ℹ️ You are not currently creating a post. Use /addpost to start.');
    }

    // Auto-save any leftover buffered items into a default folder
    if (session.currentFiles && session.currentFiles.length > 0) {
      try {
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
  // Multi-step Message Handler (Files, Links, Folders, Title, Images)
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
          return await ctx.reply('⚠️ Please send a valid HTTP(S) image URL or tap Skip.');
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

      return await sendStep3Prompt(ctx, session);
    }

    // STEP 3: Awaiting Folders, Files, and Links
    if (session.step === 'AWAITING_FOLDERS') {
      const msg = ctx.message;
      let itemMeta = null;

      // 1. Check if user sent an External File Link (URL)
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

      // 2. Check if media file message
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

      // If item was detected (file or link)
      if (itemMeta) {
        // If actual Telegram media, copy to CHANNEL_ID
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
            Markup.button.callback('✅ Done & Publish', 'step_finish_folders'),
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

      // If regular text sent (and not a command), treat it as the Folder Name
      if (text && !text.startsWith('/')) {
        if (!session.currentFiles || session.currentFiles.length === 0) {
          const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('✅ Done & Publish', 'step_finish_folders')],
            [Markup.button.callback('❌ Cancel', 'step_cancel')]
          ]);
          return await ctx.reply(
            '⚠️ No files or links buffered yet. Please send some files or links first, then type the folder name.',
            keyboard
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
            [Markup.button.callback('🚀 Finish & Publish Now', 'step_finish_folders')]
          ]);

          return await ctx.reply(
            `✅ Saved folder *"${escapeMarkdown(text)}"* with ${savedCount} item(s)!\n\n` +
            `• Send more files/links for another folder, or\n` +
            `• Tap **Finish & Publish Now** below:`,
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
