/**
 * Session cache for demo webms so timeline + modal (+ monitor) share one network fetch.
 * Each distinct path is fetched once into a blob: URL; later mounts reuse it.
 */

const cache = new Map();

/** @param {string | null | undefined} src */
export function getCachedDemoSrc(src) {
  if (!src) return Promise.resolve(null);
  if (String(src).startsWith("blob:")) return Promise.resolve(src);

  const key = String(src);
  const existing = cache.get(key);
  if (existing) return existing;

  const pending = fetch(key)
    .then((response) => {
      if (!response.ok) throw new Error(`Demo fetch failed (${response.status}): ${key}`);
      return response.blob();
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      cache.set(key, Promise.resolve(objectUrl));
      return objectUrl;
    })
    .catch(() => {
      // Fall back to the original URL so playback still works offline-cache / partial failures.
      cache.delete(key);
      return key;
    });

  cache.set(key, pending);
  return pending;
}
