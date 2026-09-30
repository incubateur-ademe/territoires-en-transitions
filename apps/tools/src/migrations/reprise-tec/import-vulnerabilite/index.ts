#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 8 : le volet Vulnérabilité de chaque dossier repris, thématique par thématique, et la thématique
 * « Déchets » de la collectivité quand elle a un contenu.
 * Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-vulnerabilite/index.ts [--confirm]
 */
import { getCible } from '../db';
import { createValeurs } from './ecriture';
import { mergeLignes } from './fusion';
import { loadLignes } from './lignes';
import { printRapport } from './rapport';
import {
  createThematiquesDechets,
  listCollectivitesAvecDechets,
  loadThematiquesDuSocle,
} from './thematiques';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-import-vulnerabilite');
  const client = await pool.connect();

  try {
    const lignes = await loadLignes(client);
    const valeurs = mergeLignes(lignes);
    const socle = await loadThematiquesDuSocle(client);

    await client.query('begin');
    try {
      const dechets = await createThematiquesDechets(
        client,
        listCollectivitesAvecDechets(valeurs)
      );
      const ecrites = await createValeurs(client, valeurs, (v) => {
        const id =
          'code' in v.thematique
            ? socle.get(v.thematique.code)
            : dechets.getId(v.collectiviteId, v.thematique.label);
        if (id === undefined) {
          throw new Error(
            `Thématique ${JSON.stringify(v.thematique)} introuvable (démarche ${
              v.demarcheId
            }).`
          );
        }
        return id;
      });
      await client.query(isConfirmed ? 'commit' : 'rollback');

      printRapport({ lignes, valeurs, ecrites, dechets, isConfirmed });
    } catch (e) {
      await client.query('rollback');
      throw e;
    }
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
