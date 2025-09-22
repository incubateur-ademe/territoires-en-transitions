import {
  ActionItem,
  ListActionsResponse,
  useListActions,
} from '@/app/referentiels/actions/use-list-actions';
import { getReferentielIdFromActionId } from '@/domain/referentiels';
import { cn, SelectFilter, SelectMultipleProps, SelectOption } from '@/ui';
import Fuse, { FuseResult } from 'fuse.js';
import { useCallback, useEffect, useState } from 'react';

const MESURE_ID_REGEXP = /(?:(cae|eci|te)?\s*)(\d(?:\.\d+){1,4})/i;

type MesuresReferentielsDropdownProps = Omit<SelectMultipleProps, 'options'>;

const MesuresReferentielsDropdown = (
  props: MesuresReferentielsDropdownProps
) => {
  // Liste de toutes les actions
  const { data: mesureListe }: ListActionsResponse = useListActions();

  const [filteredOptions, setFilteredOptions] = useState<SelectOption[]>([]);

  const onSearch = useCallback(
    (search: string) => {
      let mesureListeFiltered = mesureListe ?? [];
      if (search) {
        const matches = search.match(MESURE_ID_REGEXP);
        let referentiel: string | null = null;
        let identifiant: string | null = null;
        if (matches) {
          referentiel = matches[1];
          identifiant = matches[2];
        }
        if (!identifiant) {
          const fuse = new Fuse(mesureListeFiltered, {
            keys: ['nom'],
            threshold: 0.3,
            shouldSort: true,
            ignoreLocation: true,
          });

          mesureListeFiltered = fuse
            .search(search)
            .map((r: FuseResult<ActionItem>) => r.item);
        } else {
          mesureListeFiltered = mesureListeFiltered.filter((mesure) => {
            return (
              mesure.identifiant?.includes(identifiant) ||
              referentiel?.toLowerCase() === mesure.referentielId
            );
          });
        }
      }

      const options = mesureListeFiltered.map((mesure) => ({
        value: mesure.actionId,
        label: `${mesure.referentiel} ${mesure.identifiant} - ${mesure.nom}`,
      }));

      setFilteredOptions(options);
    },
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
        const referentiel = getReferentielIdFromActionId(
          option.value.toString()
        );

        const level = option.value.toString().split('.').length;

        const isMesure =
          (referentiel === 'cae' && level === 3) ||
          (referentiel === 'eci' && level === 2);

        const isActive = props.values?.includes(option.value);

        return (
          <span
            className={cn('leading-6 text-grey-8', {
              'text-primary-7': isActive,
              'font-bold': isMesure,
              'ml-4': !isMesure,
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
