/** Les écarts : ce qui n'est pas écrit dans TeT, avec son motif, et la preuve que rien ne se perd. */

import { PoolClient } from 'pg';
import type { Valeur } from './tables-grille';

export type CleLigne = {
  table: string;
  id: number;
  precision: string;
};

export type Ecart = CleLigne & {
  motif: string;
};

/** La clé d'une ligne ou d'une partie de ligne, sous forme de texte, pour la comparer. */
const toCle = ({ table, id, precision }: CleLigne) =>
  `${table}|${id}|${precision}`;

/**
 * Arrête avant toute écriture si une ligne lue n'est pas écrite ou écartée exactement une fois ; rend le bilan par table.
 * Un écart de partie de ligne (consommation EnR, commentaire) n'entre pas dans le compte des lignes.
 */
export const validateBilan = (
  lues: readonly CleLigne[],
  valeurs: readonly Valeur[],
  ecarts: readonly Ecart[]
) => {
  const traitements = new Map<string, number>(lues.map((l) => [toCle(l), 0]));
  for (const cle of [
    ...valeurs.map((v) => toCle(v.ligne)),
    ...ecarts.map(toCle),
  ]) {
    if (traitements.has(cle)) {
      traitements.set(cle, (traitements.get(cle) ?? 0) + 1);
    }
  }
  const lignesEnAnomalie = [...traitements].filter(([, n]) => n !== 1);
  const ecartsEnDouble = ecarts.length - new Set(ecarts.map(toCle)).size;

  const bilan = [...new Set(lues.map((l) => l.table))].sort().map((table) => ({
    table,
    lues: lues.filter((l) => l.table === table).length,
    ecrites: valeurs.filter((v) => v.ligne.table === table).length,
    ecartees: ecarts.filter(
      (e) => e.table === table && traitements.has(toCle(e))
    ).length,
  }));

  if (lignesEnAnomalie.length > 0 || ecartsEnDouble > 0) {
    throw new Error(
      `Bilan faux, l'import est arrêté avant toute écriture : ${lignesEnAnomalie.length} lignes ` +
        `ni écrites ni écartées, ou les deux (ex. ${lignesEnAnomalie
          .slice(0, 3)
          .map(([cle]) => cle)
          .join(', ')}) ; ${ecartsEnDouble} écarts en double.\n` +
        bilan
          .map(
            (b) =>
              `  ${b.table} : ${b.lues} lues, ${b.ecrites} écrites, ${b.ecartees} écartées`
          )
          .join('\n')
    );
  }
  return bilan;
};

/** Écrit les écarts dans `reprise_tec.ecarts`, par paquets de 10 000. */
export const createEcarts = async (
  client: PoolClient,
  ecarts: readonly Ecart[]
) => {
  for (let debut = 0; debut < ecarts.length; debut += 10_000) {
    const paquet = ecarts.slice(debut, debut + 10_000);
    await client.query(
      `insert into reprise_tec.ecarts (table_source, tec_id, precision, motif)
       select * from unnest($1::text[], $2::bigint[], $3::text[], $4::text[])`,
      [
        paquet.map((e) => e.table),
        paquet.map((e) => e.id),
        paquet.map((e) => e.precision),
        paquet.map((e) => e.motif),
      ]
    );
  }
};
