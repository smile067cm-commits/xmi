/**
 * Database Clients & Helpers for Firebase Realtime DB and Supabase REST API
 * All requests use native fetch to run seamlessly on Cloudflare Workers.
 */

// ==========================================
// 1. FIREBASE REALTIME DATABASE (Users)
// ==========================================

/**
 * Format Firebase REST URL
 */
function getFirebaseUrl(env, path) {
  const baseUrl = env.FIREBASE_URL.replace(/\/+$/, '');
  const authParam = env.FIREBASE_SECRET ? `?auth=${encodeURIComponent(env.FIREBASE_SECRET)}` : '';
  return `${baseUrl}/${path}.json${authParam}`;
}

/**
 * Save or update Telegram user details and activity in Firebase Realtime DB
 */
export async function saveOrUpdateUser(env, user) {
  if (!env.FIREBASE_URL || !user || !user.id) return null;

  try {
    const userUrl = getFirebaseUrl(env, `users/${user.id}`);
    
    // Fetch existing user to update interactions count
    let interactions = 1;
    let firstSeen = Date.now();

    try {
      const getRes = await fetch(userUrl);
      if (getRes.ok) {
        const existing = await getRes.json();
        if (existing) {
          interactions = (existing.interactions || 0) + 1;
          firstSeen = existing.first_seen || firstSeen;
        }
      }
    } catch (e) {
      console.warn('Could not fetch existing Firebase user:', e.message);
    }

    const userData = {
      id: user.id,
      username: user.username || null,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      language_code: user.language_code || 'en',
      first_seen: firstSeen,
      last_activity: Date.now(),
      interactions
    };

    const res = await fetch(userUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!res.ok) {
      console.error('Firebase save error:', await res.text());
    }
    return userData;
  } catch (error) {
    console.error('Error saving user to Firebase:', error);
    return null;
  }
}

/**
 * Get user profile from Firebase Realtime DB
 */
export async function getUser(env, userId) {
  if (!env.FIREBASE_URL || !userId) return null;
  try {
    const userUrl = getFirebaseUrl(env, `users/${userId}`);
    const res = await fetch(userUrl);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching user from Firebase:', error);
    return null;
  }
}

// ==========================================
// 2. SUPABASE REST API (Content & Social)
// ==========================================

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
  return env.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1';
}

/**
 * Fetch all published posts with like and comment counts
 */
export async function getPublishedPosts(env) {
  const url = `${getSupabaseBaseUrl(env)}/posts?status=eq.published&order=created_at.desc&select=id,title,preview_image,status,created_at,likes(user_id),comments(id)`;
  
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
    status: post.status,
    created_at: post.created_at,
    like_count: post.likes ? post.likes.length : 0,
    comment_count: post.comments ? post.comments.length : 0
  }));
}

/**
 * Fetch single post with folders, comments and user's liked status
 */
export async function getPostById(env, postId, userId = null) {
  const url = `${getSupabaseBaseUrl(env)}/posts?id=eq.${postId}&select=id,title,preview_image,status,scheduled_at,created_at,folders(id,name,created_at),comments(id,user_id,username,text,created_at),likes(user_id)`;
  
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

  // Sort comments by created_at ascending
  const comments = (post.comments || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  // Sort folders by created_at ascending
  const folders = (post.folders || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return {
    id: post.id,
    title: post.title,
    preview_image: post.preview_image,
    status: post.status,
    created_at: post.created_at,
    folders,
    comments,
    like_count: post.likes ? post.likes.length : 0,
    comment_count: post.comments ? post.comments.length : 0,
    liked
  };
}

/**
 * Fetch all folders and their files for a post (for the Telegram Bot deep-link flow)
 */
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

/**
 * Fetch all files in a specific folder
 */
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

/**
 * Create a new Post in Supabase
 */
export async function createPost(env, { title, preview_image = null, status = 'draft', scheduled_at = null, created_by }) {
  const url = `${getSupabaseBaseUrl(env)}/posts`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: getSupabaseHeaders(env),
    body: JSON.stringify({
      title,
      preview_image,
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

/**
 * Update an existing post in Supabase
 */
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

/**
 * Create a new Folder linked to a Post
 */
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

/**
 * Insert batch of files linked to a folder
 */
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

/**
 * Add a comment to a post
 */
export async function addComment(env, { post_id, user_id, username, text }) {
  const url = `${getSupabaseBaseUrl(env)}/comments`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: getSupabaseHeaders(env),
    body: JSON.stringify({
      post_id,
      user_id,
      username: username || 'Anonymous',
      text
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to add comment (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data[0];
}

/**
 * Toggle like for a user on a post (delete if exists, insert if not)
 */
export async function toggleLike(env, { post_id, user_id }) {
  const baseUrl = getSupabaseBaseUrl(env);
  
  // Check if like exists
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
    // Like exists -> Delete it (unlike)
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
    // Insert new like
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

  // Fetch updated like count
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

/**
 * Publish scheduled posts whose scheduled_at timestamp has arrived
 */
export async function publishScheduledPosts(env) {
  const baseUrl = getSupabaseBaseUrl(env);
  const nowIso = new Date().toISOString();

  // Find posts where status = 'scheduled' and scheduled_at <= now
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
