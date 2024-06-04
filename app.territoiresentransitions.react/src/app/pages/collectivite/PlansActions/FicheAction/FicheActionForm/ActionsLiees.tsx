import {TActionStatutsRow} from 'types/alias';
import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';
import {TOption} from 'ui/shared/select/commons';
import {useActionListe} from '../data/options/useActionListe';
import {TActionRelationInsert} from 'types/alias';
import {ActionsLieesCards} from './ActionsLieesCards';
import {Field} from '@tet/ui';

type Props = {
  actions: TActionRelationInsert[] | null;
  onSelect: (actions: TActionRelationInsert[]) => void;
  isReadonly: boolean;
};

const ActionsLiees = ({actions, onSelect, isReadonly}: Props) => {
  const {data: actionListe} = useActionListe();

  const formatOptions = (actions?: TActionStatutsRow[] | null): TOption[] => {
    const options = actions
      ? actions.map((action: TActionStatutsRow) => ({
          value: action.action_id,
          label: `${action.referentiel} ${action.identifiant} - ${action.nom}`,
        }))
      : [];

    return options;
  };

  const formatSelectActions = (values: string[]): TActionRelationInsert[] => {
    const selectedActions =
      actionListe?.filter((action: TActionStatutsRow) =>
        values.some(v => v === action.action_id)
      ) ?? [];
    const formatedActions: TActionRelationInsert[] = selectedActions.map(
      action => ({
        id: action.action_id,
        referentiel: action.referentiel,
      })
    );
    return formatedActions;
  };

  return (
    <>
      <Field title="Actions des référentiels liées">
        <AutocompleteInputSelect
          dsfrButton
          containerWidthMatchButton
          values={actions?.map((action: TActionRelationInsert) => action.id)}
          options={formatOptions(actionListe)}
          onSelect={values => onSelect(formatSelectActions(values))}
          placeholderText="Recherchez par mots-clés"
          disabled={isReadonly}
        />
      </Field>
      <ActionsLieesCards actions={actions?.map(action => action.id)} />
    </>
  );
};

export default ActionsLiees;
