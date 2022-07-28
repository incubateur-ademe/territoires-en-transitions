import {useState} from 'react';
import {Dialog, MenuItem, Select} from '@material-ui/core';
import {SelectInputProps} from '@material-ui/core/Select/SelectInput';
import {actionAvancementColors} from 'app/theme';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useActionScore} from 'core-logic/hooks/scoreHooks';
import {
  useActionStatut,
  useSaveActionStatut,
} from 'core-logic/hooks/useActionStatut';
import {
  ActionAvancement,
  ActionStatutRead,
} from 'generated/dataLayer/action_statut_read';
import {toPercentString} from 'utils/score';
import {CloseDialogButton} from '../CloseDialogButton';
import {DetailedScore} from '../DetailedScore/DetailedScore';
import {AvancementValues} from '../DetailedScore/DetailedScoreSlider';

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
  avancement_detaille: [0.3, 0.4, 0.3],
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

export const ActionStatusDropdown = ({actionId}: {actionId: string}) => {
  const [opened, setOpened] = useState(false);

  const collectivite = useCurrentCollectivite();
  const args = {
    action_id: actionId,
    collectivite_id: collectivite?.collectivite_id || 0,
  };
  const {statut} = useActionStatut(args);
  const {avancement, avancement_detaille} = statut || {};

  const score = useActionScore(actionId);
  const currentOptionFromStatut = statut ? valueByStatut(statut) : null;
  const currentStatus = score?.desactive
    ? // affiche le statut "non concerné" quand l'action est désactivée par la personnalisation
      nonConcerneStatut.value
    : // sinon le statut courant ou à défaut "non renseigné"
      currentOptionFromStatut?.value || nonRenseigneStatut.value;

  const {saveActionStatut} = useSaveActionStatut(args);

  const handleChange: SelectInputProps['onChange'] = event => {
    const {avancement, concerne, avancement_detaille} = statutByValue(
      event.target.value as number
    );
    saveActionStatut({
      ...args,
      ...statut,
      avancement,
      concerne,
      avancement_detaille,
    });
    if (avancement === 'detaille') {
      setOpened(true);
    }
  };

  const handleSaveDetail = (values: number[]) => {
    if (statut) {
      saveActionStatut({
        ...args,
        ...statut,
        avancement: 'detaille',
        avancement_detaille: values,
      });
      setOpened(false);
    }
  };

  if (!collectivite) {
    return null;
  }

  return (
    <div className="flex flex-col w-full">
      <Select
        value={currentStatus}
        onChange={handleChange}
        displayEmpty
        inputProps={{'aria-label': 'Without label'}}
        disabled={collectivite.readonly || score?.desactive}
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

const statutByValue = (value: number): SelectableStatut => {
  return selectables.find(s => s.value === value)!;
};

const valueByStatut = (statut: ActionStatutRead): SelectableStatut => {
  const ret = selectables.find(
    s => s.concerne === statut.concerne && s.avancement === statut.avancement
  )!;
  return ret.avancement === 'detaille'
    ? {...ret, avancement_detaille: statut.avancement_detaille || []}
    : ret;
};
