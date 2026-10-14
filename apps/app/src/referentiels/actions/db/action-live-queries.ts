import { eq, InitialQueryBuilder } from '@tanstack/react-db';
import { ReferentielId } from '@tet/domain/referentiels';
import { ActionDefinitionsCollection } from './action-definitions.collection';
import { ActionStatesCollection } from './action-states.collection';

/**
 * Jointure des définitions et de l'état des actions d'un référentiel, dans
 * l'ordre renvoyé par le backend. Une action présente d'un seul côté
 * (définitions d'une autre version, par exemple) n'en fait pas partie.
 */
export const queryJoinedActions = (
  q: InitialQueryBuilder,
  definitions: ActionDefinitionsCollection,
  states: ActionStatesCollection
) =>
  q
    .from({ definition: definitions })
    .join(
      { state: states },
      ({ definition, state }) => eq(definition.actionId, state.actionId),
      'inner'
    )
    .orderBy(({ state }) => state.position);

/**
 * Version des définitions stockées pour un référentiel (toutes les
 * définitions d'un référentiel ont la même) ; aucun résultat si elles n'ont
 * pas encore été chargées.
 */
export const queryStoredReferentielVersion = (
  q: InitialQueryBuilder,
  definitions: ActionDefinitionsCollection,
  referentielId: ReferentielId
) =>
  q
    .from({ definition: definitions })
    .where(({ definition }) => eq(definition.referentielId, referentielId))
    .select(({ definition }) => ({
      referentielVersion: definition.referentielVersion,
    }))
    .findOne();
