/** Les tables de T&C qui entrent dans la grille de TeT : chaque ligne est écrite, ou écartée avec son motif. */

import { PoolClient } from 'pg';
import type { Dossiers } from './dossiers';
import type { Ecart } from './ecarts';
import { getEmplacement, type Emplacement } from './emplacement';

export type TableDiagnostic =
  | 'demarche_emission_ges'
  | 'demarche_consommation'
  | 'demarche_polluants'
  | 'demarche_polluant_total'
  | 'demarche_enr_prod_et_conso'
  | 'demarche_sequestration_estimation';

export type LigneDiagnostic = {
  table: TableDiagnostic;
  id: number;
  precision: string;
  dossier: number;
  periode: number | null;
  annee: number | null;
  valeur: number | null;
  consommation: number | null;
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

/** Lit les six tables pour tous les dossiers, repris ou non, et décide pour chaque ligne : une valeur à écrire, ou un écart. */
export const loadTablesGrille = async (
  client: PoolClient,
  dossiers: Dossiers
) => {
  const lignes = await listLignesDiagnostic(client);
  const valeurs: Valeur[] = [];
  const ecarts: Ecart[] = [];
  for (const l of lignes) {
    const decision = decideLigne(l, dossiers);
    if ('motif' in decision) {
      ecarts.push(decision);
    } else {
      valeurs.push(decision);
    }
    const consommation = decideConsommation(l, dossiers);
    if (consommation) {
      ecarts.push(consommation);
    }
  }
  return {
    /** Les lignes lues dans T&C. */
    lignes,
    /** Les valeurs à écrire : une par ligne non vide d'un dossier repris qui a un emplacement dans la grille. */
    valeurs,
    /** Les écarts : un par autre ligne, plus un par consommation EnR non écrite. */
    ecarts,
  };
};

/** Règle : écrite, ou écartée avec le premier motif qui s'applique : celui du dossier, `valeur_vide`, puis celui de l'emplacement. */
const decideLigne = (
  l: LigneDiagnostic,
  dossiers: Dossiers
): Valeur | Ecart => {
  const ecart = (motif: string): Ecart => ({
    table: l.table,
    id: l.id,
    precision: l.precision,
    motif,
  });
  const motifDossier = dossiers.getMotifEcart(l.dossier);
  if (motifDossier !== null) {
    return ecart(motifDossier);
  }
  if (l.valeur === null) {
    return ecart('valeur_vide');
  }
  const emplacement = getEmplacement(l);
  if (typeof emplacement === 'string') {
    return ecart(emplacement);
  }
  return { ...emplacement, dossier: l.dossier, valeur: l.valeur, ligne: l };
};

/** Règle : la consommation EnR non vide d'un dossier repris est écartée à part (`consommation`) : la grille ne porte que des productions. */
const decideConsommation = (
  l: LigneDiagnostic,
  dossiers: Dossiers
): Ecart | null =>
  l.consommation !== null && dossiers.getMotifEcart(l.dossier) === null
    ? {
        table: l.table,
        id: l.id,
        precision: 'consommation',
        motif: 'sans_indicateur_cible',
      }
    : null;

/**
 * Les lignes des six tables, pour tous les dossiers.
 * Total de polluant : l'année de ses secteurs, T&C ne lui en donne pas ; estimation de la séquestration : repérée par son sol, sans numéro dans T&C.
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
      select 'demarche_emission_ges' as "table", id, '' as precision,
             demarche_id, periode_id, annee_compta as annee,
             emission_ges as valeur, null::float8 as consommation,
             secteur_obligatoire_id as secteur, null::bigint as polluant,
             null::bigint as filiere, null::bigint as sol
        from reprise_tec.staging_demarche_emission_ges
      union all
      select 'demarche_consommation', id, '', demarche_id, periode_id,
             annee_compta, consommation_energetique, null,
             secteur_obligatoire_id, null, null, null
        from reprise_tec.staging_demarche_consommation
      union all
      select 'demarche_polluants', id, '', demarche_id, periode_id,
             annee_compta, quantite_polluant, null,
             secteur_obligatoire_id, polluant_id, null, null
        from reprise_tec.staging_demarche_polluants
      union all
      select 'demarche_polluant_total', t.id, '', t.demarche_id, t.periode_id,
             a.annee, t.total_quantite_polluant, null,
             null, t.polluant_id, null, null
        from reprise_tec.staging_demarche_polluant_total t
        left join annee_des_polluants a using (demarche_id, polluant_id)
      union all
      select 'demarche_enr_prod_et_conso', id, '', demarche_id, periode_id,
             annee_compta, production_enr, consommation_enr,
             null, null, filiere_id, null
        from reprise_tec.staging_demarche_enr_prod_et_conso
      union all
      select 'demarche_sequestration_estimation', demarche_id,
             'sol ' || sol_et_foret_id, demarche_id, 1,
             annee_reference, estimation, null,
             null, null, null, sol_et_foret_id
        from reprise_tec.staging_demarche_sequestration_estimation
    )
    select "table", id::int, precision, demarche_id::int as dossier,
           periode_id::int as periode, annee::int, valeur, consommation,
           secteur::int, polluant::int, filiere::int, sol::int
      from lignes
     order by "table", dossier, id, precision`);
  return rows;
};
