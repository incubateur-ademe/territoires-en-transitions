import { appLabels } from '@/app/labels/catalog';
import { Field, Input, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';
import { ConfidentielCheckbox } from '../add-document/confidentiel.checkbox';
import { PreuveType, StoredFile } from '@tet/domain/collectivites';
import { useUpdateBibliothequeFichier } from './use-edit-preuve';
import { useEditFilenameState } from './use-edit-state';

export type EditFichierModalProps = {
  preuve: {
    collectiviteId: number;
    preuveType: PreuveType;
    fichier:
      | (Pick<StoredFile, 'filename' | 'hash'> & {
          confidentiel: boolean | null;
        })
      | null;
  };
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
};

export const EditFichierModal = (props: EditFichierModalProps) => {
  const { preuve, isOpen, setIsOpen } = props;
  const { fichier } = preuve;
  const [filename, setFilename] = useState(fichier?.filename);
  const { enter, exit, value, setValue } = useEditFilenameState({
    initialValue: filename,
    onUpdate: setFilename,
  });

  const [confidentiel, setConfidentiel] = useState(
    fichier?.confidentiel || false
  );
  const { mutate: updateDocument, isPending: isLoading } =
    useUpdateBibliothequeFichier();

  const handleOk = () => {
    if (!fichier) {
      return;
    }
    const filenameChanged = filename && filename !== fichier.filename;
    const confidentielChanged =
      confidentiel !== (fichier.confidentiel ?? false);
    if (filenameChanged || confidentielChanged) {
      updateDocument({
        collectiviteId: preuve.collectiviteId,
        hash: fichier.hash,
        ...(filenameChanged && { filename }),
        ...(confidentielChanged && { confidentiel }),
      });
    }
    setIsOpen(false);
  };

  return (
    !!fichier && (
      <Modal
        dataTest="edit-doc"
        openState={{ isOpen, setIsOpen }}
        title={appLabels.editerDocument}
        render={() => (
          <>
            <Field title="Nom du document">
              <Input
                type="text"
                value={value}
                onFocus={() => enter()}
                onBlur={() => exit()}
                onChange={(e) => setValue(e.currentTarget.value)}
              />
            </Field>
            <ConfidentielCheckbox
              docType={preuve.preuveType}
              confidentiel={confidentiel}
              setConfidentiel={setConfidentiel}
            />
          </>
        )}
        renderFooter={({ close }) => (
          <ModalFooterOKCancel
            btnCancelProps={{ onClick: close, disabled: isLoading }}
            btnOKProps={{
              disabled: isLoading || !value,
              onClick: () => {
                handleOk();
                close();
              },
            }}
          />
        )}
      />
    )
  );
};
