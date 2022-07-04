import {Dialog, MenuItem, Select} from '@material-ui/core';
import {SelectInputProps} from '@material-ui/core/Select/SelectInput';
import {actionAvancementColors} from 'app/theme';
import {actionStatutRepository} from 'core-logic/api/repositories/ActionStatutRepository';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {useActionScore} from 'core-logic/observables/scoreHooks';
import {
  ActionAvancement,
  ActionStatutRead,
} from 'generated/dataLayer/action_statut_read';
import {ActionStatutWrite} from 'generated/dataLayer/action_statut_write';
import {makeAutoObservable} from 'mobx';
import {useState} from 'react';
import {toPercentString} from 'utils/score';
import {CloseDialogButton} from '../CloseDialogButton';
import {DetailedScore} from '../DetailedScore/DetailedScore';
import {AvancementValues} from '../DetailedScore/DetailedScoreSlider';

export const ActionStatusDropdown = ({actionId}: {actionId: string}) => {
  const collectiviteId = useCollectiviteId()!;
  const actionStatusAvancementBloc = new ActionStatusAvancementRadioButtonBloc({
    actionId,
    collectiviteId,
  });

  return (
    <_ActionStatusAvancementRadioButton
      actionId={actionId}
      actionStatusAvancementBloc={actionStatusAvancementBloc}
    />
  );
};

interface SelectableStatut {
  value: number;
  color: string;
  concerne: boolean;
  avancement: ActionAvancement;
  avancement_detaille?: number[];
  label: string;
}

const DEFAULT_DETAIL_VALUES = [0.3, 0.4, 0.3];

const faitStatut: SelectableStatut = {
  value: 1,
  color: actionAvancementColors.fait,
  concerne: true,
  avancement: 'fait',
  avancement_detaille: [1, 0, 0],
  label: 'Fait',
};

const programmeStatut: SelectableStatut = {
  value: 2,
  color: actionAvancementColors.programme,
  concerne: true,
  avancement: 'programme',
  avancement_detaille: [0, 1, 0],
  label: 'Programmé',
};

const pasFaitStatut: SelectableStatut = {
  value: 3,
  color: actionAvancementColors.pas_fait,
  concerne: true,
  avancement: 'pas_fait',
  avancement_detaille: [0, 0, 1],
  label: 'Pas fait',
};

const nonRenseigneStatut: SelectableStatut = {
  value: -1,
  color: actionAvancementColors.non_renseigne,
  concerne: true,
  avancement: 'non_renseigne',
  label: 'Non renseigné',
};

const detailleStatut: SelectableStatut = {
  value: 4,
  color: actionAvancementColors.detaille,
  concerne: true,
  avancement: 'detaille',
  avancement_detaille: DEFAULT_DETAIL_VALUES,
  label: 'Détaillé',
};

const nonConcerneStatut: SelectableStatut = {
  value: 5,
  color: actionAvancementColors.non_concerne,
  concerne: false,
  avancement: 'non_renseigne',
  label: 'Non concerné',
};

const selectables = [
  nonRenseigneStatut,
  faitStatut,
  programmeStatut,
  pasFaitStatut,
  detailleStatut,
  nonConcerneStatut,
];

const _ActionStatusAvancementRadioButton = ({
  actionId,
  actionStatusAvancementBloc,
}: {
  actionId: string;
  actionStatusAvancementBloc: ActionStatusAvancementRadioButtonBloc;
}) => {
  const [opened, setOpened] = useState(false);

  const handleChange: SelectInputProps['onChange'] = event => {
    actionStatusAvancementBloc
      .pickStatutValue(event.target.value as number)
      .then(() => {
        if (actionStatusAvancementBloc.statut.avancement === 'detaille') {
          setOpened(true);
        }
      });
  };

  const handleSaveDetail = (values: number[]) => {
    actionStatusAvancementBloc.setAvancementDetaille(values);
    actionStatusAvancementBloc.saveStatut();
    setOpened(false);
  };

  const {statut} = actionStatusAvancementBloc;
  const {avancement, avancement_detaille} = statut;

  const score = useActionScore(actionId);
  const currentStatus = score?.desactive
    ? // affiche le statut "non concerné" quand l'action est désactivée par la personnalisation
      nonConcerneStatut.value
    : // sinon le statut courant ou à défaut "non renseigné"
      statut.value ?? nonRenseigneStatut.value;

  return (
    <div className="flex flex-col w-full">
      <Select
        value={currentStatus}
        onChange={handleChange}
        displayEmpty
        inputProps={{'aria-label': 'Without label'}}
        disabled={currentCollectiviteBloc.readonly || score?.desactive}
      >
        {selectables.map(({value, color, label}) => (
          <MenuItem key={value} value={value}>
            <span style={{color: color}}>&#9679;</span>
            &nbsp;{label}
          </MenuItem>
        ))}
      </Select>
      {avancement === 'detaille' && !score?.desactive ? (
        <>
          {avancement_detaille?.length === 3 ? (
            <ul className="mt-6 text-sm">
              <li>
                Fait :&nbsp;
                {toPercentString(avancement_detaille[0])}
              </li>
              <li>
                Programmé :&nbsp;
                {toPercentString(avancement_detaille[1])}
              </li>
              <li>
                Pas fait :&nbsp;
                {toPercentString(avancement_detaille[2])}
              </li>
            </ul>
          ) : null}
          <button className="fr-btn fr-btn--sm" onClick={() => setOpened(true)}>
            Préciser l'avancement
          </button>
          <Dialog
            open={opened}
            onClose={() => setOpened(false)}
            maxWidth="sm"
            fullWidth={true}
          >
            <div className="p-7 flex flex-col items-center">
              <CloseDialogButton setOpened={setOpened} />
              <h3 className="pb-4">Préciser l’avancement de cette tâche</h3>
              <div className="w-full">
                <DetailedScore
                  avancement={
                    (avancement_detaille?.length === 3
                      ? avancement_detaille
                      : DEFAULT_DETAIL_VALUES) as AvancementValues
                  }
                  onSave={handleSaveDetail}
                />
              </div>
            </div>
          </Dialog>
        </>
      ) : null}
    </div>
  );
};

class ActionStatusAvancementRadioButtonBloc {
  private actionId: string;
  private collectiviteId: number;
  private avancement: ActionAvancement = 'non_renseigne';
  public avancement_detaille?: number[] | undefined;
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

  private setStatut = (s: SelectableStatut) => (this._statut = s);
  private setAvancement = (a: ActionAvancement) => (this.avancement = a);
  public setAvancementDetaille = (a: number[] | undefined) =>
    (this.avancement_detaille = a);
  private setConcerne = (c: boolean) => (this.concerne = c);

  public async pickStatutValue(value: number) {
    const statut = ActionStatusAvancementRadioButtonBloc.statutByValue(value);
    this.setStatut(statut);
    this.setAvancement(statut.avancement);
    this.setConcerne(statut.concerne);
    this.setAvancementDetaille(statut.avancement_detaille);
    this.saveStatut();
  }

  get statut(): SelectableStatut {
    return this._statut;
  }

  public saveStatut() {
    actionStatutRepository
      .save({
        action_id: this.actionId,
        collectivite_id: this.collectiviteId,
        avancement: this.avancement,
        avancement_detaille: this.avancement_detaille,
        concerne: this.concerne,
      })
      .then(saved => {
        if (saved) {
          this.setStatut(
            ActionStatusAvancementRadioButtonBloc.statutByEntity(saved)
          );
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
          this.setStatut(
            ActionStatusAvancementRadioButtonBloc.statutByEntity(fetched)
          );
        }
      });
  }

  public static statutByValue(value: number): SelectableStatut {
    return selectables.find(s => s.value === value)!;
  }

  public static statutByEntity(
    entity: ActionStatutWrite | ActionStatutRead
  ): SelectableStatut {
    const ret = selectables.find(
      s => s.concerne === entity.concerne && s.avancement === entity.avancement
    )!;
    return ret.avancement === 'detaille'
      ? {...ret, avancement_detaille: entity.avancement_detaille || []}
      : ret;
  }
}
