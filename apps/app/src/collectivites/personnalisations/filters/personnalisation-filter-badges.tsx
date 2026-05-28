'use client';

import { referentielToName } from '@/app/app/labels';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useListActionsGroupedById } from '@/app/referentiels/actions/use-list-actions-grouped-by-id';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  ReferentielId,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { BadgeFilters } from '@tet/ui';
import { useCallback, useMemo } from 'react';
import { useListPersonnalisationThematiques } from '../data/use-list-personnalisation-thematiques';
import { formatToPrintableFilters } from './format-to-printable-filters';
import { usePersonnalisationFilters } from './personnalisation-filters-context';
import type { PersonnalisationFilterKeys } from './personnalisation-filters.types';

const actionLabel = (action: {
  identifiant: string;
  nom: string;
  referentiel: string;
}): string => `${action.referentiel} ${action.identifiant} - ${action.nom}`;

export const PersonnalisationFilterBadges = () => {
  const collectiviteId = useCollectiviteId();
  const { data } = useListPersonnalisationThematiques(collectiviteId);
  const thematiques = data?.thematiques;
  const { filters, resetFilters, onDeleteFilterValue, onDeleteFilterCategory } =
    usePersonnalisationFilters();

  const hasActionIdsFilter = Boolean(filters.actionIds?.length);
  const actionIds = filters.actionIds ?? [];
  const referentielIds = [
    ...new Set(actionIds.map(getReferentielIdFromActionId)),
  ] as ReferentielId[];
  const queryResults = useListActionsGroupedById(
    { referentielIds },
    { enabled: hasActionIdsFilter }
  );
  const queryByReferentielId = new Map(
    referentielIds.map((referentielId, index) => [
      referentielId,
      queryResults[index]?.data,
    ])
  );
  const actionsFiltrees = actionIds
    .map((actionId) => {
      const referentielId = getReferentielIdFromActionId(actionId);
      const result = queryByReferentielId.get(referentielId);
      if (!result) return undefined;
      const visibleAction = result.actionsById[actionId];
      if (visibleAction) {
        return visibleAction;
      }
      const hiddenAction = result.hiddenActions.find(
        (action) => action.actionId === actionId
      );
      if (!hiddenAction) {
        return undefined;
      }
      return {
        ...hiddenAction,
        referentiel: referentielId,
      } as Pick<ActionListItem, 'actionId' | 'identifiant' | 'nom' | 'referentiel'>;
    })
    .filter(
      (
        action
      ): action is Pick<
        ActionListItem,
        'actionId' | 'identifiant' | 'nom' | 'referentiel'
      > => action !== undefined
    );

  const getFilterValuesLabels = useCallback(
    (key: PersonnalisationFilterKeys, values: string[]) => {
      if (key === 'referentielIds') {
        return values.map((value) => referentielToName[value as ReferentielId]);
      }
      if (key === 'thematiqueIds') {
        return values.map(
          (id) => thematiques?.find((t) => t.id === id)?.nom ?? id
        );
      }
      if (key === 'actionIds') {
        return values.map((id) => {
          const action = actionsFiltrees?.find((a) => a.actionId === id);
          return action ? actionLabel(action) : id;
        });
      }
      return values;
    },
    [actionsFiltrees, thematiques]
  );

  const getLabelToId = useCallback(
    (key: PersonnalisationFilterKeys, label: string): string => {
      if (key === 'referentielIds') {
        return (
          Object.entries(referentielToName).find(
            ([_, name]) => name === label
          )?.[0] ?? label
        );
      }
      if (key === 'thematiqueIds') {
        return thematiques?.find((t) => t.nom === label)?.id ?? label;
      }
      if (key === 'actionIds') {
        const byId = actionsFiltrees?.find((a) => a.actionId === label);
        if (byId) {
          return byId.actionId;
        }
        const byLabel = actionsFiltrees?.find((a) => actionLabel(a) === label);
        return byLabel?.actionId ?? label;
      }
      return label;
    },
    [actionsFiltrees, thematiques]
  );

  const formattedFilterCategories = useMemo(
    () => formatToPrintableFilters(filters, {}, getFilterValuesLabels),
    [filters, getFilterValuesLabels]
  );

  if (formattedFilterCategories.length === 0) {
    return null;
  }

  return (
    <BadgeFilters<PersonnalisationFilterKeys>
      filterCategories={formattedFilterCategories}
      onDeleteFilterValue={({ categoryKey, valueToDelete }) => {
        const key = Array.isArray(categoryKey) ? categoryKey[0] : categoryKey;
        onDeleteFilterValue({
          categoryKey: key,
          valueToDelete: getLabelToId(key, valueToDelete),
        });
      }}
      onDeleteFilterCategory={(categoryKey) => {
        const key = Array.isArray(categoryKey) ? categoryKey[0] : categoryKey;
        onDeleteFilterCategory(key);
      }}
      onClearAllFilters={resetFilters}
    />
  );
};
