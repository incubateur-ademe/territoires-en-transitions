import {
  ActionListItem,
  useListActions,
} from '@/app/referentiels/actions/use-list-actions';
import { ActionTypeEnum, ReferentielIdEnum } from '@tet/domain/referentiels';
import { SelectFilter, SelectMultipleProps } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import Fuse, { FuseResult } from 'fuse.js';
import { useMemo, useState } from 'react';

const MESURE_ID_REGEXP =
  /(^((cae?|ca|c|eci?|ec|e)(\s*\d+)*|\d+)(\s|\.\d*|[\s\d.])*$)/;

type MesuresReferentielsDropdownProps = Omit<SelectMultipleProps, 'options'>;

const MesuresReferentielsDropdown = (
  props: MesuresReferentielsDropdownProps
) => {
  // Liste de toutes les actions
  const { data: mesureListe, isPending } = useListActions({
    actionTypes: [ActionTypeEnum.ACTION, ActionTypeEnum.SOUS_ACTION],
    referentielIds: [ReferentielIdEnum.CAE, ReferentielIdEnum.ECI],
  });

  const [searchValue, setSearchValue] = useState('');

  const fuse = useMemo(
    () =>
      new Fuse(mesureListe ?? [], {
        keys: ['nom'],
        threshold: 0.3,
        shouldSort: false,
        ignoreLocation: true,
      }),
    [mesureListe]
  );

  const filteredOptions = useMemo(() => {
    const list = mesureListe ?? [];

    if (!searchValue) {
      return list.map((mesure) => ({
        value: mesure.actionId,
        label: `${mesure.referentiel} ${mesure.identifiant} - ${mesure.nom}`,
      }));
    }

    let mesureListeFiltered = list;
    const search = searchValue.toLowerCase();

    const match = search.match(MESURE_ID_REGEXP)?.[0];

    const filterCondition = (
      mesureProperty: string,
      match: string,
      referentiel?: string
    ) =>
      mesureProperty.startsWith(
        `${referentiel ? `${referentiel}_` : ''}${match
          .replace(/\D/g, '')
          .split('')
          .join('.')}`
      );

    if (match) {
      // Si le début de la recherche est un chiffre, on cherche par identifiant
      if (parseInt(match)) {
        mesureListeFiltered = mesureListeFiltered.filter((mesure) =>
          filterCondition(mesure.identifiant, match)
        );
        // Sinon on cherche par actionId
      } else if (match.startsWith('c')) {
        mesureListeFiltered = mesureListeFiltered.filter((mesure) =>
          filterCondition(mesure.actionId, match, 'cae')
        );
      } else if (match.startsWith('e')) {
        mesureListeFiltered = mesureListeFiltered.filter((mesure) =>
          filterCondition(mesure.actionId, match, 'eci')
        );
      }
      // Sinon on fait une recherche floue sur le nom de la mesure
    } else {
      mesureListeFiltered = fuse
        .search(search)
        .map((r: FuseResult<ActionListItem>) => r.item);
    }

    return mesureListeFiltered.map((mesure) => ({
      value: mesure.actionId,
      label: `${mesure.referentiel} ${mesure.identifiant} - ${mesure.nom}`,
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
          const mesureType = mesureListe?.find(
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
