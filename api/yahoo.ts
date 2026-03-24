import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract the path after /api/yahoo
  const { path } = req.query;
  const subPath = Array.isArray(path) ? path.join('/') : path ?? '';

  if (!subPath) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const targetUrl = `https://query1.finance.yahoo.com/${subPath}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    const data = await response.json();

    // Cache stock data for 60 seconds
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(response.status).json(data);
  } catch {
    return res.status(502).json({ error: 'Failed to fetch from Yahoo Finance' });
  }
}
