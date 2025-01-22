import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import {
  ITEMS_AVEC_NON_CONCERNE,
  SelectActionStatut,
} from '@/app/referentiels/actions/action-statut.select';
import { useScoreRealise } from '@/app/referentiels/actions/useScoreRealise';
import ProgressBarWithTooltip from '@/app/referentiels/scores/progress-bar-with-tooltip';
import {
  useActionStatut,
  useEditActionStatutIsDisabled,
  useSaveActionStatut,
} from '@/app/referentiels/use-action-statut';
import { TActionAvancement, TActionAvancementExt } from '@/app/types/alias';
import { Button, Tooltip } from '@/ui';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { useScore, useSnapshotFlagEnabled } from '../use-snapshot';
import {
  getAvancementExt,
  getStatusFromIndex,
  statutParAvancement,
} from '../utils';
import ActionProgressBar from './action.progress-bar';
import ScoreAutoModal from './sub-action.detail/ScoreAutoModal';
import ScoreDetailleModal from './sub-action.detail/ScoreDetailleModal';

export type StatusToSavePayload = {
  actionId: string;
  statut: {
    action_id: string;
    avancement: TActionAvancement;
    avancement_detaille: number[] | null;
    collectivite_id: number;
    concerne: boolean;
    modified_at?: string;
    modified_by?: string;
  } | null;
  avancement: TActionAvancementExt;
  avancementDetaille?: number[];
};

export const SubActionStatutDropdown = ({
  actionDefinition,
  statusWarningMessage = false,
  onSaveStatus,
}: {
  actionDefinition: ActionDefinitionSummary;
  statusWarningMessage?: boolean;
  onSaveStatus?: (payload: StatusToSavePayload) => void;
}) => {
  const DEPRECATED_actionScores = useScoreRealise(actionDefinition);
  const NEW_score = useScore(actionDefinition.id);
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();

  const collectivite = useCurrentCollectivite();

  const [openScoreAuto, setOpenScoreAuto] = useState(false);
  const [openScoreDetaille, setOpenScoreDetaille] = useState(false);
  const [openScorePerso, setOpenScorePerso] = useState(false);

  const args = {
    action_id: actionDefinition.id,
    collectivite_id: collectivite?.collectiviteId || 0,
  };
  const { statut, filled } = useActionStatut(actionDefinition.id);
  const { avancement, avancement_detaille, concerne } = statut || {};

  const score = FLAG_isSnapshotEnabled
    ? NEW_score
    : DEPRECATED_actionScores[actionDefinition.id];

  const desactive = score?.desactive;

  const avancementExt = getAvancementExt({
    avancement,
    desactive,
    concerne,
  });

  const { saveActionStatut } = useSaveActionStatut();

  const [localAvancement, setLocalAvancement] = useState(avancementExt);
  const [localAvancementDetaille, setLocalAvancementDetaille] =
    useState(avancement_detaille);

  // Détermine si l'édition du statut est désactivée
  const disabled = useEditActionStatutIsDisabled(actionDefinition.id);

  // Permet la mise à jour du dropdown si un autre élément
  // de la sous-action a changé de statut
  useEffect(() => {
    if (
      actionDefinition.type === 'sous-action' &&
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
    const { avancement, concerne, avancement_detaille } =
      statutParAvancement(value);

    if (avancement === 'detaille') {
      // Si "détaillé" est sélectionné sur une sous-action
      // qui contient des tâches, on ouvre simplement la modale associée
      // et la mise à jour se fera à la validation / fermeture de la modale
      if (
        actionDefinition.type === 'sous-action' &&
        actionDefinition.children.length > 0
      ) {
        setOpenScoreAuto(true);
      } else {
        setOpenScoreDetaille(true);
      }
    } else {
      // Mise à jour dans les cas de statuts autres que détaillé
      setLocalAvancement(value);
      setLocalAvancementDetaille(avancement_detaille);

      // Différencie la sauvegarde auto dans la page
      // de la mise à jour depuis la modale de score auto
      if (onSaveStatus) {
        onSaveStatus({
          actionId: actionDefinition.id,
          statut,
          avancement: value,
          avancementDetaille: avancement_detaille,
        });
      } else {
        saveActionStatut({
          ...args,
          ...statut,
          avancement,
          avancement_detaille:
            actionDefinition.type === 'sous-action'
              ? localAvancementDetaille
              : avancement_detaille,
          concerne,
        });
      }
    }
  };

  // Mise à jour des statuts des tâches d'une sous-action
  // à la validation dans la modale de score auto
  const handleSaveScoreAuto = (newStatus: StatusToSavePayload[]) => {
    setOpenScoreAuto(false);

    if (newStatus.length) {
      setLocalAvancement('detaille');
      setLocalAvancementDetaille(undefined);

      // Sauvegarde des statuts des tâches
      newStatus.forEach((element) => {
        const { avancement, concerne } = statutParAvancement(
          element.avancement
        );

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
          avancement_detaille: localAvancementDetaille,
          concerne: true,
          modified_at: statut?.modified_at,
          modified_by: statut?.modified_by,
        });
      }, 100);
    } else if (actionDefinition.type === 'sous-action') {
      saveActionStatut({
        ...args,
        avancement: 'non_renseigne',
        concerne: true,
        modified_at: statut?.modified_at,
        modified_by: statut?.modified_by,
      });
    }
  };

  // Mise à jour du statut à la validation dans la modale
  // de score perso
  const handleSaveScoreDetaille = (values: number[]) => {
    setOpenScoreDetaille(false);

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
        actionId: actionDefinition.id,
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
      className="flex flex-col justify-between items-end gap-2 h-full w-fit ml-auto"
      onClick={(evt) => evt.stopPropagation()}
    >
      {/* Dropdown avec suppression de l'option "non renseigné" sur les sous-actions
      quand au moins une des tâches a un statut */}
      <Tooltip
        label={
          <p className="w-96">
            Le score a été ajusté manuellement à la sous-action : la
            modification du statut de la tâche ne sera pas pris en compte pour
            le score.
          </p>
        }
        openingDelay={0}
        className={classNames({ hidden: !statusWarningMessage })}
      >
        <div>
          <SelectActionStatut
            items={
              actionDefinition.type === 'sous-action' &&
              localAvancement !== 'non_renseigne' &&
              filled
                ? ITEMS_AVEC_NON_CONCERNE.filter(
                    (item) => item !== 'non_renseigne'
                  )
                : ITEMS_AVEC_NON_CONCERNE
            }
            disabled={disabled}
            value={localAvancement}
            onChange={handleChange}
            buttonClassName="-mr-2 -mt-2"
          />
        </div>
      </Tooltip>
      {/* Cas particulier des statuts "détaillé" */}
      {localAvancement === 'detaille' && !desactive && (
        <div className="flex flex-col gap-3 items-end w-full pr-1">
          {/* Affichage de la jauge de score sur les tâches */}
          {actionDefinition.type === 'tache' &&
            (onSaveStatus === undefined ? (
              <ActionProgressBar actionDefinition={actionDefinition} />
            ) : (
              <ProgressBarWithTooltip
                score={
                  localAvancementDetaille?.map((a, idx) => ({
                    value: a,
                    label: avancementToLabel[getStatusFromIndex(idx)],
                    color: actionAvancementColors[getStatusFromIndex(idx)],
                  })) ?? []
                }
                total={
                  (FLAG_isSnapshotEnabled
                    ? NEW_score?.pointReferentiel
                    : DEPRECATED_actionScores[actionDefinition.id]
                        ?.points_max_referentiel) ?? 0
                }
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
            <Button
              variant="underlined"
              size="sm"
              onClick={() => {
                actionDefinition.type === 'sous-action' &&
                actionDefinition.children.length > 0
                  ? avancement === 'detaille'
                    ? setOpenScorePerso(true)
                    : setOpenScoreAuto(true)
                  : setOpenScoreDetaille(true);
              }}
            >
              Détailler l&apos;avancement
            </Button>
          )}
        </div>
      )}
      {/* Modale de score auto / par tâche (pour les sous-actions) */}
      {openScoreAuto && (
        <ScoreAutoModal
          actionDefinition={actionDefinition}
          externalOpen={openScoreAuto}
          setExternalOpen={setOpenScoreAuto}
          onSaveScore={handleSaveScoreAuto}
          onOpenScorePerso={() => setOpenScorePerso(true)}
        />
      )}
      {/* Modale de personnalisation du score (avec jauge manuelle) */}
      {(openScoreDetaille || openScorePerso) && (
        <ScoreDetailleModal
          actionDefinition={actionDefinition}
          avancementDetaille={localAvancementDetaille}
          externalOpen={openScoreDetaille || openScorePerso}
          saveAtValidation={onSaveStatus === undefined}
          isScorePerso={openScorePerso}
          setExternalOpen={(value) => {
            if (openScoreDetaille) setOpenScoreDetaille(value);
            else setOpenScorePerso(value);
          }}
          onSaveScore={handleSaveScoreDetaille}
          onOpenScoreAuto={() => setOpenScoreAuto(true)}
        />
      )}
    </div>
  );
};
