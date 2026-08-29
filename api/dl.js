/* Видача файла за підписаним посиланням: перевіряємо строк і HMAC,
   далі віддаємо 302 — байти через функцію не течуть.
   Публічне репо: редірект на github.com/.../releases/download/...
   Приватне репо: досить задати GITHUB_TOKEN — тоді підписаний URL
   на короткий строк видає сам GitHub API, і прямого лінка більше немає. */
import { REPO, GH_HEADERS, verify } from './_sign.js';

function fail(res, code, message) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(code).send(
    `<!doctype html><meta charset="utf-8"><title>Quick Map</title>` +
    `<body style="font:16px/1.6 system-ui;margin:15vh auto;max-width:34rem;padding:0 1.5rem;text-align:center">` +
    `<p>${message}</p><p><a href="/">На сторінку завантажень</a></p>`
  );
}

export default async function handler(req, res) {
  const { tag, name, exp, sig } = req.query;

  if (!tag || !name || !exp || !sig) return fail(res, 400, 'Некоректне посилання.');

  if (!/^\d+$/.test(String(exp)) || Number(exp) * 1000 < Date.now()) {
    return fail(res, 410, 'Посилання застаріло. Оновіть сторінку і натисніть «Завантажити» ще раз.');
  }

  let ok;
  try {
    ok = verify(tag, name, exp, sig);
  } catch (e) {
    return fail(res, 500, 'Сервер не налаштовано: відсутній DL_SECRET.');
  }
  if (!ok) return fail(res, 403, 'Посилання недійсне.');

  res.setHeader('Cache-Control', 'no-store');

  if (!process.env.GITHUB_TOKEN) {
    res.redirect(302,
      `https://github.com/${REPO}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`);
    return;
  }

  try {
    const relRes = await fetch(
      `https://api.github.com/repos/${REPO}/releases/tags/${encodeURIComponent(tag)}`,
      { headers: GH_HEADERS() });
    if (!relRes.ok) return fail(res, 502, 'Не вдалось отримати реліз із GitHub.');

    const asset = ((await relRes.json()).assets || []).find(a => a.name === name);
    if (!asset) return fail(res, 404, 'Файл не знайдено в релізі.');

    /* Accept: octet-stream змушує API віддати 302 на підписаний S3-URL. */
    const dlRes = await fetch(asset.url, {
      headers: { ...GH_HEADERS(), Accept: 'application/octet-stream' },
      redirect: 'manual'
    });
    const location = dlRes.headers.get('location');
    if (!location) return fail(res, 502, 'GitHub не повернув посилання на файл.');

    res.redirect(302, location);
  } catch (e) {
    fail(res, 502, 'GitHub недоступний.');
  }
}
