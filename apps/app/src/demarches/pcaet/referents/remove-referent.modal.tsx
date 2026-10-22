'use client';

import { appLabels } from '@/app/labels/catalog';
import { PcaetReferent } from '@tet/domain/demarches';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { JSX } from 'react';
import { useRemoveReferent } from './data/use-remove-referent';

type Props = {
  collectiviteId: number;
  organismeNom: string;
  referent: PcaetReferent;
  openState: OpenState;
};

export const RemoveReferentModal = ({
  collectiviteId,
  organismeNom,
  referent,
  openState,
}: Props): JSX.Element => {
  const { mutate: removeReferent } = useRemoveReferent();

  return (
    <Modal
      size="sm"
      title={appLabels.referentsPcaetRetirerTitre}
      subTitle={referent.email}
      openState={openState}
      render={() => (
        <p className="mb-0">
          {appLabels.referentsPcaetRetirerDescription({
            nom: referent.nom,
            organisme: organismeNom,
          })}
        </p>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            onClick: () => {
              removeReferent({ collectiviteId, referentId: referent.id });
              close();
            },
          }}
          btnCancelProps={{ onClick: () => close() }}
        />
      )}
    />
  );
};
