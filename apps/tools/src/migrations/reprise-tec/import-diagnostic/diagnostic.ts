/** Le diagnostic de T&C : les lignes lues pour les dossiers repris, et la valeur que chacune donne dans TeT. */

import { PoolClient } from 'pg';
import { getEmplacement, type Emplacement } from './grille';

export type TableDiagnostic =
  | 'demarche_emission_ges'
  | 'demarche_consommation'
  | 'demarche_polluants'
  | 'demarche_polluant_total'
  | 'demarche_enr_prod_et_conso'
  | 'demarche_sequestration_estimation';

export type LigneDiagnostic = {
  table: TableDiagnostic;
  id: number | null;
  dossier: number;
  periode: number | null;
  annee: number | null;
  valeur: number | null;
  secteur: number | null;
  polluant: number | null;
  filiere: number | null;
  sol: number | null;
};

export type Valeur = Emplacement & {
  dossier: number;
  valeur: number;
  ligne: LigneDiagnostic;
};

/** Lit le diagnostic des dossiers repris et en tire les valeurs à écrire. */
export const loadDiagnostic = async (client: PoolClient) => {
  const lignes = await listLignesDiagnostic(client);
  return {
    /** Les lignes lues dans T&C. */
    lignes,
    /** Les valeurs à écrire : une par ligne non vide qui a un emplacement dans la grille. */
    valeurs: lignes.flatMap((l) => {
      const valeur = buildValeur(l);
      return valeur ? [valeur] : [];
    }),
  };
};

/** Règle : la valeur d'une ligne de T&C ; aucune si la case est vide ou sans emplacement dans la grille. */
const buildValeur = (l: LigneDiagnostic): Valeur | null => {
  const emplacement = getEmplacement(l);
  if (l.valeur === null || emplacement === null) {
    return null;
  }
  return { ...emplacement, dossier: l.dossier, valeur: l.valeur, ligne: l };
};

/**
 * Les lignes des six tables, pour les seuls dossiers repris.
 * EnR : la production seule, la grille n'a pas de consommation. Total de polluant : l'année de ses secteurs, T&C ne lui en donne pas.
 */
const listLignesDiagnostic = async (
  client: PoolClient
): Promise<LigneDiagnostic[]> => {
  const { rows } = await client.query<LigneDiagnostic>(`
    with annee_des_polluants as (
      select demarche_id, polluant_id, min(annee_compta) as annee
        from reprise_tec.staging_demarche_polluants
       where periode_id = 1
       group by demarche_id, polluant_id
      having count(distinct annee_compta) = 1
    ), lignes as (
      select 'demarche_emission_ges' as "table", id, demarche_id, periode_id,
             annee_compta as annee, emission_ges as valeur,
             secteur_obligatoire_id as secteur, null::bigint as polluant,
             null::bigint as filiere, null::bigint as sol
        from reprise_tec.staging_demarche_emission_ges
      union all
      select 'demarche_consommation', id, demarche_id, periode_id,
             annee_compta, consommation_energetique,
             secteur_obligatoire_id, null, null, null
        from reprise_tec.staging_demarche_consommation
      union all
      select 'demarche_polluants', id, demarche_id, periode_id,
             annee_compta, quantite_polluant,
             secteur_obligatoire_id, polluant_id, null, null
        from reprise_tec.staging_demarche_polluants
      union all
      select 'demarche_polluant_total', t.id, t.demarche_id, t.periode_id,
             a.annee, t.total_quantite_polluant,
             null, t.polluant_id, null, null
        from reprise_tec.staging_demarche_polluant_total t
        left join annee_des_polluants a using (demarche_id, polluant_id)
      union all
      select 'demarche_enr_prod_et_conso', id, demarche_id, periode_id,
             annee_compta, production_enr,
             null, null, filiere_id, null
        from reprise_tec.staging_demarche_enr_prod_et_conso
      union all
      select 'demarche_sequestration_estimation', null, demarche_id, 1,
             annee_reference, estimation,
             null, null, null, sol_et_foret_id
        from reprise_tec.staging_demarche_sequestration_estimation
    )
    select "table", id::int, demarche_id::int as dossier,
           periode_id::int as periode, annee::int, valeur,
           secteur::int, polluant::int, filiere::int, sol::int
      from lignes
     where demarche_id in (select tec_id from reprise_tec.correspondance
                            where table_cible = 'demarche')
     order by "table", dossier, id`);
  return rows;
};
