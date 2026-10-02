#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 5 : écrit les actions des dossiers repris en fiches, dans un plan par dossier.
 * Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-fiches/index.ts [--confirm]
 */
import { getCible } from '../db';
import { listDefinitifsAvecPlusDActions, loadDossiers } from './dossiers';
import { createEcarts, loadEcarts, validateBilan } from './ecarts';
import { createFiches } from './ecriture';
import { buildFiche } from './fiches';
import { validateGardes } from './gardes';
import { createPlans } from './plans';
import { printRapport } from './rapport';
import { loadListesTet } from './listes-tet';
import { createTags, type Tags } from './tags';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-import-fiches');
  const client = await pool.connect();

  try {
    const dossiers = await loadDossiers(client);
    const listesTet = await loadListesTet(client);
    await validateGardes(client, dossiers, listesTet);
    const fiches = dossiers.flatMap((d) =>
      d.actions.map((a) => buildFiche(a, d, listesTet))
    );
    const { lues, ecrites, ecarts } = await loadEcarts(client);
    const definitifsAvecPlusDActions = await listDefinitifsAvecPlusDActions(
      client,
      dossiers
    );
    const bilan = validateBilan(
      lues,
      [
        ...fiches.map((f) => ({ table: 'action', id: f.tecId, precision: '' })),
        ...ecrites,
      ],
      ecarts
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
      await createEcarts(client, ecarts);
      await client.query(isConfirmed ? 'commit' : 'rollback');
    } catch (e) {
      await client.query('rollback');
      throw e;
    }

    printRapport({
      bilan,
      ecarts,
      dossiers,
      fiches,
      listesTet,
      tags: tags.comptes,
      definitifsAvecPlusDActions,
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
