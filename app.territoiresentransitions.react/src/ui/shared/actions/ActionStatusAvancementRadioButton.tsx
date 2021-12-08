import {avancementLabels} from 'app/labels';
import * as R from 'ramda';
import type {Option, Options} from 'types';
import {AvancementRadioButton} from 'ui/shared/AvancementRadioButton';

import {Avancement} from 'generated/dataLayer/action_statut_read';
import {actionStatutRepository} from 'core-logic/api/repositories/ActionStatutRepository';
import {makeAutoObservable} from 'mobx';
import {observer} from 'mobx-react-lite';
import {currentCollectiviteBloc} from 'core-logic/observables/collectiviteBloc';
import {useCollectiviteId} from 'core-logic/hooks';

const avancements: Options<Avancement> = R.values(
  R.mapObjIndexed((label, value) => ({value, label}), avancementLabels)
);

export const ActionStatusAvancementRadioButton = ({
  actionId,
}: {
  actionId: string;
}) => {
  const collectiviteId = useCollectiviteId()!;
  console.log('collectiviteId: ', collectiviteId);
  const actionStatusAvancementBloc = new ActionStatusAvancementRadioButtonBloc({
    actionId,
    collectiviteId,
  });
  return (
    <_ActionStatusAvancementRadioButton
      actionStatusAvancementBloc={actionStatusAvancementBloc}
    />
  );
};

const _ActionStatusAvancementRadioButton = observer(
  ({
    actionStatusAvancementBloc,
  }: {
    actionStatusAvancementBloc: ActionStatusAvancementRadioButtonBloc;
  }) => {
    const avancement = actionStatusAvancementBloc.avancement;
    return (
      <AvancementRadioButton
        avancements={avancements}
        optionIsChecked={({option}) => avancement === option.value}
        onClick={evt =>
          actionStatusAvancementBloc.pickAvancementOption(evt.option)
        }
      />
    );
  }
);

class ActionStatusAvancementRadioButtonBloc {
  private actionId: string;
  private collectiviteId: number;
  avancement: Avancement = 'non_renseigne';
  concerne = true;

  constructor({
    actionId,
    collectiviteId,
  }: {
    collectiviteId: number;
    actionId: string;
  }) {
    makeAutoObservable(this);
    this.actionId = actionId;
    this.collectiviteId = collectiviteId;
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
        collectivite_id: this.collectiviteId,
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
        collectiviteId: this.collectiviteId,
      })
      .then(fetched => {
        if (fetched) this.setAvancement(fetched.avancement);
      });
  }
}
