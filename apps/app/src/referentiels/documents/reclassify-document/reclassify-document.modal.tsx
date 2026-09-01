import { appLabels } from '@/app/labels/catalog';
import { ObjetPreuve } from '@tet/domain/referentiels';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { ReactNode, useState } from 'react';
import { useReclassifyDocument } from './data/use-reclassify-document';
import { ReclassifyDocumentField } from './reclassify-document.field';

type ReclassifyDocumentModalProps = {
  preuveId: number;
  collectiviteId: number;
  objet: ObjetPreuve | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export const ReclassifyDocumentModal = ({
  preuveId,
  collectiviteId,
  objet,
  isOpen,
  setIsOpen,
}: ReclassifyDocumentModalProps): ReactNode => {
  const [selectedObjet, setSelectedObjet] = useState(objet);
  const { mutate: reclassifyDocument } = useReclassifyDocument(collectiviteId);

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title={appLabels.reclasserDocumentTitre}
      render={() => (
        <ReclassifyDocumentField
          value={selectedObjet}
          onChange={setSelectedObjet}
        />
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              reclassifyDocument({
                preuveId,
                preuveType: 'labellisation',
                objet: selectedObjet,
              });
              close();
            },
          }}
        />
      )}
    />
  );
};
