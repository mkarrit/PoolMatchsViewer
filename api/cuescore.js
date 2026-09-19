/**
 * Proxy serverless CueScore (Vercel).
 *
 * CueScore ne renvoie aucun header CORS : un appel direct depuis le navigateur
 * est bloqué. On relaie donc la requête côté serveur, ce qui évite de dépendre
 * d'un proxy CORS public (codetabs / cors-anywhere, tous deux hors service).
 *
 * GET /api/cuescore?tableCode=XXXXXXXX
 */

const CUESCORE_SCOREBOARD_URL = 'https://cuescore.com/ajax/scoreboard-v2/';
const UPSTREAM_TIMEOUT_MS = 10000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const tableCode = typeof req.query?.tableCode === 'string' ? req.query.tableCode.trim() : '';

  // Le code table CueScore est alphanumérique : on filtre pour ne pas relayer
  // n'importe quoi vers l'upstream.
  if (!/^[A-Za-z0-9]{1,32}$/.test(tableCode)) {
    return res.status(400).json({ error: 'NOCODE' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(
      `${CUESCORE_SCOREBOARD_URL}?tableCode=${encodeURIComponent(tableCode)}`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    );

    const body = await upstream.text();

    if (!upstream.ok) {
      return res.status(502).json({ error: 'UPSTREAM_ERROR', status: upstream.status });
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      return res.status(502).json({ error: 'INVALID_JSON' });
    }

    // Cache edge très court : il mutualise les appels quand plusieurs écrans
    // suivent la même table, sans ajouter plus de 2 s à la latence perçue.
    // Pas de stale-while-revalidate ici : servir une version périmée
    // afficherait un score en retard, précisément ce qu'on veut éviter.
    res.setHeader('Cache-Control', 's-maxage=2');
    return res.status(200).json(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'TIMEOUT' });
    }
    return res.status(502).json({ error: 'NETWORK_ERROR', message: error.message });
  } finally {
    clearTimeout(timeoutId);
  }
}
