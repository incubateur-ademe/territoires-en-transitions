import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ActionStatutCreate } from '@tet/domain/referentiels';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { omit } from 'es-toolkit';
import { useEffect, useState } from 'react';
import { ActionJustificationField } from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/action/action.justification-field';
import { AVANCEMENT_DETAILLE_PAR_STATUT } from '../../utils';
import {
  useActionStatut,
  useSaveActionStatut,
} from '../action-statut/use-action-statut';
import AvancementDetailleSlider, {
  AvancementValues,
} from './avancement-detaille.slider';

type Props = {
  actionDefinition: ActionDefinitionSummary;
  openState: OpenState;
};

const getAvancementFromAvancementDetaille = (avancementDetaille: number[]) => {
  return avancementDetaille[0] === 1
    ? 'fait'
    : avancementDetaille[1] === 1
    ? 'programme'
    : avancementDetaille[2] === 1
    ? 'pas_fait'
    : 'detaille';
};

/**
 * Modale permettant l'ajustement manuel de l'avancement détaillé
 * + l'ajout d'un texte justificatif
 */
const AvancementDetailleModal = ({ actionDefinition, openState }: Props) => {
  const { id: actionId, nom: actionName } = actionDefinition;
  const { statut, isLoading } = useActionStatut(actionId);
  const collectiviteId = useCollectiviteId();
  const { saveActionStatut } = useSaveActionStatut();
  const [actionStatutUpdate, setActionStatutUpdate] =
    useState<ActionStatutCreate | null>(null);

  useEffect(() => {
    if (!isLoading && statut && !actionStatutUpdate) {
      const avancementDetaille =
        statut.avancementDetaille || AVANCEMENT_DETAILLE_PAR_STATUT.detaille;
      setActionStatutUpdate({
        ...omit(statut, ['modifiedAt', 'modifiedBy']),
        avancementDetaille: avancementDetaille,
        avancement: getAvancementFromAvancementDetaille(avancementDetaille),
      });
    }
  }, [statut]);

  if (!actionStatutUpdate) {
    return null;
  }

  const handleSaveScoreDetaille = (values: AvancementValues) => {
    // Si la jauge est à 100% dans un des statuts, le statut
    // est mis à jour automatiquement

    const newActionStatutUpdate: ActionStatutCreate = {
      ...actionStatutUpdate,
      collectiviteId,
      avancement: getAvancementFromAvancementDetaille(values),
      avancementDetaille: values,
      concerne: true,
    };

    setActionStatutUpdate(newActionStatutUpdate);
  };

  return (
    <Modal
      size="xl"
      title="Détailler l'avancement au pourcentage"
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      render={() => (
        <div className="flex flex-col gap-8">
          {/* Slider pour détailler le score manuellement */}
          <AvancementDetailleSlider
            className="my-8 px-12"
            avancement={
              (actionStatutUpdate.avancementDetaille ||
                AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues
            }
            onChange={handleSaveScoreDetaille}
          />

          {/* Raisons de la répartition */}
          <ActionJustificationField
            actionId={actionDefinition.id}
            hint="Pour faciliter la relecture, vous pouvez préciser ici les raisons de cette répartition"
          />
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            children: 'Annuler',
            onClick: close,
          }}
          btnOKProps={{
            variant: 'primary',
            children: 'Valider',
            onClick: () => {
              if (actionStatutUpdate) {
                saveActionStatut(actionStatutUpdate);
              }
              close();
            },
          }}
        />
      )}
    />
  );
};

export default AvancementDetailleModal;
