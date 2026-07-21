// Après un `strapi transfer` (make cms-pull), les lignes de la table `files`
// conservent les URLs absolues du CDN Strapi Cloud (*.media.strapiapp.com) —
// Strapi ne les réécrit jamais vers le provider local. Ce script :
//   1. télécharge chaque asset référencé (original + formats) dans
//      strapi/public/uploads/ (le provider local sert ce dossier à /uploads/…) ;
//   2. réécrit en base les URLs vers <STRAPI_LOCAL_URL>/uploads/<fichier>.
// Résultat : les médias sont servis en local, sans dépendance au CDN.
//
// URLs absolues (et non relatives /uploads/…) car le site consomme le champ
// `url` tel quel comme src d'image : une URL relative se résoudrait sur
// l'origine du site (localhost:3000) au lieu de Strapi (localhost:1337).
// STRAPI_LOCAL_URL doit donc correspondre au NEXT_PUBLIC_STRAPI_URL des apps.
//
// Idempotent : ne retélécharge pas un fichier déjà présent et ne réécrit que
// les URLs encore distantes (filtre `like 'http%strapiapp%'`).
import { execFileSync } from 'node:child_process';
import { open, rm } from 'node:fs/promises';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const uploadsDir = join(root, 'strapi', 'public', 'uploads');
const localBase = (process.env.STRAPI_LOCAL_URL || 'http://localhost:1337').replace(/\/+$/, '');

const psql = (sql: string): string =>
  execFileSync(
    'docker',
    ['compose', 'exec', '-T', 'strapi-db', 'psql', '-U', 'strapi', '-tAc', sql],
    { cwd: root, encoding: 'utf8' }
  );

// 1. Toutes les URLs distantes (CDN) : original + chaque format. On cible le
//    host Strapi Cloud, pas juste 'http%', pour rester idempotent une fois les
//    URLs devenues locales (http://localhost:1337/…).
const rows = psql(
  `select url from files where url like '%strapiapp%'
   union
   select f.value->>'url'
     from files, jsonb_each(formats) as f
     where formats is not null and f.value->>'url' like '%strapiapp%'`
);

const urls = [...new Set(rows.split('\n').map((l) => l.trim()).filter(Boolean))];
console.log(`⟐ ${urls.length} assets distants référencés en base`);

if (urls.length === 0) {
  console.log('✓ rien à localiser (URLs déjà locales ?)');
  process.exit(0);
}

// 2. Téléchargement (le nom de fichier local doit être identique au dernier
//    segment de l'URL : c'est ce que la réécriture SQL produira côté DB).
//    Les URLs viennent d'une base importée (donnée non sûre) : seul le CDN
//    Strapi Cloud est accepté comme source, et le nom de fichier est validé
//    strictement (pas de séparateur, pas de dotfile) avant d'écrire.
async function download(url: string): Promise<'ok' | 'skip'> {
  const u = new URL(url);
  if (u.protocol !== 'https:' || !u.hostname.endsWith('.strapiapp.com')) {
    throw new Error(`URL hors CDN Strapi Cloud — non téléchargée : ${url}`);
  }
  const name = decodeURIComponent(basename(u.pathname));
  if (!/^[\w][\w.-]*$/.test(name)) {
    throw new Error(`nom de fichier suspect — non téléchargé : ${name} (${url})`);
  }
  const dest = join(uploadsDir, name);
  // Défense en profondeur (le nom est déjà validé par regex ci-dessus) : on
  // exige que le chemin canonique tombe exactement sur uploadsDir/<name> et
  // reste strictement sous uploadsDir — barrière anti path traversal quel que
  // soit le contenu de la base importée.
  const resolvedDest = resolve(dest);
  if (
    resolvedDest !== resolve(uploadsDir, name) ||
    !resolvedDest.startsWith(resolve(uploadsDir) + sep)
  ) {
    throw new Error(
      `chemin hors du dossier uploads — non téléchargé : ${name} (${url})`
    );
  }
  // Création exclusive ('wx') : un fichier déjà présent = déjà téléchargé,
  // sans fenêtre entre le test d'existence et l'écriture.
  let fh: import('node:fs/promises').FileHandle | undefined;
  try {
    fh = await open(dest, 'wx');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') return 'skip';
    throw e;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
    await fh.writeFile(Buffer.from(await res.arrayBuffer()));
  } catch (e) {
    await fh.close().catch(() => {});
    // pas de fichier vide orphelin : il passerait pour un asset déjà présent
    await rm(dest, { force: true }).catch(() => {});
    throw e;
  }
  await fh.close();
  return 'ok';
}

async function runPool<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  size = 8
): Promise<Array<R | Error>> {
  const results: Array<R | Error> = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        try {
          results[i] = await worker(items[i]);
        } catch (e) {
          results[i] = e as Error;
        }
      }
    })
  );
  return results;
}

const results: Array<'ok' | 'skip' | Error> = await runPool(urls, download);
const ok = results.filter((r) => r === 'ok').length;
const skip = results.filter((r) => r === 'skip').length;
const errors = results.filter((r) => r instanceof Error);
console.log(`⟐ téléchargés : ${ok} · déjà présents : ${skip} · échecs : ${errors.length}`);
for (const e of errors) console.error(`  ✗ ${e.message}`);
if (errors.length > 0) {
  console.error('✗ des assets sont manquants — URLs non réécrites (relancez après correction)');
  process.exit(1);
}

// 3. Bascule des URLs vers le provider local : on remplace le préfixe
//    scheme://hôte-CDN/ par <STRAPI_LOCAL_URL>/uploads/, en gardant le nom de
//    fichier (identique au fichier téléchargé à l'étape 2).
psql(
  `update files set url = regexp_replace(url, '^https?://[^/]+/', '${localBase}/uploads/')
   where url like '%strapiapp%'`
);
psql(
  `update files set formats = regexp_replace(formats::text, 'https?://[^/]+/', '${localBase}/uploads/', 'g')::jsonb
   where formats::text like '%strapiapp%'`
);
console.log(`✓ URLs basculées sur ${localBase}/uploads/ — médias servis en local`);
