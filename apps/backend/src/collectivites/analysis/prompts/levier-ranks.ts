import { Levier, levierEnumValues } from '@tet/domain/shared';

// Le modèle désigne un levier par son rang, jamais par son libellé. Gemini
// compile le schéma de sortie en automate de décodage contraint : 29 libellés
// français longs y deviennent un arbre de préfixes de plusieurs centaines de
// nœuds, qui, multiplié par les tableaux bornés imbriqués, dépasse le budget
// d'états et fait échouer l'appel en 400 INVALID_ARGUMENT.
//
// Le rang est généré dans le prompt et relu dans la réponse au sein du même
// appel : il n'est jamais persisté. Réordonner levierEnumValues change donc la
// numérotation sans invalider quoi que ce soit en base.

export const toLevierRank = (levier: Levier): number =>
  levierEnumValues.indexOf(levier) + 1;

export const toLevierOfRank = (rank: number): Levier =>
  levierEnumValues[rank - 1];
