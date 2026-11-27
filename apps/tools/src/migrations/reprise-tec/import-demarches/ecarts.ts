/** Les écarts : ce qui n'est pas repris, et la preuve que rien ne se perd. */

import { PoolClient } from 'pg';
import type { Dossier } from './dossier';
import type { Motif } from './perimetre';

export type Ecart = {
  id: number;
  motif: Motif | 'elaboration_remplacee' | 'elaboration_doublon';
};

/**
 * Vérifie, avant toute écriture, que chaque ligne lue dans T&C finit soit
 * écrite, soit écartée avec un motif, et une seule fois ; arrête l'import sinon.
 */
export const validateBilan = (
  lues: number,
  dossiersAImporter: readonly Dossier[],
  ecarts: readonly Ecart[]
) => {
  const ids = [
    ...dossiersAImporter.map((d) => d.tecId),
    ...ecarts.map((e) => e.id),
  ];
  if (ids.length !== lues || new Set(ids).size !== lues) {
    throw new Error(
      `Bilan faux, l'import est arrêté avant toute écriture : ${lues} lignes lues, ` +
        `${dossiersAImporter.length} à écrire et ${ecarts.length} écartées.`
    );
  }
};

/** Une partie d'un dossier écrit qui n'a pas de place dans TeT. */
export type PartieEcartee = {
  id: number;
  precision: 'population_couverte' | 'commentaire_statut';
  motif: 'sans_place';
};

/** Les parties sans place des dossiers écrits : la population couverte et le commentaire de statut, quand T&C les a. */
export const listPartiesEcartees = async (
  client: PoolClient,
  dossiersAImporter: readonly Dossier[]
): Promise<PartieEcartee[]> => {
  const { rows } = await client.query<{
    id: number;
    precision: PartieEcartee['precision'];
  }>(
    `select d.id::int, p.precision
       from reprise_tec.staging_demarche d
       cross join lateral (values
         ('population_couverte', coalesce(d.population_couverte, 0) > 0),
         ('commentaire_statut', nullif(trim(d.commentaire_statut), '') is not null)
       ) as p(precision, renseigne)
      where d.id = any($1) and p.renseigne
      order by 1, 2`,
    [dossiersAImporter.map((d) => d.tecId)]
  );
  return rows.map((r) => ({ ...r, motif: 'sans_place' }));
};

/** Écrit chaque ligne écartée, et chaque partie sans place, dans `reprise_tec.ecarts`, avec son motif. */
export const createEcarts = async (
  client: PoolClient,
  ecarts: readonly (Ecart | PartieEcartee)[]
) => {
  for (const e of ecarts) {
    await client.query(
      `insert into reprise_tec.ecarts (table_source, tec_id, precision, motif)
       values ('demarche', $1, $2, $3)`,
      [e.id, 'precision' in e ? e.precision : '', e.motif]
    );
  }
};
