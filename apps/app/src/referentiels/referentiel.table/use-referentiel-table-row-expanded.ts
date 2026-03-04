import { ColumnFiltersState, ExpandedState } from '@tanstack/react-table';
import { ActionType, ActionTypeEnum } from '@tet/domain/referentiels';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { ActionListItem } from '../actions/use-list-actions';

// Par défaut on déplie uniquement les axes et sous-axes.
const TYPES_EXPANDED_BY_DEFAULT = new Set<ActionType>([
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
]);

// Lorsqu'un filtre qui cible les sous-actions est actif, on déplie jusqu'au
// niveau ACTION afin que les SOUS_ACTION soient visibles sans exposer les TACHE.
const TYPES_EXPANDED_WHEN_FILTERING_SOUS_ACTION = new Set<ActionType>([
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
  ActionTypeEnum.ACTION,
]);

const FILTER_IDS_TARGETING_SOUS_ACTION: ReadonlySet<string> = new Set([
  'statut',
  'categorie',
  'explication',
]);

function filtersTargetingSousAction(
  columnFilters: ColumnFiltersState
): boolean {
  return columnFilters.some(
    (filter) =>
      FILTER_IDS_TARGETING_SOUS_ACTION.has(filter.id) ||
      filter.id.startsWith('score')
  );
}

/**
 * Gère l'état d'expansion des lignes du tableau de référentiel.
 *
 * - Au montage, l'état initial est calculé en fonction des filtres actifs
 *   (utile lorsque des filtres sont déjà présents dans l'URL).
 * - Lorsque l'on bascule entre "filtre ciblant les sous-actions actif" et
 *   "inactif", l'expansion est réinitialisée vers l'état cible.
 * - Entre ces transitions, l'utilisateur peut replier/déplier librement les
 *   lignes sans être contrarié par un état verrouillé.
 */
export function useReferentielTableRowExpanded({
  actions,
  columnFilters,
}: {
  actions: Record<string, ActionListItem>;
  columnFilters: ColumnFiltersState;
}): [ExpandedState, Dispatch<SetStateAction<ExpandedState>>] {
  const { defaultExpanded, expandedUntilSousAction } = useMemo(() => {
    const byDefault: Record<string, true> = {};
    const untilSousAction: Record<string, true> = {};

    for (const id in actions) {
      const { actionType } = actions[id];
      if (TYPES_EXPANDED_BY_DEFAULT.has(actionType)) {
        byDefault[id] = true;
        untilSousAction[id] = true;
      } else if (TYPES_EXPANDED_WHEN_FILTERING_SOUS_ACTION.has(actionType)) {
        untilSousAction[id] = true;
      }
    }

    return {
      defaultExpanded: byDefault,
      expandedUntilSousAction: untilSousAction,
    };
  }, [actions]);

  const shouldExpandUntilSousAction = filtersTargetingSousAction(columnFilters);

  const [expanded, setExpanded] = useState<ExpandedState>(() =>
    shouldExpandUntilSousAction ? expandedUntilSousAction : defaultExpanded
  );

  // Pattern "Adjusting state on prop change" : on détecte la bascule du filtre
  // pendant le rendu plutôt que via un effet. React ré-exécute immédiatement
  // le rendu avec le nouvel état, sans frame intermédiaire ni effet.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevShouldExpand, setPrevShouldExpand] = useState(
    shouldExpandUntilSousAction
  );

  if (prevShouldExpand !== shouldExpandUntilSousAction) {
    setPrevShouldExpand(shouldExpandUntilSousAction);
    setExpanded(
      shouldExpandUntilSousAction ? expandedUntilSousAction : defaultExpanded
    );
  }

  return [expanded, setExpanded];
}
