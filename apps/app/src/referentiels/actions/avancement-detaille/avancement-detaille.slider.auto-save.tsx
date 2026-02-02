import { useCollectiviteId } from '@tet/api/collectivites';
import { StatutAvancement } from '@tet/domain/referentiels';
import { Checkbox } from '@tet/ui';
import { omit } from 'es-toolkit';
import { ChangeEvent, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { AVANCEMENT_DETAILLE_PAR_STATUT } from '../../utils';
import {
  useActionStatut,
  useSaveActionStatut,
} from '../action-statut/use-action-statut';
import AvancementDetailleSlider, {
  AvancementValues,
} from './avancement-detaille.slider';

type Props = {
  /** Id de la sous-action ou de la tâche dont on souhaite changer le score */
  actionId: string;
  /** Permet un affichage conditionnel de la jauge via un switch */
  conditionnalDisplay?: boolean;
  /** Permet de transmettre la valeur courante de l'avancement au composant parent */
  onAvancementUpdate?: (avancement: StatutAvancement | undefined) => void;
  /** Styles customs */
  className?: string;
};

/**
 * Slider d'ajustement manuel du score avec sauvegarde auto
 */

const AvancementDetailleSliderAutoSave = ({
  actionId,
  conditionnalDisplay = false,
  onAvancementUpdate,
  className,
}: Props) => {
  const collectiviteId = useCollectiviteId();

  const { statut } = useActionStatut(actionId);
  const { avancement, avancementDetaille } = statut || {};
  const { saveActionStatut } = useSaveActionStatut();

  const isScoreDetailleFilled =
    avancementDetaille?.length === 3 &&
    !avancementDetaille.find((av) => av === 1);

  const [currentAvancement, setCurrentAvancement] = useState<AvancementValues>(
    (isScoreDetailleFilled
      ? avancementDetaille
      : AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues
  );

  const [isPercentageScore, setIsPercentageScore] = useState(
    avancement === 'detaille'
  );

  useEffect(() => {
    onAvancementUpdate?.(avancement);

    if (avancement == 'detaille') {
      setCurrentAvancement(
        (isScoreDetailleFilled
          ? avancementDetaille
          : AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues
      );
    }
  }, [avancement]);

  // Switch entre les deux types de remplissage de l'avancement
  // Sauvegarde du nouveau statut (détaillé / non renseigné) au click sur le switch
  const handleSwithPercentageScore = (evt: ChangeEvent<HTMLInputElement>) => {
    const isChecked = evt.currentTarget.checked;
    setIsPercentageScore(isChecked);
    if (isChecked) {
      saveActionStatut({
        actionId: actionId,
        collectiviteId,
        avancement: 'detaille',
        avancementDetaille: (isScoreDetailleFilled
          ? avancementDetaille
          : AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues,
        concerne: true,
      });
    } else {
      saveActionStatut({
        ...(statut ? omit(statut, ['modifiedAt', 'modifiedBy']) : {}),
        actionId,
        collectiviteId,
        avancement: 'non_renseigne',
        avancementDetaille: null,
        concerne: true,
      });
    }
  };

  // Sauvegarde du nouveau score détaillé et du nouveau statut en base
  const handleDebouncedScoreDetaille = useDebouncedCallback(
    (values: AvancementValues) => {
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

      // Sauvegarde du nouvel avancement
      saveActionStatut({
        ...statut,
        actionId,
        collectiviteId,
        avancement,
        avancementDetaille: values,
        concerne: true,
      });
    },
    500
  );

  // Sauvegarde du nouveau score détaillé en local
  const handleSaveScoreDetaille = (values: AvancementValues) => {
    setCurrentAvancement(values);
    handleDebouncedScoreDetaille(values);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Switch pour passer au mode manuel */}
      {conditionnalDisplay && (
        <Checkbox
          variant="switch"
          label="Détailler l’avancement au pourcentage"
          checked={isPercentageScore}
          onChange={handleSwithPercentageScore}
        />
      )}

      {/* Slider pour détailler le score manuellement */}
      {(isPercentageScore || !conditionnalDisplay) && (
        <AvancementDetailleSlider
          className={className}
          avancement={currentAvancement}
          onChange={handleSaveScoreDetaille}
        />
      )}
    </div>
  );
};

export default AvancementDetailleSliderAutoSave;
