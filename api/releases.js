/* Список релізів для сторінки. Клієнт більше не ходить у GitHub напряму:
   посилання на файли видаються вже підписаними і з обмеженим строком.
   Якщо в env з'явиться GITHUB_TOKEN, той самий код працює з приватним репо. */
import { REPO, TTL, GH_HEADERS, signedPath } from './_sign.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  let list;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=8`,
                          { headers: GH_HEADERS() });
    if (!r.ok) {
      res.status(502).json({ error: `github ${r.status}` });
      return;
    }
    list = await r.json();
  } catch (e) {
    res.status(502).json({ error: 'github unreachable' });
    return;
  }

  const exp = Math.floor(Date.now() / 1000) + TTL;

  try {
    const out = (Array.isArray(list) ? list : [])
      .filter(rel => !rel.draft)
      .map(rel => ({
        tag_name: rel.tag_name,
        draft: rel.draft,
        prerelease: rel.prerelease,
        assets: (rel.assets || []).map(a => ({
          name: a.name,
          size: a.size,
          dl: signedPath(rel.tag_name, a.name, exp)
        }))
      }));
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
