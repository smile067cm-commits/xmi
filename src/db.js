/**
 * Database Clients & Helpers for Supabase PostgreSQL REST API
 * All requests use native fetch to run seamlessly on Cloudflare Workers.
 */

function getSupabaseHeaders(env, extraHeaders = {}) {
  return {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...extraHeaders
  };
}

function getSupabaseBaseUrl(env) {
  if (!env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL environment variable is missing.');
  }
  return env.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1';
}

// ------------------------------------------
// 1. USERS (Profiles & Activity Tracking)
// ------------------------------------------

export async function saveOrUpdateUser(env, user) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || !user || !user.id) return null;

  try {
    const baseUrl = getSupabaseBaseUrl(env);
    const checkUrl = `${baseUrl}/users?id=eq.${user.id}&select=id,interactions,first_seen`;
    const checkRes = await fetch(checkUrl, {
      method: 'GET',
      headers: getSupabaseHeaders(env)
    });

    const existingUsers = checkRes.ok ? await checkRes.json() : [];

    if (existingUsers && existingUsers.length > 0) {
      const existing = existingUsers[0];
      const updateUrl = `${baseUrl}/users?id=eq.${user.id}`;
      await fetch(updateUrl, {
        method: 'PATCH',
        headers: getSupabaseHeaders(env),
        body: JSON.stringify({
          username: user.username || null,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          language_code: user.language_code || 'en',
          last_activity: new Date().toISOString(),
          interactions: (Number(existing.interactions) || 0) + 1
        })
      });
      return existing;
    } else {
      const insertUrl = `${baseUrl}/users`;
      const insertRes = await fetch(insertUrl, {
        method: 'POST',
        headers: getSupabaseHeaders(env),
        body: JSON.stringify({
          id: user.id,
          username: user.username || null,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          language_code: user.language_code || 'en',
          first_seen: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          interactions: 1
        })
      });
      const inserted = await insertRes.json();
      return inserted ? inserted[0] : null;
    }
  } catch (error) {
    console.error('Error saving user to Supabase:', error);
    return null;
  }
}

export async function getUser(env, userId) {
  if (!env.SUPABASE_URL || !userId) return null;
  try {
    const url = `${getSupabaseBaseUrl(env)}/users?id=eq.${userId}&select=*`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getSupabaseHeaders(env)
    });
    if (!res.ok) return null;
    const users = await res.json();
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error fetching user from Supabase:', error);
    return null;
  }
}

// ------------------------------------------
// 2. CONTENT & POSTS
// ------------------------------------------

/**
 * Fetch published posts for public feed (Promoted posts pinned to top)
 */
export async function getPublishedPosts(env, userId = null) {
  const url = `${getSupabaseBaseUrl(env)}/posts?status=eq.published&order=is_promoted.desc,created_at.desc&select=id,title,preview_image,direct_link,direct_link_title,is_promoted,category,tags,status,created_at,likes(user_id),comments(id,is_hidden),post_views(id),saved_posts(user_id)`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: getSupabaseHeaders(env)
  });

  if (!res.ok) {
    throw new Error(`Supabase error (${res.status}): ${await res.text()}`);
  }

  const posts = await res.json();
  
  return posts.map(post => ({
    id: post.id,
    title: post.title,
    preview_image: post.preview_image,
    direct_link: post.direct_link,
    direct_link_title: post.direct_link_title,
    is_promoted: Boolean(post.is_promoted),
    category: post.category || 'All',
    tags: post.tags || '',
    status: post.status,
    created_at: post.created_at,
    like_count: post.likes ? post.likes.length : 0,
    comment_count: post.comments ? post.comments.filter(c => !c.is_hidden).length : 0,
    view_count: post.post_views ? post.post_views.length : 0,
    is_saved: userId ? (post.saved_posts || []).some(s => String(s.user_id) === String(userId)) : false
  }));
}

/**
 * Fetch ALL posts for Admin Management (Promoted posts pinned to top)
 */
export async function getAllPostsForAdmin(env) {
  const url = `${getSupabaseBaseUrl(env)}/posts?order=is_promoted.desc,created_at.desc&select=id,title,preview_image,direct_link,direct_link_title,is_promoted,category,tags,status,scheduled_at,created_at,likes(user_id),comments(id),post_views(id),file_access_logs(id)`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: getSupabaseHeaders(env)
  });

  if (!res.ok) {
    throw new Error(`Supabase error (${res.status}): ${await res.text()}`);
  }

  const posts = await res.json();
  
  return posts.map(post => ({
    id: post.id,
    title: post.title,
    preview_image: post.preview_image,
    direct_link: post.direct_link,
    direct_link_title: post.direct_link_title,
    is_promoted: Boolean(post.is_promoted),
    category: post.category || 'All',
    tags: post.tags || '',
    status: post.status,
    scheduled_at: post.scheduled_at,
    created_at: post.created_at,
    like_count: post.likes ? post.likes.length : 0,
    comment_count: post.comments ? post.comments.length : 0,
    view_count: post.post_views ? post.post_views.length : 0,
    access_count: post.file_access_logs ? post.file_access_logs.length : 0
  }));
}

/**
 * Fetch single post with folders, direct links, comments, and like status
 */
export async function getPostById(env, postId, userId = null, isAdmin = false) {
  const url = `${getSupabaseBaseUrl(env)}/posts?id=eq.${postId}&select=id,title,preview_image,direct_link,direct_link_title,is_promoted,category,tags,status,scheduled_at,created_at,folders(id,name,created_at,files(id,file_id,channel_message_id,file_name,mime_type,size)),comments(id,user_id,username,text,is_hidden,created_at),likes(user_id),post_views(id),saved_posts(user_id)`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: getSupabaseHeaders(env)
  });

  if (!res.ok) {
    throw new Error(`Supabase error (${res.status}): ${await res.text()}`);
  }

  const posts = await res.json();
  if (!posts || posts.length === 0) return null;

  const post = posts[0];
  const liked = userId ? (post.likes || []).some(l => String(l.user_id) === String(userId)) : false;
  const is_saved = userId ? (post.saved_posts || []).some(s => String(s.user_id) === String(userId)) : false;

  const allComments = post.comments || [];
  const comments = (isAdmin ? allComments : allComments.filter(c => !c.is_hidden))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  const folders = (post.folders || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return {
    id: post.id,
    title: post.title,
    preview_image: post.preview_image,
    direct_link: post.direct_link,
    direct_link_title: post.direct_link_title,
    is_promoted: Boolean(post.is_promoted),
    category: post.category || 'All',
    tags: post.tags || '',
    status: post.status,
    created_at: post.created_at,
    folders,
    comments,
    like_count: post.likes ? post.likes.length : 0,
    comment_count: comments.length,
    view_count: post.post_views ? post.post_views.length : 0,
    liked,
    is_saved
  };
}

export async function getPostFoldersWithFiles(env, postId) {
  const url = `${getSupabaseBaseUrl(env)}/folders?post_id=eq.${postId}&select=id,name,created_at,files(id,file_id,channel_message_id,file_name,mime_type,size)&order=created_at.asc`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: getSupabaseHeaders(env)
  });

  if (!res.ok) {
    throw new Error(`Supabase error (${res.status}): ${await res.text()}`);
  }

  return await res.json();
}

export async function getFolderFiles(env, folderId) {
  const url = `${getSupabaseBaseUrl(env)}/files?folder_id=eq.${folderId}&select=id,file_id,channel_message_id,file_name,mime_type,size&order=created_at.asc`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: getSupabaseHeaders(env)
  });

  if (!res.ok) {
    throw new Error(`Supabase error (${res.status}): ${await res.text()}`);
  }

  return await res.json();
}

export async function createPost(env, { title, preview_image = null, direct_link = null, direct_link_title = null, is_promoted = false, category = 'All', tags = '', status = 'draft', scheduled_at = null, created_by }) {
  const url = `${getSupabaseBaseUrl(env)}/posts`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: getSupabaseHeaders(env),
    body: JSON.stringify({
      title,
      preview_image,
      direct_link,
      direct_link_title,
      is_promoted,
      category: category || 'All',
      tags: tags || '',
      status,
      scheduled_at,
      created_by
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to create post (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data[0];
}

export async function updatePost(env, postId, updateFields) {
  const url = `${getSupabaseBaseUrl(env)}/posts?id=eq.${postId}`;
  
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getSupabaseHeaders(env),
    body: JSON.stringify({
      ...updateFields,
      updated_at: new Date().toISOString()
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to update post (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data[0];
}

export async function togglePromotePost(env, postId, isPromoted) {
  return await updatePost(env, postId, { is_promoted: isPromoted });
}

export async function deletePost(env, postId) {
  const url = `${getSupabaseBaseUrl(env)}/posts?id=eq.${postId}`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getSupabaseHeaders(env)
  });

  if (!res.ok) {
    throw new Error(`Failed to delete post (${res.status}): ${await res.text()}`);
  }

  return true;
}

export async function createFolder(env, { post_id, name }) {
  const url = `${getSupabaseBaseUrl(env)}/folders`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: getSupabaseHeaders(env),
    body: JSON.stringify({
      post_id,
      name
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to create folder (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data[0];
}

export async function createFiles(env, filesArray) {
  if (!filesArray || filesArray.length === 0) return [];

  const url = `${getSupabaseBaseUrl(env)}/files`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: getSupabaseHeaders(env),
    body: JSON.stringify(filesArray)
  });

  if (!res.ok) {
    throw new Error(`Failed to insert files (${res.status}): ${await res.text()}`);
  }

  return await res.json();
}

// ------------------------------------------
// 3. ANALYTICS & ACTIVITY LOGGING
// ------------------------------------------

/**
 * Record a user viewing a post
 */
export async function recordPostView(env, { post_id, user_id, username, first_name }) {
  if (!env.SUPABASE_URL || !post_id || !user_id) return null;
  try {
    const url = `${getSupabaseBaseUrl(env)}/post_views`;
    await fetch(url, {
      method: 'POST',
      headers: getSupabaseHeaders(env),
      body: JSON.stringify({
        post_id: Number(post_id),
        user_id: Number(user_id),
        username: username || null,
        first_name: first_name || ''
      })
    });
  } catch (err) {
    console.warn('Record post view warning:', err.message);
  }
}

/**
 * Record a user downloading a file or accessing a link
 */
export async function recordFileAccess(env, { post_id, folder_id = null, file_id = null, item_name, user_id, username, first_name }) {
  if (!env.SUPABASE_URL || !post_id || !user_id) return null;
  try {
    const url = `${getSupabaseBaseUrl(env)}/file_access_logs`;
    await fetch(url, {
      method: 'POST',
      headers: getSupabaseHeaders(env),
      body: JSON.stringify({
        post_id: Number(post_id),
        folder_id: folder_id ? Number(folder_id) : null,
        file_id: file_id || null,
        item_name: item_name || 'Resource',
        user_id: Number(user_id),
        username: username || null,
        first_name: first_name || ''
      })
    });
  } catch (err) {
    console.warn('Record file access warning:', err.message);
  }
}

/**
 * Fetch detailed analytics for a post (Views, Downloads/Accesses, Likes)
 */
export async function getPostAnalytics(env, postId) {
  const baseUrl = getSupabaseBaseUrl(env);

  // 1. Fetch Views
  const viewsUrl = `${baseUrl}/post_views?post_id=eq.${postId}&order=viewed_at.desc&limit=100`;
  const viewsRes = await fetch(viewsUrl, { method: 'GET', headers: getSupabaseHeaders(env) });
  const views = viewsRes.ok ? await viewsRes.json() : [];

  // 2. Fetch File & Link Access Logs
  const accessUrl = `${baseUrl}/file_access_logs?post_id=eq.${postId}&order=accessed_at.desc&limit=100`;
  const accessRes = await fetch(accessUrl, { method: 'GET', headers: getSupabaseHeaders(env) });
  const accesses = accessRes.ok ? await accessRes.json() : [];

  // 3. Fetch Likes with User details
  const likesUrl = `${baseUrl}/likes?post_id=eq.${postId}&order=created_at.desc&select=post_id,user_id,created_at`;
  const likesRes = await fetch(likesUrl, { method: 'GET', headers: getSupabaseHeaders(env) });
  const rawLikes = likesRes.ok ? await likesRes.json() : [];

  // Attach user details from users table for likes
  const likes = [];
  for (const l of rawLikes) {
    let userDetails = { username: 'User', first_name: '' };
    try {
      const u = await getUser(env, l.user_id);
      if (u) userDetails = u;
    } catch (e) {}
    likes.push({
      user_id: l.user_id,
      username: userDetails.username || 'User',
      first_name: userDetails.first_name || '',
      created_at: l.created_at
    });
  }

  return {
    views,
    accesses,
    likes
  };
}

/**
 * Fetch Global Hub Analytics & Metrics (Admin Only)
 */
export async function getGlobalStats(env) {
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);

  try {
    const [usersRes, postsRes, viewsRes, filesRes, likesRes, commentsRes] = await Promise.all([
      fetch(`${baseUrl}/users?select=id`, { headers }),
      fetch(`${baseUrl}/posts?select=id,status,is_promoted`, { headers }),
      fetch(`${baseUrl}/post_views?select=id`, { headers }),
      fetch(`${baseUrl}/file_access_logs?select=id`, { headers }),
      fetch(`${baseUrl}/likes?select=post_id`, { headers }),
      fetch(`${baseUrl}/comments?select=id`, { headers })
    ]);

    const users = usersRes.ok ? await usersRes.json() : [];
    const posts = postsRes.ok ? await postsRes.json() : [];
    const views = viewsRes.ok ? await viewsRes.json() : [];
    const files = filesRes.ok ? await filesRes.json() : [];
    const likes = likesRes.ok ? await likesRes.json() : [];
    const comments = commentsRes.ok ? await commentsRes.json() : [];

    const publishedCount = posts.filter(p => p.status === 'published').length;
    const draftsCount = posts.filter(p => p.status === 'draft').length;
    const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
    const promotedCount = posts.filter(p => p.is_promoted).length;

    return {
      total_users: users.length,
      total_posts: posts.length,
      published_posts: publishedCount,
      draft_posts: draftsCount,
      scheduled_posts: scheduledCount,
      promoted_posts: promotedCount,
      total_views: views.length,
      total_file_accesses: files.length,
      total_likes: likes.length,
      total_comments: comments.length
    };
  } catch (err) {
    console.error('Error fetching global stats:', err);
    return {
      total_users: 0,
      total_posts: 0,
      published_posts: 0,
      draft_posts: 0,
      scheduled_posts: 0,
      promoted_posts: 0,
      total_views: 0,
      total_file_accesses: 0,
      total_likes: 0,
      total_comments: 0
    };
  }
}

// ------------------------------------------
// 4. COMMENTS & MODERATION
// ------------------------------------------

export async function addComment(env, { post_id, user_id, username, text }) {
  const url = `${getSupabaseBaseUrl(env)}/comments`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: getSupabaseHeaders(env),
    body: JSON.stringify({
      post_id,
      user_id,
      username: username || 'Anonymous',
      text,
      is_hidden: false
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to add comment (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data[0];
}

export async function moderateComment(env, { comment_id, action }) {
  const baseUrl = getSupabaseBaseUrl(env);

  if (action === 'delete') {
    const delUrl = `${baseUrl}/comments?id=eq.${comment_id}`;
    const res = await fetch(delUrl, {
      method: 'DELETE',
      headers: getSupabaseHeaders(env)
    });
    if (!res.ok) throw new Error(`Failed to delete comment: ${await res.text()}`);
    return { deleted: true };
  } else {
    const isHidden = action === 'hide';
    const updateUrl = `${baseUrl}/comments?id=eq.${comment_id}`;
    const res = await fetch(updateUrl, {
      method: 'PATCH',
      headers: getSupabaseHeaders(env),
      body: JSON.stringify({ is_hidden: isHidden })
    });
    if (!res.ok) throw new Error(`Failed to update comment: ${await res.text()}`);
    const data = await res.json();
    return data[0];
  }
}

// ------------------------------------------
// 5. LIKES & SCHEDULER
// ------------------------------------------

export async function toggleLike(env, { post_id, user_id }) {
  const baseUrl = getSupabaseBaseUrl(env);
  
  const checkUrl = `${baseUrl}/likes?post_id=eq.${post_id}&user_id=eq.${user_id}&select=post_id,user_id`;
  const checkRes = await fetch(checkUrl, {
    method: 'GET',
    headers: getSupabaseHeaders(env)
  });

  if (!checkRes.ok) {
    throw new Error(`Failed to check like status (${checkRes.status}): ${await checkRes.text()}`);
  }

  const existingLikes = await checkRes.json();
  let liked = false;

  if (existingLikes && existingLikes.length > 0) {
    const deleteUrl = `${baseUrl}/likes?post_id=eq.${post_id}&user_id=eq.${user_id}`;
    const delRes = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: getSupabaseHeaders(env)
    });
    if (!delRes.ok) {
      throw new Error(`Failed to remove like (${delRes.status}): ${await delRes.text()}`);
    }
    liked = false;
  } else {
    const insertUrl = `${baseUrl}/likes`;
    const insRes = await fetch(insertUrl, {
      method: 'POST',
      headers: getSupabaseHeaders(env),
      body: JSON.stringify({ post_id, user_id })
    });
    if (!insRes.ok) {
      throw new Error(`Failed to insert like (${insRes.status}): ${await insRes.text()}`);
    }
    liked = true;
  }

  const countUrl = `${baseUrl}/likes?post_id=eq.${post_id}&select=user_id`;
  const countRes = await fetch(countUrl, {
    method: 'GET',
    headers: getSupabaseHeaders(env)
  });
  const allLikes = countRes.ok ? await countRes.json() : [];

  return {
    liked,
    like_count: allLikes.length
  };
}

export async function publishScheduledPosts(env) {
  const baseUrl = getSupabaseBaseUrl(env);
  const nowIso = new Date().toISOString();

  const queryUrl = `${baseUrl}/posts?status=eq.scheduled&scheduled_at=lte.${encodeURIComponent(nowIso)}&select=id,title,scheduled_at`;
  
  const findRes = await fetch(queryUrl, {
    method: 'GET',
    headers: getSupabaseHeaders(env)
  });

  if (!findRes.ok) {
    console.error('Failed to query scheduled posts:', await findRes.text());
    return [];
  }

  const scheduledPosts = await findRes.json();
  const publishedIds = [];

  for (const post of scheduledPosts) {
    try {
      await updatePost(env, post.id, { status: 'published' });
      publishedIds.push(post.id);
      console.log(`Cron: Successfully auto-published post #${post.id} ("${post.title}")`);
    } catch (err) {
      console.error(`Cron: Error publishing post #${post.id}:`, err);
    }
  }

  return publishedIds;
}

// ------------------------------------------
// 5. BOOKMARKS / SAVED POSTS
// ------------------------------------------
export async function toggleSavePost(env, user_id, post_id) {
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);

  const checkRes = await fetch(`${baseUrl}/saved_posts?user_id=eq.${user_id}&post_id=eq.${post_id}&select=post_id`, { headers });
  const existing = checkRes.ok ? await checkRes.json() : [];

  if (existing.length > 0) {
    await fetch(`${baseUrl}/saved_posts?user_id=eq.${user_id}&post_id=eq.${post_id}`, {
      method: 'DELETE',
      headers
    });
    return { saved: false };
  } else {
    await fetch(`${baseUrl}/saved_posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id, post_id })
    });
    return { saved: true };
  }
}

export async function getSavedPosts(env, user_id) {
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);

  const res = await fetch(`${baseUrl}/saved_posts?user_id=eq.${user_id}&select=post_id,posts(id,title,preview_image,direct_link,direct_link_title,is_promoted,category,tags,status,created_at,likes(user_id),comments(id,is_hidden),post_views(id))&order=created_at.desc`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map(item => item.posts).filter(Boolean).map(post => ({
    id: post.id,
    title: post.title,
    preview_image: post.preview_image,
    direct_link: post.direct_link,
    direct_link_title: post.direct_link_title,
    is_promoted: Boolean(post.is_promoted),
    category: post.category || 'All',
    tags: post.tags || '',
    status: post.status,
    created_at: post.created_at,
    like_count: post.likes ? post.likes.length : 0,
    comment_count: post.comments ? post.comments.filter(c => !c.is_hidden).length : 0,
    view_count: post.post_views ? post.post_views.length : 0,
    is_saved: true
  }));
}

// ------------------------------------------
// 6. GLOBAL SETTINGS (Referrals, Monetization, Ads, Force Join)
// ------------------------------------------
export async function getSettings(env) {
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);
  const res = await fetch(`${baseUrl}/settings?select=key,value`, { headers });
  const list = res.ok ? await res.json() : [];
  const map = {};
  list.forEach(item => {
    map[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
  });
  return {
    referral_enabled: map.referral_enabled ?? false,
    referral_points: map.referral_points ?? 10,
    shortener_enabled: map.shortener_enabled ?? false,
    shortener_api_url: map.shortener_api_url ?? '',
    shortener_api_key: map.shortener_api_key ?? '',
    shortener_mode: map.shortener_mode ?? 'time', // 'time' or 'count'
    shortener_duration_hours: map.shortener_duration_hours ?? 24,
    shortener_posts_count: map.shortener_posts_count ?? 5,
    banner_enabled: map.banner_enabled ?? false,
    banner_image: map.banner_image ?? '',
    banner_link: map.banner_link ?? '',
    banner_title: map.banner_title ?? '',
    banner_text: map.banner_text ?? '',
    force_join_enabled: map.force_join_enabled ?? false
  };
}

export async function updateSetting(env, key, value) {
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);
  const res = await fetch(`${baseUrl}/settings`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() })
  });
  return res.ok;
}

// ------------------------------------------
// 7. FORCE JOIN CHANNELS
// ------------------------------------------
export async function getForceChannels(env) {
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);
  const res = await fetch(`${baseUrl}/force_channels?order=created_at.asc`, { headers });
  return res.ok ? await res.json() : [];
}

export async function addForceChannel(env, { channel_id, channel_title, invite_link }) {
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);
  const res = await fetch(`${baseUrl}/force_channels`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ channel_id: String(channel_id), channel_title, invite_link })
  });
  return res.ok ? (await res.json())[0] : null;
}

export async function removeForceChannel(env, id) {
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);
  const res = await fetch(`${baseUrl}/force_channels?id=eq.${id}`, {
    method: 'DELETE',
    headers
  });
  return res.ok;
}

// ------------------------------------------
// 8. REFERRAL & POINTS
// ------------------------------------------
export async function processReferral(env, newUserId, referrerId) {
  if (!referrerId || String(newUserId) === String(referrerId)) return false;
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);

  const checkRes = await fetch(`${baseUrl}/users?id=eq.${newUserId}&select=id,referred_by`, { headers });
  const userRows = checkRes.ok ? await checkRes.json() : [];
  if (userRows.length > 0 && userRows[0].referred_by) {
    return false;
  }

  const settings = await getSettings(env);
  if (!settings.referral_enabled) return false;

  const pointsToAdd = Number(settings.referral_points) || 10;

  const refRes = await fetch(`${baseUrl}/users?id=eq.${referrerId}&select=id,points,referral_count`, { headers });
  const refRows = refRes.ok ? await refRes.json() : [];
  if (refRows.length > 0) {
    const currentPoints = Number(refRows[0].points) || 0;
    const currentCount = Number(refRows[0].referral_count) || 0;
    await fetch(`${baseUrl}/users?id=eq.${referrerId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        points: currentPoints + pointsToAdd,
        referral_count: currentCount + 1
      })
    });
  }

  await fetch(`${baseUrl}/users?id=eq.${newUserId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ referred_by: Number(referrerId) })
  });

  return true;
}

// ------------------------------------------
// 9. USER PASSES & VERIFY TOKENS (Shortener)
// ------------------------------------------
export async function checkUserPass(env, user_id) {
  const settings = await getSettings(env);
  if (!settings.shortener_enabled) {
    return { has_pass: true, reason: 'shortener_disabled' };
  }

  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);

  const res = await fetch(`${baseUrl}/user_passes?user_id=eq.${user_id}`, { headers });
  const rows = res.ok ? await res.json() : [];
  if (rows.length === 0) {
    return { has_pass: false };
  }

  const pass = rows[0];
  const now = new Date();

  if (settings.shortener_mode === 'time') {
    if (pass.pass_expires_at && new Date(pass.pass_expires_at) > now) {
      return { has_pass: true, expires_at: pass.pass_expires_at };
    }
  } else {
    if (pass.posts_left > 0) {
      return { has_pass: true, posts_left: pass.posts_left };
    }
  }

  return { has_pass: false };
}

export async function grantUserPass(env, user_id) {
  const settings = await getSettings(env);
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);

  let pass_expires_at = null;
  let posts_left = 0;

  if (settings.shortener_mode === 'time') {
    const hours = Number(settings.shortener_duration_hours) || 24;
    const exp = new Date();
    exp.setHours(exp.getHours() + hours);
    pass_expires_at = exp.toISOString();
  } else {
    posts_left = Number(settings.shortener_posts_count) || 5;
  }

  await fetch(`${baseUrl}/user_passes`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({
      user_id,
      pass_expires_at,
      posts_left,
      last_verified_at: new Date().toISOString()
    })
  });

  return { pass_expires_at, posts_left };
}

export async function consumeUserPass(env, user_id) {
  const settings = await getSettings(env);
  if (!settings.shortener_enabled || settings.shortener_mode !== 'count') return;

  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);
  const res = await fetch(`${baseUrl}/user_passes?user_id=eq.${user_id}`, { headers });
  const rows = res.ok ? await res.json() : [];
  if (rows.length > 0 && rows[0].posts_left > 0) {
    await fetch(`${baseUrl}/user_passes?user_id=eq.${user_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ posts_left: rows[0].posts_left - 1 })
    });
  }
}

export async function createVerifyToken(env, user_id, target_post_id = null) {
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);
  const token = 'v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

  await fetch(`${baseUrl}/verify_tokens`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      token,
      user_id,
      target_post_id: target_post_id ? Number(target_post_id) : null,
      created_at: new Date().toISOString(),
      is_used: false
    })
  });

  return token;
}

export async function verifyTokenAndGrantPass(env, token) {
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);

  const res = await fetch(`${baseUrl}/verify_tokens?token=eq.${token}&is_used=eq.false`, { headers });
  const rows = res.ok ? await res.json() : [];
  if (rows.length === 0) return null;

  const row = rows[0];
  await fetch(`${baseUrl}/verify_tokens?token=eq.${token}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ is_used: true })
  });

  await grantUserPass(env, row.user_id);
  return row;
}

export async function getAllUserIds(env) {
  const baseUrl = getSupabaseBaseUrl(env);
  const headers = getSupabaseHeaders(env);
  const res = await fetch(`${baseUrl}/users?select=id`, { headers });
  const rows = res.ok ? await res.json() : [];
  return rows.map(r => r.id);
}
