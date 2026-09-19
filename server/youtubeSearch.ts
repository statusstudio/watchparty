export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
}

interface CacheEntry {
  timestamp: number;
  results: YouTubeSearchResult[];
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 150;

/**
 * Extracts a YouTube 11-character video ID from a URL or raw ID string.
 */
export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }

  return null;
}

/**
 * Fetches oEmbed metadata for a specific video ID.
 */
async function fetchOEmbed(videoId: string): Promise<YouTubeSearchResult | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      videoId,
      title: data.title || `YouTube Video (${videoId})`,
      channel: data.author_name || 'YouTube',
      duration: 'YouTube',
      thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    return {
      videoId,
      title: `YouTube Video (${videoId})`,
      channel: 'YouTube',
      duration: 'YouTube',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
}

/**
 * Searches YouTube for videos matching the query.
 */
export async function searchYouTube(query: string, limit: number = 20): Promise<YouTubeSearchResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  // 1. Check if user typed a direct video ID or URL
  const directId = extractYouTubeId(trimmedQuery);
  if (directId) {
    const directVideo = await fetchOEmbed(directId);
    if (directVideo) {
      return [directVideo];
    }
  }

  // 2. Check cache
  const cacheKey = trimmedQuery.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.results.slice(0, limit);
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmedQuery)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'th,en-US;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`YouTube responded with status ${response.status}`);
    }

    const html = await response.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/) || html.match(/ytInitialData\s*=\s*({.+?});/);

    if (!match || !match[1]) {
      return [];
    }

    const data = JSON.parse(match[1]);
    const items: YouTubeSearchResult[] = [];
    const seenIds = new Set<string>();

    function extractVideosRecursively(obj: any) {
      if (!obj || typeof obj !== 'object') return;

      if (obj.videoRenderer) {
        const vr = obj.videoRenderer;
        const videoId = vr.videoId;

        if (videoId && typeof videoId === 'string' && !seenIds.has(videoId)) {
          seenIds.add(videoId);

          const title =
            vr.title?.runs?.map((r: any) => r.text).join('') ||
            vr.title?.simpleText ||
            '';

          const channel =
            vr.ownerText?.runs?.map((r: any) => r.text).join('') ||
            vr.longBylineText?.runs?.map((r: any) => r.text).join('') ||
            vr.shortBylineText?.runs?.map((r: any) => r.text).join('') ||
            'YouTube';

          const duration =
            vr.lengthText?.simpleText ||
            vr.lengthText?.accessibility?.accessibilityData?.label ||
            '';

          const thumbnails = vr.thumbnail?.thumbnails || [];
          const thumbnail =
            thumbnails.length > 0
              ? thumbnails[thumbnails.length - 1].url
              : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          if (title) {
            items.push({
              videoId,
              title,
              channel,
              duration,
              thumbnail,
            });
          }
        }
      }

      for (const key of Object.keys(obj)) {
        extractVideosRecursively(obj[key]);
      }
    }

    extractVideosRecursively(data);

    // Save to cache
    if (items.length > 0) {
      if (cache.size >= MAX_CACHE_SIZE) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }
      cache.set(cacheKey, { timestamp: Date.now(), results: items });
    }

    return items.slice(0, limit);
  } catch (error) {
    console.error('Failed to search YouTube:', error);
    return [];
  }
}
