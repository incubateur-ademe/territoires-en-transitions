import { appLabels } from '@/app/labels/catalog';
import { lienFormSchema } from '@/app/collectivites/documents/lien-schema';
import { Lien } from '@tet/domain/collectivites';
import { Field, Input, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';
import { DocumentRattache } from './types';
import { useUpdatePreuveLien } from './use-edit-preuve';

export type EditLienModalProps = {
  preuve: Pick<DocumentRattache, 'id' | 'collectiviteId' | 'preuveType'> & {
    lien: Lien;
  };
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
};

export const EditLienModal = (props: EditLienModalProps) => {
  const { preuve, isOpen, setIsOpen } = props;
  const { lien } = preuve;
  const [titre, setTitre] = useState(lien.titre);
  const [url, setUrl] = useState(lien.url);

  const { mutate: editLien, isPending } = useUpdatePreuveLien();

  const lienSaisi = lienFormSchema.safeParse({ titre, url });
  const messageDErreur = (champ: 'titre' | 'url'): string | undefined =>
    lienSaisi.success
      ? undefined
      : lienSaisi.error.issues.find((issue) => issue.path[0] === champ)
          ?.message;

  return (
    <Modal
      dataTest="edit-lien"
      openState={{ isOpen, setIsOpen }}
      title={appLabels.editerLien}
      render={() => (
        <>
          <Field
            title={appLabels.titreLienObligatoire}
            state={messageDErreur('titre') ? 'error' : 'default'}
            message={messageDErreur('titre')}
          >
            <Input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.currentTarget.value)}
            />
          </Field>
          <Field
            title={appLabels.lienObligatoire}
            state={messageDErreur('url') ? 'error' : 'default'}
            message={messageDErreur('url')}
          >
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
            disabled: isPending || !lienSaisi.success,
            onClick: () =>
              lienSaisi.success &&
              editLien(
                {
                  id: preuve.id,
                  preuveType: preuve.preuveType,
                  collectiviteId: preuve.collectiviteId,
                  lien: lienSaisi.data,
                },
                { onSuccess: close }
              ),
          }}
        />
      )}
    />
  );
};
