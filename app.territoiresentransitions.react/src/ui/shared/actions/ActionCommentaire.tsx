import '../CrossExpandPanel.css';
import {makeAutoObservable} from 'mobx';
import {actionCommentaireRepository} from 'core-logic/api/repositories/ActionCommentaireRepository';
import {observer} from 'mobx-react-lite';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {useCollectiviteId} from 'core-logic/hooks';

export const ActionCommentaire = ({actionId}: {actionId: string}) => {
  const collectiviteId = useCollectiviteId()!;
  const observable = new ActionCommentaireFieldBloc({actionId, collectiviteId});
  return (
    <div className="border-gray-300 my-3">
      <ActionCommentaireField observable={observable} />
    </div>
  );
};

const ActionCommentaireField = observer(
  ({observable}: {observable: ActionCommentaireFieldBloc}) => (
    <textarea
      name="commentaire"
      value={observable.fieldValue ?? ''}
      onChange={event => observable.setFieldValue(event.currentTarget.value)}
      onBlur={_ => observable.saveFieldValue()}
      className="fr-input mt-2 w-full bg-white p-3 mr-5"
      disabled={currentCollectiviteBloc.readonly}
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
