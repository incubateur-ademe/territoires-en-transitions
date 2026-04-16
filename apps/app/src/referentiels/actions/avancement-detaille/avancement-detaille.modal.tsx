import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { appLabels } from '@/app/labels/catalog';
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
        statut.avancement === 'detaille'
          ? statut.avancementDetaille || AVANCEMENT_DETAILLE_PAR_STATUT.detaille
          : AVANCEMENT_DETAILLE_PAR_STATUT.detaille;
      setActionStatutUpdate({
        ...omit(statut, ['modifiedAt', 'modifiedBy']),
        avancementDetaille: avancementDetaille,
        avancement: getAvancementFromAvancementDetaille(avancementDetaille),
        concerne: true,
      });
    }
  }, [statut]);

  if (!actionStatutUpdate) {
    return null;
  }

  const handleUpdateScoreDetaille = (values: AvancementValues) => {
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
      title={appLabels.detaillerAvancementPourcentage}
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      render={() => (
        <div className="flex flex-col gap-8">
          <AvancementDetailleSlider
            className="my-8 px-12"
            avancement={
              (actionStatutUpdate.avancementDetaille ||
                AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues
            }
            onChange={handleUpdateScoreDetaille}
          />

          <ActionJustificationField
            actionId={actionDefinition.id}
            hint={appLabels.raisonRepartition}
          />
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            children: appLabels.annuler,
            onClick: close,
          }}
          btnOKProps={{
            variant: 'primary',
            children: appLabels.valider,
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
