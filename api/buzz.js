export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword' });
  }

  const sites = ['x.com', 'twitter.com', 'reddit.com', 'linkedin.com', 'facebook.com'];

  try {
    const results = await Promise.all(sites.map(async (site) => {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.SERPER_KEY
        },
        body: JSON.stringify({
          q: `site:${site} ${keyword}`,
          num: 3,
          tbs: 'qdr:w'
        })
      });

      const data = await response.json();
      return {
        site,
        results: (data.organic || []).map(r => ({
          title: r.title,
          link: r.link,
          snippet: r.snippet,
          date: r.date || null
        }))
      };
    }));

    const filtered = results.filter(r => r.results.length > 0);
    return res.status(200).json({ buzz: filtered });
  } catch (err) {
    console.error('Buzz error:', err);
    return res.status(500).json({ error: 'Failed to fetch buzz' });
  }
}