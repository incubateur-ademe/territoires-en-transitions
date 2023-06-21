import {useEffect, useState} from 'react';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useActionScore} from 'core-logic/hooks/scoreHooks';
import {
  useActionStatut,
  useEditActionStatutIsDisabled,
  useSaveActionStatut,
} from 'core-logic/hooks/useActionStatut';
import {TActionAvancement, TActionAvancementExt} from 'types/alias';
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
import {AVANCEMENT_DETAILLE_PAR_STATUT} from './utils';

export const ActionStatusDropdown = ({
  action,
  onSaveStatus,
}: {
  action: ActionDefinitionSummary;
  onSaveStatus?: (
    actionId: string,
    status: TActionAvancementExt,
    avancementDetaille?: number[]
  ) => void;
}) => {
  const collectivite = useCurrentCollectivite();

  const [openScoreAuto, setOpenScoreAuto] = useState(false);
  const [openScorePerso, setOpenScorePerso] = useState(false);

  const args = {
    action_id: action.id,
    collectivite_id: collectivite?.collectivite_id || 0,
  };
  const {statut} = useActionStatut(args);
  const {avancement, avancement_detaille} = statut || {};

  const score = useActionScore(action.id);
  const {concerne, desactive} = score || {};
  const avancementExt = getAvancementExt({avancement, desactive, concerne});

  const {saveActionStatut} = useSaveActionStatut(args);

  const [localAvancement, setLocalAvancement] = useState(avancementExt);
  const [localAvancementDetaille, setLocalAvancementDetaille] =
    useState(avancement_detaille);

  // Détermine si l'édition du statut est désactivée
  const disabled = useEditActionStatutIsDisabled(action.id);

  useEffect(() => {
    setLocalAvancement(avancementExt);
    setLocalAvancementDetaille(avancement_detaille);
  }, [avancementExt, avancement_detaille]);

  const handleChange = (value: TActionAvancementExt) => {
    const {avancement, concerne, avancement_detaille} =
      statutParAvancement(value);

    setLocalAvancement(value);
    setLocalAvancementDetaille(avancement_detaille);

    if (onSaveStatus) {
      onSaveStatus(action.id, value, avancement_detaille);
    } else {
      saveActionStatut({
        ...args,
        ...statut,
        avancement,
        concerne,
        avancement_detaille,
      });
    }

    if (avancement === 'detaille') {
      if (action.type === 'tache') setOpenScorePerso(true);
      else setOpenScoreAuto(true);
    }
  };

  const handleSaveDetail = (values: number[]) => {
    const avancement =
      values[0] === 1
        ? 'fait'
        : values[1] === 1
        ? 'programme'
        : values[2] === 1
        ? 'pas_fait'
        : 'detaille';

    if (statut) {
      setLocalAvancement(avancement);
      setLocalAvancementDetaille(values);

      if (onSaveStatus) {
        onSaveStatus(action.id, avancement, values);
      } else {
        saveActionStatut({
          ...args,
          ...statut,
          avancement,
          avancement_detaille: values,
        });
      }

      if (action.type === 'tache') setOpenScorePerso(false);
      else setOpenScoreAuto(false);
    }
  };

  const handleSaveAutoScore = (
    newStatus: {
      actionId: string;
      status: TActionAvancementExt;
      avancementDetaille: number[] | undefined;
    }[]
  ) => {
    setOpenScoreAuto(false);

    newStatus.forEach(element => {
      const {avancement, concerne} = statutParAvancement(element.status);

      saveActionStatut({
        action_id: element.actionId,
        avancement,
        avancement_detaille: element.avancementDetaille,
        collectivite_id: args.collectivite_id,
        concerne,
      });
    });
  };

  if (!collectivite) {
    return null;
  }

  return (
    <div
      className="flex flex-col gap-3 items-end w-full"
      onClick={evt => evt.stopPropagation()}
    >
      <SelectActionStatut
        items={ITEMS_AVEC_NON_CONCERNE}
        disabled={disabled}
        value={localAvancement}
        onChange={handleChange}
      />

      {localAvancement === 'detaille' && !score?.desactive && (
        <div className="flex flex-col gap-3 items-end w-full pr-1">
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
                total={score?.point_potentiel ?? 0}
                defaultScore={{
                  label: avancementToLabel.non_renseigne,
                  color: actionAvancementColors.non_renseigne,
                }}
                valueToDisplay={avancementToLabel.fait}
                percent
              />
            ))}
          {!disabled && (
            <AnchorAsButton
              className="underline_href fr-link fr-link--sm"
              onClick={() =>
                action.type === 'tache'
                  ? setOpenScorePerso(true)
                  : setOpenScoreAuto(true)
              }
            >
              Détailler l'avancement
            </AnchorAsButton>
          )}
        </div>
      )}

      {openScoreAuto && (
        <ScoreAutoModal
          action={action}
          externalOpen={openScoreAuto}
          setExternalOpen={setOpenScoreAuto}
          onSaveScore={handleSaveAutoScore}
        />
      )}

      {openScorePerso && (
        <ScorePersoModal
          actionId={action.id}
          avancementDetaille={localAvancementDetaille}
          externalOpen={openScorePerso}
          saveAtValidation={onSaveStatus === undefined}
          setExternalOpen={setOpenScorePerso}
          onSaveScore={handleSaveDetail}
        />
      )}
    </div>
  );
};

const getStatusFromIndex = (index: number): TActionAvancement => {
  switch (index) {
    case 0:
      return 'fait';
    case 1:
      return 'programme';
    default:
      return 'pas_fait';
  }
};

// génère les propriétés de l'objet statut à écrire lors du changement de l'avancement
const statutParAvancement = (avancement: TActionAvancementExt) => {
  // cas spécial pour le faux statut "non concerné"
  if (avancement === 'non_concerne') {
    return {
      avancement: 'non_renseigne' as TActionAvancement,
      concerne: false,
    };
  }

  return {
    avancement,
    // quand on change l'avancement, l'avancement détaillé est réinitialisé à la
    // valeur par défaut correspondante
    avancement_detaille: AVANCEMENT_DETAILLE_PAR_STATUT[avancement],
    concerne: true,
  };
};

/**
 * Détermine l'avancement "étendu" d'une action (inclus le "non concerné")
 */
const getAvancementExt = ({
  avancement,
  desactive,
  concerne,
}: {
  avancement: TActionAvancement | undefined;
  desactive: boolean | undefined;
  concerne: boolean | undefined;
}): TActionAvancementExt | undefined => {
  // affiche le statut "non concerné" quand l'action est désactivée par la
  // personnalisation ou que l'option "non concerné" a été sélectionnée
  // explicitement par l'utilisateur
  if (desactive || concerne === false) {
    return 'non_concerne';
  }
  return avancement;
};
