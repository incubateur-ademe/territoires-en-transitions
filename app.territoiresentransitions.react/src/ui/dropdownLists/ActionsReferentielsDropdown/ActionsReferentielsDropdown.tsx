import {OptionValue, SelectFilter, SelectMultipleProps} from '@tet/ui';
import {TActionRelationInsert, TActionStatutsRow} from 'types/alias';
import {useActionsReferentielsListe} from './useActionsReferentielsListe';

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
  const {data: actionListe} = useActionsReferentielsListe();

  // Formattage des valeurs sélectionnées pour les renvoyer au composant parent
  const getSelectedActions = (values?: OptionValue[]) => {
    const selectedActions = (actionListe ?? []).filter(
      (action: TActionStatutsRow) => values?.some(v => v === action.action_id)
    );
    const formatedActions: TActionRelationInsert[] = selectedActions.map(
      action => ({
        id: action.action_id,
        referentiel: action.referentiel,
      })
    );
    return formatedActions;
  };

  // Calcul de la liste des options pour le select
  const options = (actionListe ?? []).map(action => ({
    value: action.action_id,
    label: `${action.referentiel} ${action.identifiant} - ${action.nom}`,
  }));

  return (
    <SelectFilter
      {...props}
      isSearcheable
      options={options}
      placeholder={props.placeholder ?? 'Recherchez par mots-clés'}
      onChange={({values, selectedValue}) =>
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
