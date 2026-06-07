const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function getApiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error('TMDB_API_KEY environment variable is not set');
  }
  return key;
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { path } = req.query;
  if (!path) {
    res.status(400).json({ error: 'Missing path parameter' });
    return;
  }

  const apiKey = getApiKey();
  const tmdbUrl = new URL(`${TMDB_BASE_URL}${path}`);

  const params = { ...req.query };
  delete params.path;
  params.api_key = apiKey;

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      tmdbUrl.searchParams.set(key, value);
    }
  });

  try {
    const response = await fetch(tmdbUrl.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      res.status(response.status).json(body);
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch {
    res.status(502).json({
      status_code: 502,
      status_message: 'TMDB proxy: upstream unavailable',
    });
  }
}
