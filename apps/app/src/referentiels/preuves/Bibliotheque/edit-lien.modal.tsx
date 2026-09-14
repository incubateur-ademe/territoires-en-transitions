import { appLabels } from '@/app/labels/catalog';
import { Lien } from '@tet/domain/collectivites';
import { Field, Input, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';
import { Preuve } from './types';
import { useUpdatePreuveLien } from './use-edit-preuve';

export type EditLienModalProps = {
  preuve: Pick<Preuve, 'id' | 'collectiviteId' | 'preuveType'> & { lien: Lien };
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
};

export const EditLienModal = (props: EditLienModalProps) => {
  const { preuve, isOpen, setIsOpen } = props;
  const { lien } = preuve;
  const [titre, setTitre] = useState(lien.titre);
  const [url, setUrl] = useState(lien.url);

  const { mutate: editLien, isPending } = useUpdatePreuveLien();

  return (
    <Modal
      dataTest="edit-lien"
      openState={{ isOpen, setIsOpen }}
      title={appLabels.editerLien}
      render={() => (
        <>
          <Field title="Titre du lien">
            <Input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.currentTarget.value)}
            />
          </Field>
          <Field title="Lien">
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.currentTarget.value.trim())}
            />
          </Field>
        </>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close, disabled: isPending }}
          btnOKProps={{
            disabled: isPending || !titre.trim() || !url,
            onClick: () => {
              editLien({
                id: preuve.id,
                preuveType: preuve.preuveType,
                collectiviteId: preuve.collectiviteId,
                lien: { titre, url },
              });
              close();
            },
          }}
        />
      )}
    />
  );
};
