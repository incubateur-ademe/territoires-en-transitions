import {
  ActionItem,
  ListActionsResponse,
  useListActions,
} from '@/app/referentiels/actions/use-list-actions';
import { getReferentielIdFromActionId } from '@/domain/referentiels';
import { SelectFilter, SelectMultipleProps, SelectOption } from '@/ui';
import { cn } from '@/ui/utils/cn';
import Fuse, { FuseResult } from 'fuse.js';
import { useCallback, useEffect, useState } from 'react';

const MESURE_ID_REGEXP = /(^((c(a(e)?)?|e(c(i)?)?)(\s)?)?(\d+(\.\d*)*)?$)/;

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
        // Si la recherche commence par un identifiant de mesure, on filtre par identifiant
        // (ex: "1.1" ou "CAe 1.1" ou "Eci 2.3")
        search = search.toLowerCase();
        const matches = search.match(MESURE_ID_REGEXP);

        if (matches) {
          // Si le début de la recherche est un chiffre, on cherche par identifiant
          if (parseInt(matches[0])) {
            mesureListeFiltered = mesureListeFiltered.filter((mesure) =>
              mesure.identifiant?.startsWith(search)
            );
            // Sinon on cherche par actionId (pour gérer les cas où l'utilisateur tape "CAe 1.1" ou "Eci 2.3")
          } else {
            mesureListeFiltered = mesureListeFiltered.filter((mesure) =>
              mesure.actionId?.startsWith(search.replace(' ', '_'))
            );
          }
          // Sinon on fait une recherche floue sur le nom de la mesure
        } else {
          const fuse = new Fuse(mesureListeFiltered, {
            keys: ['nom'],
            threshold: 0.3,
            shouldSort: false,
            ignoreLocation: true,
          });

          mesureListeFiltered = fuse
            .search(search)
            .map((r: FuseResult<ActionItem>) => r.item);
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
