/* Спільна логіка підпису посилань. Файли в api/, що починаються з "_",
   Vercel не публікує як роути. */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const REPO = process.env.GITHUB_REPO || '3R-Tools/quick-map-releases';

/* Скільки живе посилання. 15 хвилин: вистачає почати завантаження,
   але переслати лінк у чат уже немає сенсу. */
export const TTL = Number(process.env.LINK_TTL || 900);

export const GH_HEADERS = () => {
  const h = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'quick-map-releases',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
};

function secret() {
  const s = process.env.DL_SECRET;
  if (!s) throw new Error('DL_SECRET не налаштовано');
  return s;
}

export function sign(tag, name, exp) {
  return createHmac('sha256', secret()).update(`${tag}\n${name}\n${exp}`).digest('base64url');
}

export function verify(tag, name, exp, sig) {
  const expected = Buffer.from(sign(tag, name, exp));
  const got = Buffer.from(String(sig || ''));
  return expected.length === got.length && timingSafeEqual(expected, got);
}

/* Підписаний шлях. Ім'я файла — останній сегмент, щоб браузер зберіг
   файл під правильною назвою. */
export function signedPath(tag, name, exp) {
  return `/dl/${encodeURIComponent(tag)}/${encodeURIComponent(name)}` +
         `?exp=${exp}&sig=${encodeURIComponent(sign(tag, name, exp))}`;
}
