/* Останній реліз сервера Quick Map для блока «Сервер» на сторінці.
   Сервер живе в окремому публічному репозиторії (щоб автооновлення застосунку
   не сприймало його за нову версію клієнта), тому файли віддаються прямими
   посиланнями GitHub, без підпису. */
import { GH_HEADERS } from './_sign.js';

const SERVER_REPO = process.env.SERVER_REPO || '3R-Tools/quick-map-server-releases';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const r = await fetch(`https://api.github.com/repos/${SERVER_REPO}/releases/latest`,
                          { headers: GH_HEADERS() });
    if (!r.ok) {
      res.status(502).json({ error: `github ${r.status}` });
      return;
    }
    const rel = await r.json();
    res.status(200).json({
      repo: SERVER_REPO,
      tag_name: rel.tag_name,
      html_url: rel.html_url,
      assets: (rel.assets || []).map(a => ({
        name: a.name,
        size: a.size,
        url: a.browser_download_url
      }))
    });
  } catch (e) {
    res.status(502).json({ error: 'github unreachable' });
  }
}
