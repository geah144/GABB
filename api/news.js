export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword' });
  }

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(keyword)}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${process.env.NEWSAPI_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'ok') {
      return res.status(500).json({ error: data.message || 'NewsAPI error' });
    }

    const articles = data.articles.map(a => ({
      headline: a.title,
      source: a.source.name,
      date: new Date(a.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      snippet: a.description || '',
      url: a.url
    }));

    return res.status(200).json({ articles, totalResults: data.totalResults });
  } catch (err) {
    console.error('News error:', err);
    return res.status(500).json({ error: 'Failed to fetch news' });
  }
}