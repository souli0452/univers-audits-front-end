import { lancer, connecter, photo } from './capture.mjs';
const nav = await lancer();
try {
    const page = await connecter(nav, 'ADMIN_DDIC');
    await photo(page, 'essai-tableau-de-bord');
} finally { await nav.close(); }
