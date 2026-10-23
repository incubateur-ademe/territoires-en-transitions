/** Les tables de T&C qui n'entrent jamais dans la grille de TeT : lues pour être comptées, toutes écartées avec leur motif. */

import { PoolClient } from 'pg';
import type { Dossiers } from './dossiers';
import type { CleLigne, Ecart } from './ecarts';

type LigneHorsGrille = CleLigne & {
  dossier: number;
  vide: boolean;
  motif: string;
};

/** Les cinq commentaires d'onglet d'un dossier T&C : TeT ne commente qu'une valeur, jamais un onglet. */
const COMMENTAIRES = [
  'commentaire_ges_et_conso',
  'commentaire_sequestration',
  'commentaire_enr',
  'commentaire_vulnerabilite',
  'commentaire_polluants',
];

/** Lit les tables sans place dans la grille et les commentaires d'onglet des dossiers repris ; rend leurs écarts. */
export const loadTablesHorsGrille = async (
  client: PoolClient,
  dossiers: Dossiers
) => {
  const lignes = await listLignesHorsGrille(client);
  const commentaires = await listCommentaires(client);
  return {
    /** Les lignes lues dans T&C, sans les commentaires (ce sont des parties de la ligne du dossier). */
    lignes,
    /** Un écart par ligne, plus un par commentaire non vide d'un dossier repris. */
    ecarts: [
      ...lignes.map((l) => decideLigne(l, dossiers)),
      ...commentaires.filter((c) => dossiers.getMotifEcart(c.id) === null),
    ],
  };
};

/** Règle : le motif du dossier s'il n'est pas repris, sinon `valeur_vide` si la ligne est vide, sinon celui de sa table. */
const decideLigne = (l: LigneHorsGrille, dossiers: Dossiers): Ecart => ({
  table: l.table,
  id: l.id,
  precision: l.precision,
  motif:
    dossiers.getMotifEcart(l.dossier) ?? (l.vide ? 'valeur_vide' : l.motif),
});

/**
 * Les lignes des cinq tables sans place, pour tous les dossiers.
 * Les trois tables sans numéro dans T&C sont repérées par leur période, leur sol ou leur cible (« sol 2 »).
 */
const listLignesHorsGrille = async (
  client: PoolClient
): Promise<LigneHorsGrille[]> => {
  const { rows } = await client.query<LigneHorsGrille>(`
    select 'demarche_enr' as "table", demarche_id::int as id,
           'periode ' || periode_id as precision, demarche_id::int as dossier,
           (valorisation_potentiel_recuperation is null
            and valorisation_potentiel_stockage is null) as vide,
           'sans_indicateur_cible' as motif
      from reprise_tec.staging_demarche_enr
    union all
    select 'demarche_sequestration_potentiel', demarche_id::int,
           'sol ' || sol_et_foret_id, demarche_id::int,
           potentiel_developpement is null,
           'sans_indicateur_cible'
      from reprise_tec.staging_demarche_sequestration_potentiel
    union all
    select 'demarche_sequestration_renforcement', demarche_id::int,
           'cible ' || cible_id, demarche_id::int,
           nullif(trim(objectif), '') is null,
           'sans_indicateur_cible'
      from reprise_tec.staging_demarche_sequestration_renforcement
    union all
    select 'demarche_sequestration_production', id::int, '', demarche_id::int,
           nullif(trim(libelle), '') is null and nullif(trim(objectif), '') is null,
           'sans_indicateur_cible'
      from reprise_tec.staging_demarche_sequestration_production
    union all
    select 'demarche_enr_reseaux', id::int, '', demarche_id::int,
           nullif(trim(evolution_reseaux_energetiques), '') is null
           and nullif(trim(livraison_reseaux_chaleur), '') is null,
           'commentaire_sans_place'
      from reprise_tec.staging_demarche_enr_reseaux
    order by 1, 2, 3`);
  return rows;
};

/** Les commentaires d'onglet non vides de chaque dossier T&C, un écart chacun (precision : le nom de la colonne). */
const listCommentaires = async (client: PoolClient): Promise<Ecart[]> => {
  const { rows } = await client.query<Ecart>(
    `select 'demarche' as "table", d.id::int as id, c.colonne as precision,
            'commentaire_sans_place' as motif
       from reprise_tec.staging_demarche d
      cross join lateral (
        select key as colonne, value as texte
          from jsonb_each_text(to_jsonb(d))
         where key = any($1)
      ) c
      where nullif(trim(c.texte), '') is not null
      order by d.id, c.colonne`,
    [COMMENTAIRES]
  );
  return rows;
};
