'use client';

import { referentielToName } from '@/app/app/labels';
import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
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
  const { data: actionsFiltrees } = useListActions(
    { actionIds: filters.actionIds ?? [] },
    { enabled: hasActionIdsFilter }
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
