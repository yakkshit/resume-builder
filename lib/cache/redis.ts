/**
 * Upstash Redis Cache & Rate-Limiting Client
 * Provides high-speed caching for scraped job postings, resume templates, and API rate limiting.
 * Falls back gracefully to an in-memory cache when Upstash credentials are not set.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds = 300): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}

export class AppCache {
  private memory = new MemoryCache();
  private redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  private redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  get isRedisConfigured(): boolean {
    return Boolean(this.redisUrl && this.redisToken);
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isRedisConfigured) {
      return this.memory.get<T>(key);
    }

    try {
      const res = await fetch(`${this.redisUrl}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.redisToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.result) return null;
      try {
        return JSON.parse(data.result) as T;
      } catch {
        return data.result as T;
      }
    } catch {
      return this.memory.get<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    this.memory.set(key, value, ttlSeconds);

    if (!this.isRedisConfigured) return;

    try {
      const payload = typeof value === "string" ? value : JSON.stringify(value);
      await fetch(
        `${this.redisUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(payload)}?EX=${ttlSeconds}`,
        {
          headers: { Authorization: `Bearer ${this.redisToken}` },
        }
      );
    } catch (e) {
      console.warn("Upstash Redis set error:", e);
    }
  }
}

export const appCache = new AppCache();
