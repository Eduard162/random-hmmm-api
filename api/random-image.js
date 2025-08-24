// /api/random-image.js
// Serverless function for Vercel that redirects to a random image from r/hmmm

export default async function handler(req, res) {
  try {
    // Ask Reddit for a random post in r/hmmm (no keys needed)
    const response = await fetch("https://www.reddit.com/r/hmmm/random/.json", {
      headers: {
        "User-Agent": "random-hmmm-image/1.0 (Vercel serverless)"
      }
    });

    if (!response.ok) {
      res.statusCode = 502;
      res.end("Reddit request failed: " + response.status);
      return;
    }

    const data = await response.json();
    const posts = Array.isArray(data) ? data.flatMap(a => a?.data?.children ?? []) : [];
    const items = posts.map(p => p?.data).filter(Boolean);

    // Utilities
    const htmlDecode = (u) => (u ? u.replace(/&amp;/g, "&") : u);
    const isImageUrl = (u) => {
      if (!u) return false;
      const lower = u.toLowerCase();
      return (
        /\.(jpg|jpeg|png|gif|webp)$/.test(lower) ||
        lower.includes("i.redd.it")
      );
    };

    // Try to extract an image URL from different post shapes
    const fromGallery = (post) => {
      const meta = post?.media_metadata;
      const gallery = post?.gallery_data?.items;
      if (!meta || !gallery) return null;
      for (const it of gallery) {
        const m = meta[it.media_id];
        const url = htmlDecode(m?.s?.u || m?.s?.gif);
        if (isImageUrl(url)) return url;
      }
      return null;
    };

    const fromPreview = (post) => {
      const url = htmlDecode(post?.preview?.images?.[0]?.source?.url);
      return isImageUrl(url) ? url : null;
    };

    const pickUrl = (post) =>
      fromGallery(post) ||
      (isImageUrl(post?.url_overridden_by_dest) ? post.url_overridden_by_dest : null) ||
      (isImageUrl(post?.url) ? post.url : null) ||
      fromPreview(post);

    // Shuffle the items for extra randomness
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    // Find the first post that yields a usable image URL
    for (const post of items) {
      const url = pickUrl(post);
      if (url) {
        // Send a 302 redirect to the actual image URL
        res.statusCode = 302;
        res.setHeader("Location", htmlDecode(url));
        res.end();
        return;
      }
    }

    res.statusCode = 404;
    res.end("No image found in r/hmmm response.");
  } catch (err) {
    res.statusCode = 500;
    res.end("Error fetching from Reddit: " + err.message);
  }
}
