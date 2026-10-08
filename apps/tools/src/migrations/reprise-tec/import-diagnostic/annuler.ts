#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 3 : retire de TeT le diagnostic que `index.ts` a écrit, et
 * seulement lui, étiquette par étiquette. Simulation par défaut, `--confirm`
 * pour valider. Aucune tranche ne dépend de celle-ci : pas de garde.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-diagnostic/annuler.ts [--confirm]
 */

import { PoolClient } from 'pg';
import { getCible } from '../db';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-annuler-diagnostic');
  const client = await pool.connect();

  try {
    await client.query('begin');
    try {
      const retires = await deleteDiagnostics(client);
      await client.query(isConfirmed ? 'commit' : 'rollback');

      console.log(
        `${retires.valeurs} valeurs retirées, dont les totaux calculés dans les dossiers`
      );
      console.log(
        `${retires.metadonnees} métadonnées retirées, avec leur lien au dossier`
      );
      console.log(`${retires.ecarts} écarts retirés`);
      console.log(
        '\nNon annulable : les totaux que le recalcul a refaits sur les autres sources des collectivités touchées.'
      );
      console.log(
        isConfirmed
          ? '\nAnnulation terminée.'
          : '\nSimulation : tout a été annulé. Relancer avec --confirm pour annuler.'
      );
    } catch (e) {
      await client.query('rollback');
      throw e;
    }
  } finally {
    client.release();
    await pool.end();
  }
};

/** Retire les valeurs des étiquettes de l'import (totaux recalculés compris), les étiquettes (liens en cascade), les traces et les écarts de la tranche. */
const deleteDiagnostics = async (client: PoolClient) => {
  const metadonnees = `select tet_id from reprise_tec.correspondance
                        where table_cible = 'indicateur_source_metadonnee'`;

  const valeurs = await client.query(
    `delete from public.indicateur_valeur where metadonnee_id in (${metadonnees})`
  );
  const supprimees = await client.query(
    `delete from public.indicateur_source_metadonnee where id in (${metadonnees})`
  );
  await client.query(
    `delete from reprise_tec.lignes_ecrites
      where table_cible in ('indicateur_source_metadonnee',
                            'demarche_pcaet_source_metadonnee',
                            'indicateur_valeur')`
  );
  await client.query(
    `delete from reprise_tec.correspondance
      where table_cible = 'indicateur_source_metadonnee'`
  );
  // Les écarts de la tranche 2 visent des dossiers entiers : `demarche`, sans précision.
  const ecarts = await client.query(
    `delete from reprise_tec.ecarts
      where table_source <> 'demarche' or motif in ('commentaire_sans_place', 'total_melange')`
  );

  return {
    valeurs: valeurs.rowCount ?? 0,
    metadonnees: supprimees.rowCount ?? 0,
    ecarts: ecarts.rowCount ?? 0,
  };
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
