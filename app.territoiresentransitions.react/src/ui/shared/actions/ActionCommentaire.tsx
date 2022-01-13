import '../CrossExpandPanel.css';
import {makeAutoObservable} from 'mobx';
import {actionCommentaireRepository} from 'core-logic/api/repositories/ActionCommentaireRepository';
import {observer} from 'mobx-react-lite';
import {TextInput} from '@dataesr/react-dsfr';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {ActionReferentiel} from 'types/action_referentiel';

export const ActionCommentaire = ({action}: {action: ActionReferentiel}) => {
  const collectiviteId = useCollectiviteId()!;
  const observable = new ActionCommentaireFieldBloc({
    actionId: action.id,
    collectiviteId,
  });
  return (
    <div className="border-gray-300 my-3">
      <ActionCommentaireField
        observable={observable}
        label={
          action.type === 'action'
            ? "Description générale de l'état d'avancement"
            : "Précisions sur l'état d'avancement"
        }
        hint={
          action.type === 'action'
            ? "Vous pouvez préciser ici l'avancement général de cette action"
            : null
        }
      />
    </div>
  );
};

const ActionCommentaireField = observer(
  ({
    observable,
    label,
    hint,
  }: {
    observable: ActionCommentaireFieldBloc;
    label: string;
    hint: string | null;
  }) => (
    <TextInput
      textarea
      value={observable.fieldValue ?? ''}
      onChange={(event: {currentTarget: any}) =>
        observable.setFieldValue(event.currentTarget.value)
      }
      onBlur={() => observable.saveFieldValue()}
      label={label}
      hint={hint}
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
