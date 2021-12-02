import {avancementLabels} from 'app/labels';
import * as R from 'ramda';
import type {Option, Options} from 'types';
import {AvancementRadioButton} from 'ui/shared/AvancementRadioButton';

import {Avancement} from 'generated/dataLayer/action_statut_read';
import {actionStatutRepository} from 'core-logic/api/repositories/ActionStatutRepository';
import {makeAutoObservable} from 'mobx';
import {observer} from 'mobx-react-lite';

const avancements: Options<Avancement> = R.values(
  R.mapObjIndexed((label, value) => ({value, label}), avancementLabels)
);

export const ActionStatusAvancementRadioButton = ({
  actionId,
}: {
  actionId: string;
}) => {
  const epciId = 1; // TODO !
  const observable = new ActionStatusAvancementRadioButtonBloc({
    actionId,
    epciId,
  });
  return <_ActionStatusAvancementRadioButton observable={observable} />;
};

const _ActionStatusAvancementRadioButton = observer(
  ({observable}: {observable: ActionStatusAvancementRadioButtonBloc}) => {
    const avancement = observable.avancement;
    return (
      <AvancementRadioButton
        avancements={avancements}
        optionIsChecked={({option}) => avancement === option.value}
        onClick={evt => observable.pickAvancementOption(evt.option)}
      />
    );
  }
);

class ActionStatusAvancementRadioButtonBloc {
  private actionId: string;
  private epciId: number;
  avancement: Avancement = 'non_renseigne';
  concerne = true;

  constructor({actionId, epciId}: {epciId: number; actionId: string}) {
    makeAutoObservable(this);
    this.actionId = actionId;
    this.epciId = epciId;
    this.fetch();
  }

  public async pickAvancementOption(option: Option<Avancement>) {
    const wasChecked = option.value === this.avancement;
    // If option was previously checked, then unselect it.
    this.setAvancement(wasChecked ? 'non_renseigne' : option.value);
    await this.saveStatut();
  }

  private setAvancement(avancement: Avancement) {
    console.log(this.actionId, avancement);
    this.avancement = avancement;
  }

  private setConcerne(concerne: boolean) {
    this.concerne = concerne;
  }

  private saveStatut() {
    actionStatutRepository
      .save({
        action_id: this.actionId,
        epci_id: this.epciId,
        avancement: this.avancement,
        concerne: this.concerne,
      })
      .then(saved => {
        if (saved) {
          this.setAvancement(saved.avancement);
          this.setConcerne(saved.concerne);
        }
      });
  }

  private fetch() {
    actionStatutRepository
      .fetch({
        actionId: this.actionId,
        epciId: this.epciId,
      })
      .then(fetched => {
        if (fetched) this.setAvancement(fetched.avancement);
      });
  }
}
