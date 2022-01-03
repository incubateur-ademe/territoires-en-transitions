import {Avancement} from 'generated/dataLayer/action_statut_read';
import {actionStatutRepository} from 'core-logic/api/repositories/ActionStatutRepository';
import {makeAutoObservable} from 'mobx';
import {observer} from 'mobx-react-lite';
import {useCollectiviteId} from 'core-logic/hooks';
import React, {useEffect, useState} from 'react';
import {MenuItem, Select} from '@material-ui/core';

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
  color: '#04C200',
  concerne: true,
  avancement: 'fait',
  label: 'Fait',
};

const programmeStatut: SelectableStatut = {
  value: 2,
  color: '#FDE406',
  concerne: true,
  avancement: 'programme',
  label: 'Programmé',
};

const pasFaitStatut: SelectableStatut = {
  value: 3,
  color: '#FD0606',
  concerne: true,
  avancement: 'pas_fait',
  label: 'Pas fait',
};

const nonRenseigneStatut: SelectableStatut = {
  value: -1,
  color: '#000000',
  concerne: true,
  avancement: 'non_renseigne',
  label: 'Non renseigné',
};

const nonConcerneStatut: SelectableStatut = {
  value: 5,
  color: '#757575',
  concerne: false,
  avancement: 'non_renseigne',
  label: 'Non concerné',
};

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
        .then(() => setValue(actionStatusAvancementBloc.statut.value));
    };

    return (
      <Select
        value={value}
        onChange={handleChange}
        displayEmpty
        inputProps={{'aria-label': 'Without label'}}
      >
        {actionStatusAvancementBloc.selectables.map(statut => (
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

  public selectables = [
    nonRenseigneStatut,
    faitStatut,
    programmeStatut,
    pasFaitStatut,
    nonConcerneStatut,
  ];

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

  public async pickStatutValue(value: number | null) {
    const statut = this.selectables.find(s => s.value === value)!;
    this._statut = statut;
    this.avancement = statut.avancement;
    this.concerne = statut.concerne;
    await this.saveStatut();
  }

  get statut(): SelectableStatut {
    return this._statut;
  }

  private setAvancement(avancement: Avancement) {
    this._statut =
      this.selectables.find(s => s.avancement === avancement) ??
      nonRenseigneStatut;
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
        if (fetched) {
          this.setAvancement(fetched.avancement);
        }
      });
  }
}
