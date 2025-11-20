import {
  ActionListItem,
  ListActionsResponse,
  useListActions,
} from '@/app/referentiels/actions/use-list-actions';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { SelectFilter, SelectMultipleProps, SelectOption } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import Fuse, { FuseResult } from 'fuse.js';
import { useCallback, useEffect, useState } from 'react';

const MESURE_ID_REGEXP =
  /(^((cae?|ca|c|eci?|ec|e)(\s*\d+)*|\d+)(\s|\.\d*|[\s\d.])*$)/;

type MesuresReferentielsDropdownProps = Omit<SelectMultipleProps, 'options'>;

const MesuresReferentielsDropdown = (
  props: MesuresReferentielsDropdownProps
) => {
  // Liste de toutes les actions
  const { data: mesureListe }: ListActionsResponse = useListActions();

  const [filteredOptions, setFilteredOptions] = useState<SelectOption[]>([]);

  const fuse = new Fuse(mesureListe ?? [], {
    keys: ['nom'],
    threshold: 0.3,
    shouldSort: false,
    ignoreLocation: true,
  });

  const onSearch = useCallback(
    (search: string) => {
      let mesureListeFiltered = mesureListe ?? [];
      if (search) {
        // Si la recherche commence par un identifiant de mesure, on filtre par identifiant
        // (ex: "1.1" ou "CAe 1.1" ou "Eci 2.3")
        search = search.toLowerCase();

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
      }

      const options = mesureListeFiltered.map((mesure) => ({
        value: mesure.actionId,
        label: `${mesure.referentiel} ${mesure.identifiant} - ${mesure.nom}`,
      }));

      setFilteredOptions(options);
    },
    // Si on rajoute `fuse` en dépendance, cela crée une boucle infinie
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mesureListe]
  );

  useEffect(() => {
    onSearch('');
  }, [mesureListe, onSearch]);

  // Calcul de la liste des options pour le select
  return (
    <SelectFilter
      {...props}
      isSearcheable
      options={filteredOptions}
      onSearch={onSearch}
      showCustomItemInBadges={false}
      customItem={(option) => {
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
      }}
    />
  );
};

export default MesuresReferentielsDropdown;
