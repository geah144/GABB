export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keyword, days = '7' } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword' });
  }

  try {
    const daysNum = parseInt(days);
    const now = new Date();
    const fromDate = new Date(now - daysNum * 24 * 60 * 60 * 1000).toISOString();
    const prevFromDate = new Date(now - daysNum * 2 * 24 * 60 * 60 * 1000).toISOString();

    // Current period
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(keyword)}&from=${fromDate}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${process.env.NEWSAPI_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'ok') {
      return res.status(500).json({ error: data.message || 'NewsAPI error' });
    }

    // Previous period for comparison
    const prevUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(keyword)}&from=${prevFromDate}&to=${fromDate}&sortBy=publishedAt&pageSize=1&language=en&apiKey=${process.env.NEWSAPI_KEY}`;
    const prevResponse = await fetch(prevUrl);
    const prevData = await prevResponse.json();

    const currentTotal = data.totalResults || 0;
    const prevTotal = prevData.totalResults || 0;
    const change = currentTotal - prevTotal;
    const changeStr = change > 0 ? `+${change}` : `${change}`;

    const articles = data.articles.map(a => ({
      headline: a.title,
      source: a.source.name,
      date: new Date(a.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      snippet: a.description || '',
      url: a.url
    }));

    const uniqueSources = new Set(articles.map(a => a.source)).size;
    const spikeAlert = change > 20;

    return res.status(200).json({
      articles,
      totalResults: currentTotal,
      stats: {
        mentions: currentTotal,
        change: changeStr,
        sources: uniqueSources,
        alert: spikeAlert
      }
    });

  } catch (err) {
    console.