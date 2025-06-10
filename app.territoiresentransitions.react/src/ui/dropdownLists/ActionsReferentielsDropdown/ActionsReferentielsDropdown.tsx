import {
  ActionItem,
  ListActionsResponse,
  useListActions,
} from '@/app/referentiels/actions/use-list-actions';
import { TActionRelationInsert } from '@/app/types/alias';
import {
  OptionValue,
  SelectFilter,
  SelectMultipleProps,
  SelectOption,
} from '@/ui';
import Fuse, { FuseResult } from 'fuse.js';
import { useCallback, useEffect, useState } from 'react';

const ACTION_ID_REGEXP = /(?:(cae|eci|te)?\s*)(\d(?:\.\d+){1,4})/i;

type ActionsReferentielsDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: string[];
  onChange: ({
    actions,
    selectedAction,
  }: {
    actions: TActionRelationInsert[];
    selectedAction: TActionRelationInsert;
  }) => void;
};

const ActionsReferentielsDropdown = ({
  ...props
}: ActionsReferentielsDropdownProps) => {
  // Liste de toutes les actions
  const { data: actionListe }: ListActionsResponse = useListActions();

  const [filteredOptions, setFilteredOptions] = useState<SelectOption[]>([]);

  // Formattage des valeurs sélectionnées pour les renvoyer au composant parent
  const getSelectedActions = (values?: OptionValue[]) => {
    const selectedActions = (actionListe ?? []).filter((action) =>
      values?.some((v) => v === action.actionId)
    );
    const formatedActions: TActionRelationInsert[] = selectedActions.map(
      (action) => ({
        id: action.actionId,
        referentiel: action.referentiel,
      })
    );
    return formatedActions;
  };

  const onSearch = useCallback(
    (search: string) => {
      let actionListeFiltered = actionListe ?? [];
      if (search) {
        const matches = search.match(ACTION_ID_REGEXP);
        let referentiel: string | null = null;
        let identifiant: string | null = null;
        if (matches) {
          referentiel = matches[1];
          identifiant = matches[2];
        }
        if (!identifiant) {
          const fuse = new Fuse(actionListeFiltered, {
            keys: ['nom'],
            threshold: 0.3,
            shouldSort: true,
            ignoreLocation: true,
          });

          actionListeFiltered = fuse
            .search(search)
            .map((r: FuseResult<ActionItem>) => r.item);
        } else {
          actionListeFiltered = actionListeFiltered.filter((action) => {
            return (
              action.identifiant?.includes(identifiant) ||
              referentiel?.toLowerCase() === action.referentielId
            );
          });
        }
      }

      const options = actionListeFiltered.map((action) => ({
        value: action.actionId,
        label: `${action.referentiel} ${action.identifiant} - ${action.nom}`,
      }));

      setFilteredOptions(options);
    },
    [actionListe]
  );

  useEffect(() => {
    onSearch('');
  }, [actionListe, onSearch]);

  // Calcul de la liste des options pour le select

  return (
    <SelectFilter
      {...props}
      isSearcheable
      options={filteredOptions}
      onSearch={onSearch}
      placeholder={props.placeholder ?? 'Recherchez par mots-clés'}
      onChange={({ values, selectedValue }) =>
        props.onChange({
          actions: getSelectedActions(values) as TActionRelationInsert[],
          selectedAction: getSelectedActions([
            selectedValue,
          ])[0] as TActionRelationInsert,
        })
      }
    />
  );
};

export default ActionsReferentielsDropdown;
