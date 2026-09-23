/** Les écarts : ce qui n'est pas repris, et la preuve que rien ne se perd. */

import { PoolClient } from 'pg';
import type { Dossier } from './dossier';
import type { Motif } from './perimetre';

export type Ecart = {
  id: number;
  motif: Motif | 'elaboration_remplacee';
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

/** Écrit chaque ligne écartée dans `reprise_tec.ecarts`, avec son motif. */
export const createEcarts = async (
  client: PoolClient,
  ecarts: readonly Ecart[]
) => {
  for (const { id, motif } of ecarts) {
    await client.query(
      `insert into reprise_tec.ecarts (table_source, tec_id, motif)
       values ('demarche', $1, $2)`,
      [id, motif]
    );
  }
};
