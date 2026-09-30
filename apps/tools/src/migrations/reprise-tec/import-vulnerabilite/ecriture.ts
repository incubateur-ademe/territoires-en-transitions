/** Les valeurs écrites : une ligne de `demarche_pcaet_vulnerabilite_valeur` par démarche et par thématique, jamais vide. */

import { PoolClient } from 'pg';
import type { Valeur } from './fusion';

/**
 * Écrit le niveau d'aujourd'hui et les objectifs 2050, sans auteur ; 2050, 2100 et objectifs 2100 restent vides.
 * La table n'a pas d'id : la trace note la démarche.
 */
export const createValeurs = async (
  client: PoolClient,
  valeurs: readonly Valeur[],
  getThematiqueId: (valeur: Valeur) => number
) => {
  const aEcrire = valeurs.filter((v) => v.aEcrire);
  const { rows } = await client.query<{ lignes: number; demarches: number }>(
    `with ecrites as (
       insert into public.demarche_pcaet_vulnerabilite_valeur
         (demarche_id, thematique_id, niveau_maintenant, objectifs_2050, created_by, modified_by)
       select demarche_id, thematique_id, niveau, objectifs, null, null
         from unnest($1::int[], $2::int[], $3::text[], $4::text[])
                as v(demarche_id, thematique_id, niveau, objectifs)
       returning demarche_id
     ), trace as (
       insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
       select distinct 'demarche_pcaet_vulnerabilite_valeur', demarche_id from ecrites
     )
     select count(*)::int as lignes, count(distinct demarche_id)::int as demarches
       from ecrites`,
    [
      aEcrire.map((v) => v.demarcheId),
      aEcrire.map(getThematiqueId),
      aEcrire.map((v) => v.niveau),
      aEcrire.map((v) => v.objectifs),
    ]
  );
  return rows[0];
};
