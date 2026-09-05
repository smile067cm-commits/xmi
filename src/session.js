/**
 * Multi-step session manager for Cloudflare Workers
 * Supports Cloudflare KV (env.BOT_KV) for distributed persistence across edge requests.
 * Falls back to in-memory state store if KV namespace is not bound.
 */

const memoryStore = new Map();

/**
 * Get user session
 */
export async function getSession(env, userId) {
  const key = `session:${userId}`;

  // 1. Try Cloudflare KV if available
  if (env.BOT_KV) {
    try {
      const data = await env.BOT_KV.get(key, 'json');
      return data || null;
    } catch (e) {
      console.warn('KV getSession error:', e.message);
    }
  }

  // 2. Memory store fallback
  return memoryStore.get(key) || null;
}

/**
 * Save user session with TTL (default 1 hour = 3600 seconds)
 */
export async function setSession(env, userId, sessionData, ttlSeconds = 3600) {
  const key = `session:${userId}`;

  // 1. Try Cloudflare KV if available
  if (env.BOT_KV) {
    try {
      await env.BOT_KV.put(key, JSON.stringify(sessionData), {
        expirationTtl: ttlSeconds
      });
      return;
    } catch (e) {
      console.warn('KV setSession error:', e.message);
    }
  }

  // 2. Memory store fallback
  memoryStore.set(key, sessionData);
}

/**
 * Clear user session
 */
export async function clearSession(env, userId) {
  const key = `session:${userId}`;

  if (env.BOT_KV) {
    try {
      await env.BOT_KV.delete(key);
    } catch (e) {
      console.warn('KV clearSession error:', e.message);
    }
  }

  memoryStore.delete(key);
}
