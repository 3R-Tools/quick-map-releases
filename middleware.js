/* Пароль на всю сторінку. Виконується на едж-рівні ДО віддачі статики,
   тому index.html не потрапляє до браузера без авторизації.
   Пароль лежить в environment variables проєкту, у клієнт не потрапляє. */
import { next } from '@vercel/functions';

const REALM = 'Quick Map';

/* Порівняння без ранньої зупинки — щоб час відповіді не підказував,
   скільки перших символів пароля вгадано. */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* atob повертає байти як «символи», тож кирилицю в паролі треба декодувати вручну. */
function decodeBasic(header) {
  try {
    const bin = atob(header.slice(6).trim());
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function challenge(message) {
  return new Response(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export default function middleware(request) {
  const password = process.env.SITE_PASSWORD;

  /* Fail closed: без налаштованого пароля сторінка не відкривається взагалі,
     інакше перший деплой мовчки виявився б публічним. */
  if (!password) {
    return new Response('SITE_PASSWORD не налаштовано в environment variables проєкту.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  const header = request.headers.get('authorization') || '';
  if (!header.toLowerCase().startsWith('basic ')) return challenge('Потрібна авторизація');

  const creds = decodeBasic(header);
  if (creds === null) return challenge('Потрібна авторизація');

  const sep = creds.indexOf(':');
  const user = sep === -1 ? '' : creds.slice(0, sep);
  const pass = sep === -1 ? '' : creds.slice(sep + 1);

  const expectedUser = process.env.SITE_USER || 'quickmap';
  if (!safeEqual(user, expectedUser) || !safeEqual(pass, password)) {
    return challenge('Невірний логін або пароль');
  }

  return next();
}
