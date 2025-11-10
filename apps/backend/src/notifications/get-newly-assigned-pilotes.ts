import { differenceBy, isNil } from 'es-toolkit';
import { PersonneTagOrUserWithContacts } from '../collectivites/shared/models/personne-tag-or-user.dto';
import { FicheWithRelations } from '../plans/fiches/list-fiches/fiche-action-with-relations.dto';

type UserWithEmail = Omit<PersonneTagOrUserWithContacts, 'userId' | 'email'> & {
  userId: string;
  email: string;
};

/**
 * Donne, en excluant l'auto-assignation, les pilotes nouvellement assignés et
 * ayant un email
 */
export function getNewlyAssignedPilotes(
  updatedFiche: FicheWithRelations,
  previousFiche: FicheWithRelations,
  userId: string
) {
  const withEmailAndNotAutoAssigned = (p: PersonneTagOrUserWithContacts) =>
    !isNil(p.email) && !isNil(p.userId) && p.userId !== userId;

  const pilotesWithEmailIntoUpdatedFiche = updatedFiche.pilotes?.filter(
    withEmailAndNotAutoAssigned
  ) as UserWithEmail[];
  if (!pilotesWithEmailIntoUpdatedFiche?.length) return [];

  const pilotesWithEmailIntoPreviousFiche = previousFiche.pilotes?.filter(
    withEmailAndNotAutoAssigned
  ) as UserWithEmail[];
  if (!pilotesWithEmailIntoPreviousFiche?.length)
    return pilotesWithEmailIntoUpdatedFiche;

  // pilotes présents dans la fiche màj et qui ne l'étaient pas dans la version précédente
  return differenceBy(
    pilotesWithEmailIntoUpdatedFiche,
    pilotesWithEmailIntoPreviousFiche,
    (p) => p.email
  );
}
