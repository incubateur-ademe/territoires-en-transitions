'use client';

import { useSearchParams } from 'next/navigation';

/** Clé de query param portée par les liens "Voir la question" du journal. */
export const HIGHLIGHTED_QUESTION_PARAM = 'q';

/**
 * Identifiant de la question ciblée par le lien "Voir la question" du journal
 * d'activités (`?q=<id>`), ou `null`.
 *
 * On passe par un query param plutôt qu'un hash `#...` : nuqs (utilisé pour les
 * filtres et l'ouverture des thématiques) duplique le hash quand il réécrit les
 * query params alors qu'un hash est présent (`#q-x#q-x`), ce qui cassait la
 * mise en exergue au 2ᵉ passage.
 *
 * Alimente le défilement automatique et l'encadré de la question.
 */
export const useHighlightedQuestionId = (): string | null => {
  const searchParams = useSearchParams();
  return searchParams.get(HIGHLIGHTED_QUESTION_PARAM) || null;
};
