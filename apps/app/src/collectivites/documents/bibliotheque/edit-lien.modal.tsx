import { appLabels } from '@/app/labels/catalog';
import { lienFormSchema } from '@/app/collectivites/documents/lien-schema';
import { Field, Input, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';
import { EditableDocument } from './edit-document.modal';
import { useUpdatePreuveLien } from './use-edit-preuve';

export type EditLienModalProps = {
  preuve: Extract<EditableDocument, { type: 'lien' }>;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
};

export const EditLienModal = (props: EditLienModalProps) => {
  const { preuve, isOpen, setIsOpen } = props;
  const { lien } = preuve;
  const [titre, setTitre] = useState(lien.titre);
  const [url, setUrl] = useState(lien.url);

  const { mutate: editLien, isPending } = useUpdatePreuveLien();

  const lienParseResult = lienFormSchema.safeParse({ titre, url });

  const getErrorMessage = (field: 'titre' | 'url'): string | undefined => {
    if (lienParseResult.success) {
      return undefined;
    }
    return lienParseResult.error.issues.find((issue) => issue.path[0] === field)
      ?.message;
  };

  const titreError = getErrorMessage('titre');
  const urlError = getErrorMessage('url');

  return (
    <Modal
      dataTest="edit-lien"
      openState={{ isOpen, setIsOpen }}
      title={appLabels.editerLien}
      render={() => (
        <>
          <Field
            title={appLabels.titreLienObligatoire}
            state={titreError ? 'error' : 'default'}
            message={titreError}
          >
            <Input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.currentTarget.value)}
            />
          </Field>
          <Field
            title={appLabels.lienObligatoire}
            state={urlError ? 'error' : 'default'}
            message={urlError}
          >
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.currentTarget.value)}
            />
          </Field>
        </>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close, disabled: isPending }}
          btnOKProps={{
            disabled: isPending || !lienParseResult.success,
            onClick: () => {
              if (!lienParseResult.success) {
                return;
              }
              editLien(
                { ...preuve, lien: lienParseResult.data },
                { onSuccess: close }
              );
            },
          }}
        />
      )}
    />
  );
};
