import {
  ActionStatutRead,
  Avancement,
} from 'generated/dataLayer/action_statut_read';
import {actionStatutRepository} from 'core-logic/api/repositories/ActionStatutRepository';
import {makeAutoObservable} from 'mobx';
import {observer} from 'mobx-react-lite';
import {useCollectiviteId} from 'core-logic/hooks';
import {useEffect, useState} from 'react';
import {MenuItem, Select} from '@material-ui/core';
import {avancementColors} from 'app/colors';
import {ActionStatutWrite} from 'generated/dataLayer/action_statut_write';

export const ActionStatusDropdown = ({actionId}: {actionId: string}) => {
  const collectiviteId = useCollectiviteId()!;
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

interface SelectableStatut {
  value: number;
  color: string;
  concerne: boolean;
  avancement: Avancement;
  label: string;
}

const faitStatut: SelectableStatut = {
  value: 1,
  color: avancementColors.fait,
  concerne: true,
  avancement: 'fait',
  label: 'Fait',
};

const programmeStatut: SelectableStatut = {
  value: 2,
  color: avancementColors.programme,
  concerne: true,
  avancement: 'programme',
  label: 'Programmé',
};

const pasFaitStatut: SelectableStatut = {
  value: 3,
  color: avancementColors.pas_fait,
  concerne: true,
  avancement: 'pas_fait',
  label: 'Pas fait',
};

const nonRenseigneStatut: SelectableStatut = {
  value: -1,
  color: avancementColors.non_renseigne,
  concerne: true,
  avancement: 'non_renseigne',
  label: 'Non renseigné',
};

const nonConcerneStatut: SelectableStatut = {
  value: 5,
  color: avancementColors.non_concerne,
  concerne: false,
  avancement: 'non_renseigne',
  label: 'Non concerné',
};

const selectables = [
  nonRenseigneStatut,
  faitStatut,
  programmeStatut,
  pasFaitStatut,
  nonConcerneStatut,
];

const _ActionStatusAvancementRadioButton = observer(
  ({
    actionStatusAvancementBloc,
  }: {
    actionStatusAvancementBloc: ActionStatusAvancementRadioButtonBloc;
  }) => {
    const [value, setValue] = useState<number | null>(null);
    useEffect(
      () => setValue(actionStatusAvancementBloc.statut.value),
      [actionStatusAvancementBloc.statut.value]
    );
    const handleChange = (event: {target: any}) => {
      actionStatusAvancementBloc
        .pickStatutValue(event.target.value)
        .then(() => {
          return setValue(actionStatusAvancementBloc.statut.value);
        });
    };

    return (
      <Select
        value={value}
        onChange={handleChange}
        displayEmpty
        inputProps={{'aria-label': 'Without label'}}
      >
        {selectables.map(statut => (
          <MenuItem key={statut.value} value={statut.value}>
            <span style={{color: statut.color}}>&#9679;</span>{' '}
            <>{statut.label}</>
          </MenuItem>
        ))}
      </Select>
    );
  }
);

class ActionStatusAvancementRadioButtonBloc {
  private actionId: string;
  private collectiviteId: number;
  private avancement: Avancement = 'non_renseigne';
  private concerne = true;
  private _statut: SelectableStatut = nonRenseigneStatut;

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

  public async pickStatutValue(value: number) {
    const statut = ActionStatusAvancementRadioButtonBloc.statutByValue(value);
    this._statut = statut;
    this.avancement = statut.avancement;
    this.concerne = statut.concerne;
    await this.saveStatut();
  }

  get statut(): SelectableStatut {
    return this._statut;
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
          this._statut =
            ActionStatusAvancementRadioButtonBloc.statutByEntity(saved);
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
        if (fetched) {
          this._statut =
            ActionStatusAvancementRadioButtonBloc.statutByEntity(fetched);
        }
      });
  }

  public static statutByValue(value: number): SelectableStatut {
    return selectables.find(s => s.value === value)!;
  }

  public static statutByEntity(
    entity: ActionStatutWrite | ActionStatutRead
  ): SelectableStatut {
    return selectables.find(
      s => s.concerne === entity.concerne && s.avancement === entity.avancement
    )!;
  }
}
