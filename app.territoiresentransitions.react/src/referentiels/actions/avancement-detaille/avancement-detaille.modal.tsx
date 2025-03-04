import { useState } from 'react';

import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { Button, Modal, ModalFooterOKCancel } from '@/ui';

import { AVANCEMENT_DETAILLE_PAR_STATUT } from '@/app/referentiels/utils';
import AvancementDetailleSlider, {
  AvancementValues,
} from './avancement-detaille.slider';

type Props = {
  action: ActionDefinitionSummary;
  avancementDetaille?: AvancementValues | null;
};

const AvancementDetailleModal = ({ action, avancementDetaille }: Props) => {
  const [avancement, setAvancement] = useState(
    (avancementDetaille ??
      AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues
  );

  const handleValidate = (avancementValues: AvancementValues) => {
    // TODO
  };

  return (
    <Modal
      size="lg"
      disableDismiss
      title="Détailler l'avancement"
      subTitle={`${action.id.split('_')[1]} ${action.nom}`}
      render={() => (
        <div className="mt-4">
          <AvancementDetailleSlider
            avancement={avancement}
            onChange={(newValues) => setAvancement(newValues)}
          />
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            'aria-label': 'Valider la répartition',
            children: 'Valider la répartition',
            onClick: () => {
              handleValidate(avancement);
              close();
            },
          }}
        />
      )}
    >
      <Button size="sm" variant="underlined">
        Détailler l&apos;avancement
      </Button>
    </Modal>
  );
};

export default AvancementDetailleModal;
