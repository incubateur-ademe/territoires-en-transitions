#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 6 : écrit sur les fiches reprises les pièces, les images (sans leur fichier) et les « site web » de leurs actions.
 * Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-pieces-fiches/index.ts [--confirm]
 */
import { getCible } from '../db';
import { createFichiers, type Bibliotheque } from './bibliotheque';
import { createAnnexes, keepModifieLe } from './ecriture';
import { validateGardes } from './gardes';
import { loadPieces } from './pieces';
import { printRapport } from './rapport';
import { buildUrlsSiteWeb } from './url-site-web';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-import-pieces-fiches');
  const client = await pool.connect();

  try {
    const pieces = await loadPieces(client);
    const { fichiers } = pieces;
    await validateGardes(client, fichiers);
    const urlsSiteWeb = buildUrlsSiteWeb(pieces.urlsSiteWeb);
    const ficheIds = [...fichiers, ...urlsSiteWeb.valides].map(
      (p) => p.ficheId
    );

    await client.query('begin');
    let bibliotheque: Bibliotheque;
    try {
      bibliotheque = await createFichiers(client, fichiers);
      await keepModifieLe(client, ficheIds, () =>
        createAnnexes(client, fichiers, urlsSiteWeb.valides, bibliotheque)
      );
      await client.query(isConfirmed ? 'commit' : 'rollback');
    } catch (e) {
      await client.query('rollback');
      throw e;
    }

    printRapport({
      fichiers,
      urlsSiteWeb,
      bibliotheque: bibliotheque.comptes,
      isConfirmed,
    });
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
