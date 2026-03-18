export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keyword, articles } = req.body;

  if (!keyword || !articles) {
    return res.status(400).json({ error: 'Missing keyword or articles' });
  }

  const articleText = articles.map((a, i) =>
    `${i + 1}. "${a.headline}" — ${a.source} (${a.date})\n${a.snippet || ''}`
  ).join('\n\n');

  const prompt = `You are GABB, a sharp news intelligence tool. Analyze these recent articles about "${keyword}" and return a JSON object with exactly these fields:

{
  "notable": "One sentence — the single most surprising or important signal in this coverage. Be specific, not generic.",
  "sentiment": { "pos": <number>, "neu": <number>, "neg": <number> },
  "sentimentReasoning": "One or two sentences explaining exactly why you scored sentiment this way. Reference specific articles or patterns.",
  "briefing": "2-3 sentences of sharp analysis. What does this coverage actually mean? What should someone tracking this keyword pay attention to?",
  "relatedTerms": ["term1", "term2", "term3"],
  "articles": [
    { "ai": "One sentence signal note for this article. Be specific and useful." }
  ]
}

Rules:
- sentiment numbers must add up to 100
- articles array must have exactly ${articles.length} items in the same order as input
- relatedTerms should be 3 keywords worth tracking alongside "${keyword}"
- return only valid JSON, no markdown, no explanation

Articles:
${articleText}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
  console.log('Claude response:', JSON.stringify(data));
  if (!data.content || !data.content[0]) {
  console.error('Unexpected Claude response:', data);
  return res.status(500).json({ error: 'Unexpected Claude response', detail: data });
}
const text = data.content[0].text;
const clean = text.replace(/```json\n?|\n?```/g, '').trim();
const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Summarize error:', err);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
}