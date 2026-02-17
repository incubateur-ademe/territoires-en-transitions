import { Field, Input, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';
import { CheckboxConfidentiel } from '../AddPreuveModal/CheckboxConfidentiel';
import { TPreuve } from './types';
import { useUpdateBibliothequeFichier } from './useEditPreuve';
import { useEditFilenameState } from './useEditState';

export type EditerDocumentProps = {
  preuve: Pick<TPreuve, 'fichier' | 'preuve_type' | 'collectivite_id'>;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
};

/**
 * Affiche la modale d'édition d'un fichier
 */
export const EditerDocumentModal = (props: EditerDocumentProps) => {
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
        collectiviteId: preuve.collectivite_id,
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
        title="Editer le document"
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
            <CheckboxConfidentiel
              docType={preuve.preuve_type}
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
