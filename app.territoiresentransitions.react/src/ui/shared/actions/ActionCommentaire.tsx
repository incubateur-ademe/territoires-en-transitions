import '../CrossExpandPanel.css';
import {makeAutoObservable} from 'mobx';
import {actionCommentaireRepository} from 'core-logic/api/repositories/ActionCommentaireRepository';
import {observer} from 'mobx-react-lite';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {AutoTextArea} from '../AutoTextArea';
import {ActionDefinitionSummary} from 'core-logic/api/procedures/referentielProcedures';

export const ActionCommentaire = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const collectiviteId = useCollectiviteId()!;
  const observable = new ActionCommentaireFieldBloc({
    actionId: action.id,
    collectiviteId,
  });
  return (
    <div className="border-gray-300 my-3">
      <ActionCommentaireField observable={observable} action={action} />
    </div>
  );
};

export const ActionCommentaireField = observer(
  ({
    observable,
    action,
    ...otherProps
  }: {
    observable: ActionCommentaireFieldBloc;
    action: ActionDefinitionSummary;
  }) => (
    <AutoTextArea
      value={observable.fieldValue ?? ''}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
        observable.setFieldValue(event.currentTarget.value)
      }
      onBlur={() => observable.saveFieldValue()}
      label={
        action.type === 'action'
          ? "Description générale de l'état d'avancement"
          : "Précisions sur l'état d'avancement"
      }
      hint={
        action.type === 'action'
          ? "Description générale de l'état d'avancement"
          : "Précisions sur l'état d'avancement"
      }
      disabled={currentCollectiviteBloc.readonly}
      {...otherProps}
    />
  )
);

class ActionCommentaireFieldBloc {
  private readonly collectiviteId: number;
  private readonly actionId: string;
  fieldValue: string | null = null;

  constructor({
    actionId,
    collectiviteId,
  }: {
    collectiviteId: number;
    actionId: string;
  }) {
    makeAutoObservable(this);
    this.collectiviteId = collectiviteId;
    this.actionId = actionId;
    this.fetch();
  }

  setFieldValue(fieldValue: string | null) {
    this.fieldValue = fieldValue;
  }

  saveFieldValue() {
    actionCommentaireRepository.save({
      action_id: this.actionId,
      collectivite_id: this.collectiviteId,
      commentaire: this.fieldValue ?? '',
    });
  }

  fetch() {
    actionCommentaireRepository
      .fetch({
        collectiviteId: this.collectiviteId,
        actionId: this.actionId,
      })
      .then(fetched => {
        this.setFieldValue(
          fetched?.commentaire !== '' ? fetched?.commentaire ?? null : null
        );
      });
  }
}
