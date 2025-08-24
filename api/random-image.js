export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.reddit.com/r/hmmm/random/.json", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; random-hmmm/1.0; +https://vercel.com)"
      }
    });

    if (!response.ok) {
      res.statusCode = response.status;
      res.end("Reddit request failed: " + response.status);
      return;
    }

    const data = await response.json();
    const post = data[0].data.children[0].data;
    const imageUrl = post.url_overridden_by_dest || post.url;

    if (imageUrl) {
      res.statusCode = 302;
      res.setHeader("Location", imageUrl);
      res.end();
    } else {
      res.statusCode = 404;
      res.end("No image found");
    }
  } catch (err) {
    res.statusCode = 500;
    res.end("Error: " + err.message);
  }
}
