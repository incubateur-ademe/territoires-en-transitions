import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import { TActionRelationInsert } from '@/app/types/alias';
import { OptionValue, SelectFilter, SelectMultipleProps } from '@/ui';

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
  const { data: actionListe } = useListActions();

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

  // Calcul de la liste des options pour le select
  const options = (actionListe ?? []).map((action) => ({
    value: action.actionId,
    label: `${action.referentiel} ${action.identifiant} - ${action.nom}`,
  }));

  return (
    <SelectFilter
      {...props}
      isSearcheable
      options={options}
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
