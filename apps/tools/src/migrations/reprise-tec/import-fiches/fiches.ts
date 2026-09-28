/** La fiche : ce que devient une action de T&C dans TeT, et tout ce qui s'y rattache. */

import { StatutEnum } from '@tet/domain/plans';
import type { Action, Dossier } from './dossiers';
import type { ListesTet } from './listes-tet';
import { CIBLES, translate, TYPES_ACTION, TYPES_PORTEUR } from './listes-tec';

export type Fiche = ReturnType<typeof buildFiche>;

/**
 * Règle : la fiche d'une action, dans la collectivité de son dossier, « À venir », datée de sa création dans T&C.
 * Chaque lien n'est gardé qu'une fois : deux secteurs peuvent donner la même thématique.
 */
export const buildFiche = (
  action: Action,
  dossier: Dossier,
  listesTet: ListesTet
) => {
  const classements = action.secteurs.map(listesTet.getClassement);
  return {
    tecId: action.tecId,
    dossier,
    colonnes: {
      titre: action.titre,
      description: action.description,
      statut: StatutEnum.A_VENIR,
      dateDebut: correctDateSaisie(action.lanceeLe),
      cibles:
        action.cibles.length > 0
          ? action.cibles.map((c) => translate(CIBLES, c, 'cible'))
          : null,
      collectiviteId: dossier.collectiviteId,
      createdAt: action.creeeLe,
    },
    effetIds: unique(action.volets.map(listesTet.getEffetId)),
    thematiqueIds: unique(classements.map((c) => c.thematiqueId)),
    sousThematiqueIds: unique(
      classements.flatMap((c) =>
        c.sousThematiqueId === null ? [] : [c.sousThematiqueId]
      )
    ),
    structures: unique([
      ...action.typesPorteur.map((t) =>
        translate(TYPES_PORTEUR, t, 'type de porteur')
      ),
      ...action.porteursLibres,
    ]),
    tagsLibres: unique([
      ...action.typesAction.map((t) =>
        translate(TYPES_ACTION, t, "type d'action")
      ),
      ...action.secteursLibres,
    ]),
    notes: [action.commentaireConclusion, action.commentaireStatut].filter(
      (n): n is string => n !== null
    ),
  };
};

/** Règle des dossiers : une date saisie avant 2000 est lue 20AA (année 10 à 99) ou ignorée. */
const correctDateSaisie = (date: string | null) => {
  if (date === null || date >= '2000') {
    return date;
  }
  const annee = Number(date.slice(0, 4));
  return annee >= 10 && annee <= 99 ? `20${date.slice(2)}` : null;
};

const unique = <T>(valeurs: readonly T[]) => [...new Set(valeurs)];
