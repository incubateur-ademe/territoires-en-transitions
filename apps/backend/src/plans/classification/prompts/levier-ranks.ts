import { Levier, levierEnumValues } from '@tet/domain/shared';

// Le modele designe un levier par son rang, jamais par son libelle. Gemini
// compile le schema de sortie en automate de decodage contraint : 29 libelles
// francais longs y deviennent un arbre de prefixes de plusieurs centaines de
// noeuds, qui, multiplie par les tableaux bornes imbriques, depasse le budget
// d'etats et fait echouer l'appel en 400 INVALID_ARGUMENT.
//
// Le rang est genere dans le prompt et relu dans la reponse au sein du meme
// appel : il n'est jamais persiste. Reordonner levierEnumValues change donc la
// numerotation sans invalider quoi que ce soit en base.

export const LEVIER_BY_RANK: Record<number, Levier> = Object.fromEntries(
  levierEnumValues.map((levier, position) => [position + 1, levier])
);

export const RANK_BY_LEVIER: Record<Levier, number> = Object.fromEntries(
  levierEnumValues.map((levier, position) => [levier, position + 1])
) as Record<Levier, number>;

export const LEVIER_RANKS = levierEnumValues.map(
  (unused, position) => position + 1
);

export const isLevierRank = (rank: number): boolean => rank in LEVIER_BY_RANK;
