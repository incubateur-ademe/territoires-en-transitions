import { useLayoutEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

/**
 * Le texte en cours de saisie, distinct de la recherche appliquée.
 *
 * La saisie reste locale et n'est appliquée qu'après `debounce` ms, ou aussitôt
 * par `commit`. Elle se recale sur `value` quand la recherche change d'ailleurs
 * (« Réinitialiser les filtres », précédent/suivant du navigateur), mais pas
 * quand le changement vient d'elle : elle écraserait ce qui a été tapé depuis.
 */
export const useSearchDraft = ({
  value,
  onCommit,
  debounce,
}: {
  value: string;
  onCommit: (value: string) => void;
  debounce: number;
}) => {
  const [draft, setDraftState] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  const [lastCommitted, setLastCommitted] = useState(value);
  const [externalChanges, setExternalChanges] = useState(0);

  // Ajusté au rendu plutôt que dans un effet : pas d'affichage intermédiaire.
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== lastCommitted) {
      setDraftState(value);
      setLastCommitted(value);
      setExternalChanges((count) => count + 1);
    }
  }

  const commitNow = (next: string) => {
    setLastCommitted(next);
    onCommit(next);
  };
  const debouncedCommit = useDebouncedCallback(commitNow, debounce);

  // Une saisie encore en attente ne doit pas défaire une recherche changée
  // d'ailleurs : elle rétablirait l'ancienne alors que le champ est vidé.
  // Effet synchrone, pour qu'aucun délai ne s'intercale avant l'annulation.
  useLayoutEffect(() => {
    if (externalChanges > 0) {
      debouncedCommit.cancel();
    }
  }, [externalChanges, debouncedCommit]);

  return {
    draft,
    /** Change la saisie, et l'applique après le délai. */
    setDraft: (next: string) => {
      setDraftState(next);
      debouncedCommit(next);
    },
    /** Applique la saisie sans attendre. */
    commit: (next: string = draft) => {
      debouncedCommit.cancel();
      setDraftState(next);
      commitNow(next);
    },
  };
};
