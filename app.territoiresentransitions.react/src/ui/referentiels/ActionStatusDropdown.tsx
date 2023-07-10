import {useEffect, useState} from 'react';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {
  useActionStatut,
  useEditActionStatutIsDisabled,
  useSaveActionStatut,
} from 'core-logic/hooks/useActionStatut';
import {TActionAvancementExt} from 'types/alias';
import {
  ITEMS_AVEC_NON_CONCERNE,
  SelectActionStatut,
} from 'ui/shared/actions/SelectActionStatut';
import ActionProgressBar from './ActionProgressBar';
import AnchorAsButton from 'ui/buttons/AnchorAsButton';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import ProgressBarWithTooltip from 'ui/score/ProgressBarWithTooltip';
import {avancementToLabel} from 'app/labels';
import {actionAvancementColors} from 'app/theme';
import ScoreAutoModal from './ScoreAutoModal';
import ScorePersoModal from './ScorePersoModal';
import {
  getAvancementExt,
  getStatusFromIndex,
  statutParAvancement,
} from './utils';
import {SuiviScoreRow} from 'app/pages/collectivite/EtatDesLieux/Referentiel/data/useScoreRealise';

export type StatusToSavePayload = {
  actionId: string;
  statut: {
    action_id: string;
    avancement:
      | 'fait'
      | 'pas_fait'
      | 'programme'
      | 'non_renseigne'
      | 'detaille';
    avancement_detaille: number[] | null;
    collectivite_id: number;
    concerne: boolean;
    modified_at?: string;
    modified_by?: string;
  } | null;
  avancement: TActionAvancementExt;
  avancementDetaille?: number[];
};

export const ActionStatusDropdown = ({
  action,
  actionScores,
  onSaveStatus,
}: {
  action: ActionDefinitionSummary;
  actionScores: {[actionId: string]: SuiviScoreRow};
  onSaveStatus?: (payload: StatusToSavePayload) => void;
}) => {
  const collectivite = useCurrentCollectivite();

  const [openScoreAuto, setOpenScoreAuto] = useState(false);
  const [openScorePerso, setOpenScorePerso] = useState(false);

  const args = {
    action_id: action.id,
    collectivite_id: collectivite?.collectivite_id || 0,
  };
  const {statut, filled} = useActionStatut(action.id);
  const {avancement, avancement_detaille, concerne} = statut || {};

  const score = actionScores[action.id] ?? {};
  const {desactive} = score;
  const avancementExt = getAvancementExt({
    avancement,
    desactive,
    concerne,
  });

  const {saveActionStatut} = useSaveActionStatut();

  const [localAvancement, setLocalAvancement] = useState(avancementExt);
  const [localAvancementDetaille, setLocalAvancementDetaille] =
    useState(avancement_detaille);

  // Détermine si l'édition du statut est désactivée
  const disabled = useEditActionStatutIsDisabled(action.id);

  // Permet la mise à jour du dropdown si un autre élément
  // de la sous-action a changé de statut
  useEffect(() => {
    if (
      action.type === 'sous-action' &&
      avancementExt === 'non_renseigne' &&
      concerne !== false &&
      filled
    ) {
      setLocalAvancement('detaille');
    } else {
      setLocalAvancement(avancementExt);
    }
    setLocalAvancementDetaille(avancement_detaille);
  }, [avancementExt, avancement_detaille, concerne, filled]);

  // Mise à jour du statut lorsque une nouvelle valeur
  // est sélectionnée sur le dropdown
  const handleChange = (value: TActionAvancementExt) => {
    const {avancement, concerne, avancement_detaille} =
      statutParAvancement(value);

    if (avancement === 'detaille') {
      // Si "détaillé" est sélectionné sur une sous-action
      // qui contient des tâches, on ouvre simplement la modale associée
      // et la mise à jour se fera à la validation / fermeture de la modale
      if (action.type === 'sous-action' && action.children.length > 0) {
        setOpenScoreAuto(true);
      } else {
        setOpenScorePerso(true);
      }
    } else {
      // Mise à jour dans les cas de statuts autres que détaillé
      setLocalAvancement(value);
      setLocalAvancementDetaille(avancement_detaille);

      // Différencie la sauvegarde auto dans la page
      // de la mise à jour depuis la modale de score auto
      if (onSaveStatus) {
        onSaveStatus({
          actionId: action.id,
          statut,
          avancement: value,
          avancementDetaille: avancement_detaille,
        });
      } else {
        saveActionStatut({
          ...args,
          ...statut,
          avancement,
          avancement_detaille,
          concerne,
        });
      }
    }
  };

  // Mise à jour des statuts des tâches d'une sous-action
  // à la validation dans la modale de score auto
  const handleSaveScoreAuto = (newStatus: StatusToSavePayload[]) => {
    setOpenScoreAuto(false);
    setLocalAvancement(newStatus.length ? 'detaille' : 'non_renseigne');
    setLocalAvancementDetaille(undefined);

    // Sauvegarde des statuts des tâches
    newStatus.forEach(element => {
      const {avancement, concerne} = statutParAvancement(element.avancement);

      saveActionStatut({
        action_id: element.actionId,
        avancement,
        avancement_detaille: element.avancementDetaille,
        collectivite_id: args.collectivite_id,
        concerne,
        modified_at: element.statut?.modified_at,
        modified_by: element.statut?.modified_by,
      });
    });

    // Si "détaillé" est sélectionné sur une sous-action
    // cela correspond en base à un statut "non renseigné"
    // avec statuts au niveau des tâches
    // Si aucune tâche n'est remplie, le statut de la sous-action
    // passe à "non renseigné"
    // Le setTimeout évite des problèmes de raffraichissement de la jauge
    setTimeout(() => {
      saveActionStatut({
        ...args,
        avancement: 'non_renseigne',
        concerne: true,
        modified_at: statut?.modified_at,
        modified_by: statut?.modified_by,
      });
    }, 100);
  };

  // Mise à jour du statut à la validation dans la modale
  // de score perso
  const handleSaveScorePerso = (values: number[]) => {
    setOpenScorePerso(false);

    // Si la jauge est à 100% dans un des statuts, le statut
    // est mis à jour automatiquement
    const avancement =
      values[0] === 1
        ? 'fait'
        : values[1] === 1
        ? 'programme'
        : values[2] === 1
        ? 'pas_fait'
        : 'detaille';

    setLocalAvancement(avancement);
    setLocalAvancementDetaille(values);

    // Différencie la sauvegarde auto dans la page
    // de la mise à jour depuis la modale de score auto
    if (onSaveStatus) {
      onSaveStatus({
        actionId: action.id,
        statut,
        avancement,
        avancementDetaille: values,
      });
    } else {
      saveActionStatut({
        ...statut,
        ...args,
        avancement,
        avancement_detaille: values,
        concerne: true,
      });
    }
  };

  if (!collectivite) {
    return null;
  }

  return (
    <div
      className="flex flex-col gap-3 items-end w-fit ml-auto"
      onClick={evt => evt.stopPropagation()}
    >
      {/* Dropdown avec suppression de l'option "non renseigné" sur les sous-actions 
      quand au moins une des tâches a un statut */}
      <SelectActionStatut
        items={
          action.type === 'sous-action' &&
          localAvancement !== 'non_renseigne' &&
          filled
            ? ITEMS_AVEC_NON_CONCERNE.filter(item => item !== 'non_renseigne')
            : ITEMS_AVEC_NON_CONCERNE
        }
        disabled={disabled}
        value={localAvancement}
        onChange={handleChange}
      />

      {/* Cas particulier des statuts "détaillé" */}
      {localAvancement === 'detaille' && !score?.desactive && (
        <div className="flex flex-col gap-3 items-end w-full pr-1">
          {/* Affichage de la jauge de score sur les tâches */}
          {action.type === 'tache' &&
            (onSaveStatus === undefined ? (
              <ActionProgressBar action={action} />
            ) : (
              <ProgressBarWithTooltip
                score={
                  localAvancementDetaille?.map((a, idx) => ({
                    value: a,
                    label: avancementToLabel[getStatusFromIndex(idx)],
                    color: actionAvancementColors[getStatusFromIndex(idx)],
                  })) ?? []
                }
                total={score.points_max_referentiel ?? 0}
                defaultScore={{
                  label: avancementToLabel.non_renseigne,
                  color: actionAvancementColors.non_renseigne,
                }}
                valueToDisplay={avancementToLabel.fait}
                percent
              />
            ))}

          {/* Bouton d'ouverture de la modale pour détailler le score */}
          {!disabled && (
            <AnchorAsButton
              className="underline_href fr-link fr-link--sm"
              onClick={() =>
                action.type === 'sous-action' && action.children.length > 0
                  ? setOpenScoreAuto(true)
                  : setOpenScorePerso(true)
              }
            >
              Détailler l'avancement
            </AnchorAsButton>
          )}
        </div>
      )}

      {/* Modale de score auto / par tâche (pour les sous-actions) */}
      {openScoreAuto && (
        <ScoreAutoModal
          action={action}
          actionScores={actionScores}
          externalOpen={openScoreAuto}
          setExternalOpen={setOpenScoreAuto}
          onSaveScore={handleSaveScoreAuto}
          onClose={() => setOpenScoreAuto(false)}
        />
      )}

      {/* Modale de personnalisation du score (avec jauge manuelle) */}
      {openScorePerso && (
        <ScorePersoModal
          actionId={action.id}
          actionType={action.type}
          avancementDetaille={localAvancementDetaille}
          externalOpen={openScorePerso}
          saveAtValidation={onSaveStatus === undefined}
          setExternalOpen={setOpenScorePerso}
          onSaveScore={handleSaveScorePerso}
        />
      )}
    </div>
  );
};
