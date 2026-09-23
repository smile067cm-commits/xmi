import { getSettingValue, updateSetting } from './db.js';

/**
 * Multi-step session manager for Cloudflare Workers
 * Supports in-memory fast caching, Cloudflare KV (env.BOT_KV), and persistent Supabase DB storage
 * to guarantee that sessions never expire across edge worker isolates.
 */

const memoryStore = new Map();

/**
 * Get user session
 */
export async function getSession(env, userId) {
  const key = `session:${userId}`;
  const now = Date.now();

  // 1. Fast in-memory check
  const cached = memoryStore.get(key);
  if (cached) {
    if (!cached._expiresAt || cached._expiresAt > now) {
      return cached.data;
    } else {
      memoryStore.delete(key);
    }
  }

  // 2. Cloudflare KV if available
  if (env.BOT_KV) {
    try {
      const data = await env.BOT_KV.get(key, 'json');
      if (data) {
        memoryStore.set(key, { data, _expiresAt: now + 3600000 });
        return data;
      }
    } catch (e) {
      console.warn('KV getSession error:', e.message);
    }
  }

  // 3. Persistent Supabase DB fallback
  try {
    const record = await getSettingValue(env, `session_${userId}`, null);
    if (record && record.data) {
      if (!record.expiresAt || record.expiresAt > now) {
        memoryStore.set(key, { data: record.data, _expiresAt: record.expiresAt || (now + 86400000) });
        return record.data;
      }
    }
  } catch (e) {
    console.warn('DB getSession error:', e.message);
  }

  return null;
}

/**
 * Save user session with TTL (default 24 hours = 86400 seconds)
 */
export async function setSession(env, userId, sessionData, ttlSeconds = 86400) {
  const key = `session:${userId}`;
  const now = Date.now();
  const expiresAt = now + (ttlSeconds * 1000);

  // 1. Memory store
  memoryStore.set(key, { data: sessionData, _expiresAt: expiresAt });

  // 2. Cloudflare KV if available
  if (env.BOT_KV) {
    try {
      await env.BOT_KV.put(key, JSON.stringify(sessionData), {
        expirationTtl: ttlSeconds
      });
    } catch (e) {
      console.warn('KV setSession error:', e.message);
    }
  }

  // 3. Persistent Supabase DB
  try {
    await updateSetting(env, `session_${userId}`, { data: sessionData, expiresAt });
  } catch (e) {
    console.warn('DB setSession error:', e.message);
  }
}

/**
 * Clear user session
 */
export async function clearSession(env, userId) {
  const key = `session:${userId}`;

  memoryStore.delete(key);

  if (env.BOT_KV) {
    try {
      await env.BOT_KV.delete(key);
    } catch (e) {
      console.warn('KV clearSession error:', e.message);
    }
  }

  try {
    await updateSetting(env, `session_${userId}`, null);
  } catch (e) {
    console.warn('DB clearSession error:', e.message);
  }
}
