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
export async function getPublishedPosts(env) {
  const url = `${getSupabaseBaseUrl(env)}/posts?status=eq.published&order=is_promoted.desc,created_at.desc&select=id,title,preview_image,direct_link,direct_link_title,is_promoted,status,created_at,likes(user_id),comments(id,is_hidden),post_views(id)`;
  
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
    status: post.status,
    created_at: post.created_at,
    like_count: post.likes ? post.likes.length : 0,
    comment_count: post.comments ? post.comments.filter(c => !c.is_hidden).length : 0,
    view_count: post.post_views ? post.post_views.length : 0
  }));
}

/**
 * Fetch ALL posts for Admin Management (Promoted posts pinned to top)
 */
export async function getAllPostsForAdmin(env) {
  const url = `${getSupabaseBaseUrl(env)}/posts?order=is_promoted.desc,created_at.desc&select=id,title,preview_image,direct_link,direct_link_title,is_promoted,status,scheduled_at,created_at,likes(user_id),comments(id),post_views(id),file_access_logs(id)`;
  
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
  const url = `${getSupabaseBaseUrl(env)}/posts?id=eq.${postId}&select=id,title,preview_image,direct_link,direct_link_title,is_promoted,status,scheduled_at,created_at,folders(id,name,created_at,files(id,file_id,channel_message_id,file_name,mime_type,size)),comments(id,user_id,username,text,is_hidden,created_at),likes(user_id),post_views(id)`;
  
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
    status: post.status,
    created_at: post.created_at,
    folders,
    comments,
    like_count: post.likes ? post.likes.length : 0,
    comment_count: comments.length,
    view_count: post.post_views ? post.post_views.length : 0,
    liked
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

export async function createPost(env, { title, preview_image = null, direct_link = null, direct_link_title = null, is_promoted = false, status = 'draft', scheduled_at = null, created_by }) {
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
