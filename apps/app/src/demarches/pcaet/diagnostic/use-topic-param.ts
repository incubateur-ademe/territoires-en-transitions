'use client';

import { createSerializer, parseAsString, useQueryState } from 'nuqs';

export const DEMARCHE_TOPIC_PARAM = 'topic';

/**
 * Topic sélectionné du diagnostic, porté par l'URL (?topic=) pour être
 * pilotable par la barre d'étapes et partageable. `history: 'push'` : le
 * retour navigateur re-déroule les topics un à un, comme la barre.
 */
export const useDemarcheTopicParam = () =>
  useQueryState(
    DEMARCHE_TOPIC_PARAM,
    parseAsString.withOptions({ history: 'push' })
  );

export const serializeTopicParam = createSerializer({
  [DEMARCHE_TOPIC_PARAM]: parseAsString,
});
