import { formatMesureLabel } from '@/app/referentiels/actions/format-mesure-label';
import {
  ActionListItem,
  useListActions,
} from '@/app/referentiels/actions/use-list-actions';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { listWritableReferentielIds } from '@tet/domain/collectivites';
import {
  ActionTypeEnum,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { SelectFilter, SelectMultipleProps } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import Fuse, { FuseResult } from 'fuse.js';
import { useMemo, useState } from 'react';
import {
  filterSelectableMesures,
  searchMesuresByIdentifiant,
} from './filter-mesures';

type MesuresReferentielsDropdownProps = Omit<SelectMultipleProps, 'options'> & {
  /** Mesures déjà liées : toujours proposées pour pouvoir être retirées */
  linkedMesureIds?: string[];
};

const MesuresReferentielsDropdown = ({
  linkedMesureIds = [],
  ...props
}: MesuresReferentielsDropdownProps) => {
  const { collectivitePreferences } = useCurrentCollectivite();
  const writableReferentielIds = listWritableReferentielIds(
    collectivitePreferences.referentiels
  );
  const referentielIds = [
    ...new Set([
      ...writableReferentielIds,
      ...linkedMesureIds.map(getReferentielIdFromActionId),
    ]),
  ];

  // Liste de toutes les actions
  const { data: actions, isPending } = useListActions(
    {
      actionTypes: [ActionTypeEnum.ACTION, ActionTypeEnum.SOUS_ACTION],
      referentielIds,
    },
    { enabled: referentielIds.length > 0 }
  );

  const mesureListe = filterSelectableMesures(actions ?? [], {
    writableReferentielIds,
    linkedMesureIds,
  });

  const [searchValue, setSearchValue] = useState('');

  const fuse = useMemo(
    () =>
      new Fuse(mesureListe, {
        keys: ['nom'],
        threshold: 0.3,
        shouldSort: false,
        ignoreLocation: true,
      }),
    [mesureListe]
  );

  const filteredOptions = useMemo(() => {
    const mesureListeFiltered = searchValue
      ? (searchMesuresByIdentifiant(mesureListe, searchValue) ??
        // Sinon on fait une recherche floue sur le nom de la mesure
        fuse
          .search(searchValue.toLowerCase())
          .map((r: FuseResult<ActionListItem>) => r.item))
      : mesureListe;

    return mesureListeFiltered.map((mesure) => ({
      value: mesure.actionId,
      label: formatMesureLabel(mesure),
    }));
  }, [searchValue, mesureListe, fuse]);

  // Calcul de la liste des options pour le select
  return (
    <SelectFilter
      {...props}
      isSearcheable
      options={filteredOptions}
      onSearch={setSearchValue}
      isLoading={isPending}
      custom={{
        valueMatchOption: false,
        renderOptionItem: (option) => {
          const mesureType = mesureListe.find(
            (m) => m.actionId === option.value
          )?.actionType;
          return (
            <span
              className={cn('leading-6 text-grey-8', {
                'text-primary-7': props.values?.includes(option.value),
                'font-bold': mesureType === ActionTypeEnum.ACTION,
                'ml-4': mesureType === ActionTypeEnum.SOUS_ACTION,
              })}
            >
              {option.label}
            </span>
          );
        },
      }}
    />
  );
};

export default MesuresReferentielsDropdown;
