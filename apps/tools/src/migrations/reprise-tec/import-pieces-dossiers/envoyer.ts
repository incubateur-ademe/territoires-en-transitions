#!/usr/bin/env tsx
/**
 * Reprise T&C, avant l'étape 2 : dépose à l'avance, dans le bucket de leur collectivité, les fichiers des dossiers que l'étape 2 reprendra et ceux de leurs actions.
 * N'écrit rien en base. Simulation par défaut (rien n'est déposé), `--confirm` pour déposer.
 *
 *   SUPABASE_DATABASE_URL=… SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-pieces-dossiers/envoyer.ts \
 *     --archive chemin/vers/Uploads --suivi chemin/vers/suivi-ademe.csv [--confirm]
 */
import { PoolClient } from 'pg';
import { getCible } from '../db';
import { loadCollectivites } from '../import-demarches/collectivites';
import { buildDossier } from '../import-demarches/dossier';
import { calculateElaborations } from '../import-demarches/elaborations';
import { loadPerimetre } from '../import-demarches/perimetre';
import { readSuiviAdeme } from '../import-demarches/suivi-ademe';
import { getArgument } from '../import-demarches/utils';
import { listCasBloquantsArchive, readContenus } from './archive';
import { TITRES } from './avis';
import type { Depot } from './bibliotheque';
import { listCasBloquantsStockage, uploadFichiers } from './stockage';

type FichierAEnvoyer = Depot['fichier'] & { collectiviteId: number };

/** Les dossiers que l'étape 2 reprendrait, avec leur collectivité. */
const loadDossiers = async (client: PoolClient, suivi: string) => {
  const suiviAdeme = readSuiviAdeme(suivi);
  const perimetre = await loadPerimetre(client);
  const collectivites = await loadCollectivites(client);
  const { retenues } = calculateElaborations(
    perimetre.retenues.map((ligne) =>
      buildDossier(ligne, collectivites.getPorteur(ligne.id), suiviAdeme)
    )
  );
  return retenues.flatMap((d) =>
    d.colonnes.collectiviteId === null
      ? []
      : [{ tecId: d.tecId, collectiviteId: d.colonnes.collectiviteId }]
  );
};

/** Les fichiers de ces dossiers (et de leur doublon « définitif »), hors avis rendus, et ceux de leurs actions. */
const loadFichiers = async (
  client: PoolClient,
  dossiers: readonly { tecId: number; collectiviteId: number }[]
) => {
  const { rows } = await client.query<FichierAEnvoyer & { table: string }>(
    `with dossiers as (
       select d.tec_id, d.collectivite_id, s.pcaet_definitif
         from unnest($1::int[], $2::int[]) as d(tec_id, collectivite_id)
         join reprise_tec.staging_demarche s on s.id = d.tec_id
     ), lignes as (
       select tec_id, collectivite_id from dossiers
       union all
       select pcaet_definitif, collectivite_id from dossiers where pcaet_definitif is not null
     ), fichiers as (
       select 'demarche_fichier' as "table", f.id, f.fichier, f.display_name, f.basename, l.collectivite_id
         from reprise_tec.staging_demarche_fichier f
         join lignes l on l.tec_id = f.demarche_id
        where f.type_fichier_id <> all($3::int[])
       union all
       select 'action_fichier', f.id, f.fichier, f.display_name, f.basename, d.collectivite_id
         from reprise_tec.staging_action_fichier f
         join reprise_tec.staging_action a on a.id = f.action_id
         join dossiers d on d.tec_id = a.demarche_id
       union all
       select 'action_image', f.id, f.fichier, f.display_name, f.basename, d.collectivite_id
         from reprise_tec.staging_action_image f
         join reprise_tec.staging_action a on a.id = f.action_id
         join dossiers d on d.tec_id = a.demarche_id
     )
     select "table", id::int as "tecId", fichier as chemin, display_name as nom,
            basename as reference, collectivite_id as "collectiviteId"
       from fichiers
      order by 1, 2`,
    [
      dossiers.map((d) => d.tecId),
      dossiers.map((d) => d.collectiviteId),
      TITRES.map((t) => t.typeFichierId),
    ]
  );
  return rows;
};

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const archive = getArgument('--archive');
  const suivi = getArgument('--suivi');
  const pool = getCible('reprise-tec-envoyer-fichiers');
  const client = await pool.connect();

  try {
    const dossiers = await loadDossiers(client, suivi);
    const fichiers = await loadFichiers(client, dossiers);

    // Les numéros T&C se répètent d'une table à l'autre : lus table par table.
    const depots: Depot[] = [];
    for (const table of [...new Set(fichiers.map((f) => f.table))]) {
      const deLaTable = fichiers.filter((f) => f.table === table);
      const contenus = await readContenus(archive, deLaTable);
      for (const f of deLaTable) {
        depots.push({
          collectiviteId: f.collectiviteId,
          fichier: f,
          contenu: contenus.get(f.tecId),
          confidentiel: false,
        });
      }
    }

    const cas = [
      ...(await listCasBloquantsArchive(archive)),
      ...(await listCasBloquantsStockage(client, depots)),
    ];
    if (cas.length > 0) {
      throw new Error(
        `L'envoi est arrêté avant tout dépôt, ${cas.length} cas :\n${cas.join('\n')}`
      );
    }

    const envoi = await uploadFichiers(client, archive, depots, isConfirmed);
    const absents = depots.filter((d) => !d.contenu).length;
    console.log(
      `${dossiers.length} dossiers, ${fichiers.length} fichiers, ${absents} absents de l'archive`
    );
    console.log(
      `Stockage : ${envoi.fichiers} fichiers ${
        isConfirmed ? 'déposés' : 'à déposer'
      }, ${(envoi.octets / 1e9).toFixed(2)} Go, ${envoi.dejaLa} déjà là`
    );
    if (!isConfirmed) {
      console.log('Simulation : rien déposé. --confirm pour déposer.');
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
