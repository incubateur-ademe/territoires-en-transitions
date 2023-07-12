import {makeCollectiviteTacheUrl} from 'app/paths';
import {TActionStatutsRow} from 'types/alias';
import ActionStatutBadge from 'ui/shared/actions/ActionStatutBadge';
import FormField from 'ui/shared/form/FormField';
import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';
import {TOption} from 'ui/shared/select/commons';
import ActionCard from '../../components/ActionCard';
import {useActionListe} from '../data/options/useActionListe';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TActionRelationInsert} from 'types/alias';
import {referentielToName} from 'app/labels';

type Props = {
  actions: TActionRelationInsert[] | null;
  onSelect: (actions: TActionRelationInsert[]) => void;
  isReadonly: boolean;
};

const ActionsLiees = ({actions, onSelect, isReadonly}: Props) => {
  const {data: actionListe} = useActionListe();
  const collectiviteId = useCollectiviteId()!;

  const actionsLiees =
    actionListe?.filter((action: TActionStatutsRow) =>
      actions?.some(v => v.id === action.action_id)
    ) ?? [];

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
      <FormField label="Actions des référentiels liées">
        <AutocompleteInputSelect
          dsfrButton
          containerWidthMatchButton
          values={actions?.map((action: TActionRelationInsert) => action.id)}
          options={formatOptions(actionListe)}
          onSelect={values => onSelect(formatSelectActions(values))}
          placeholderText="Recherchez par mots-clés"
          disabled={isReadonly}
        />
      </FormField>
      {actionsLiees.length > 0 && (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {actionsLiees.map(action => (
            <ActionCard
              key={action.action_id}
              openInNewTab
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
              details={`Référentiel ${referentielToName[action.referentiel]}`}
              title={`${action.identifiant} ${action.nom}`}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default ActionsLiees;
