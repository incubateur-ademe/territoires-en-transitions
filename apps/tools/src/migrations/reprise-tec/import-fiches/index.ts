#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 5 : écrit les actions des dossiers repris en fiches, dans un plan par dossier.
 * Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-fiches/index.ts [--confirm]
 */
import { getCible } from '../db';
import { loadDossiers } from './dossiers';
import { createFiches } from './ecriture';
import { buildFiche } from './fiches';
import { createPlans } from './plans';
import { loadListesTet } from './listes-tet';
import { createTags, type Tags } from './tags';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-import-fiches');
  const client = await pool.connect();

  try {
    const dossiers = await loadDossiers(client);
    const listesTet = await loadListesTet(client);
    const fiches = dossiers.flatMap((d) =>
      d.actions.map((a) => buildFiche(a, d, listesTet))
    );

    await client.query('begin');
    let tags: Tags;
    try {
      const planIds = await createPlans(client, dossiers, listesTet.typePlanId);
      tags = await createTags(client, fiches);
      const ecrites = await createFiches(client, fiches, planIds, tags);
      if (ecrites !== fiches.length) {
        throw new Error(
          `${fiches.length} fiches calculées, ${ecrites} écrites : rien n'est validé.`
        );
      }
      await client.query(isConfirmed ? 'commit' : 'rollback');
    } catch (e) {
      await client.query('rollback');
      throw e;
    }

    const { structure_tag, libre_tag } = tags.comptes;
    console.log(`${dossiers.length} plans, ${fiches.length} fiches`);
    console.log(`${fiches.flatMap((f) => f.notes).length} notes`);
    console.log(
      `Structures pilotes : ${structure_tag.reutilises} réutilisées, ${structure_tag.crees} créées`
    );
    console.log(
      `Tags personnalisés : ${libre_tag.reutilises} réutilisés, ${libre_tag.crees} créés`
    );
    console.log(
      isConfirmed
        ? 'Import terminé.'
        : 'Simulation : tout a été annulé. Relancer avec --confirm pour importer.'
    );
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
