import {makeCollectiviteTacheUrl} from 'app/paths';
import {IActionStatutsRead} from 'generated/dataLayer/action_statuts_read';
import ActionStatutBadge from 'ui/shared/actions/ActionStatutBadge';
import FormField from 'ui/shared/form/FormField';
import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';
import {TOption} from 'ui/shared/select/commons';
import ActionCard from '../../components/ActionCard';
import {useActionListe} from '../data/options/useActionListe';
import {TActionRelationInsert} from '../data/types/alias';
import {useCollectiviteId} from 'core-logic/hooks/params';

type Props = {
  actions: TActionRelationInsert[] | null;
  onSelect: (actions: TActionRelationInsert[]) => void;
  isReadonly: boolean;
};

const ActionsLiees = ({actions, onSelect, isReadonly}: Props) => {
  const {data: actionListe} = useActionListe();
  const collectiviteId = useCollectiviteId()!;

  const actionsLiees =
    actionListe?.filter((action: IActionStatutsRead) =>
      actions?.some(v => v.id === action.action_id)
    ) ?? [];

  const formatOptions = (actions?: IActionStatutsRead[] | null): TOption[] => {
    const options = actions
      ? actions.map((action: IActionStatutsRead) => ({
          value: action.action_id,
          label: `${action.referentiel} ${action.identifiant} - ${action.nom}`,
        }))
      : [];

    return options;
  };

  const formatSelectActions = (values: string[]): TActionRelationInsert[] => {
    const selectedActions =
      actionListe?.filter((action: IActionStatutsRead) =>
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
      <FormField label="Actions liées">
        <AutocompleteInputSelect
          containerWidthMatchButton
          values={actions?.map((action: TActionRelationInsert) => action.id)}
          options={formatOptions(actionListe)}
          onSelect={values => onSelect(formatSelectActions(values))}
          placeholderText={
            actions && actions?.length > 0
              ? 'Recherchez par mots-clés'
              : 'Recherchez par mots-clés ou sélectionnez dans la liste'
          }
          disabled={isReadonly}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-8 mt-2">
        {actionsLiees.map(action => (
          <ActionCard
            key={action.action_id}
            link={makeCollectiviteTacheUrl({
              collectiviteId: collectiviteId,
              actionId: action.action_id,
              referentielId: action.referentiel,
            })}
            statutBadge={
              action.avancement && (
                <ActionStatutBadge statut={action.avancement} small />
              )
            }
            details={`Référentiel ${
              action.referentiel === 'cae'
                ? 'Climat Air Énergie'
                : 'Économie circulaire'
            }`}
            title={`${action.identifiant} ${action.nom}`}
          />
        ))}
      </div>
    </>
  );
};

export default ActionsLiees;
