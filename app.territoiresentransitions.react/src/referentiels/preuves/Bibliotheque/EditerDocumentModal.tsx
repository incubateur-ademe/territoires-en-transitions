import { useEditFilenameState } from '@/app/core-logic/hooks/useEditState';
import { Field, Input, Modal, ModalFooterOKCancel } from '@/ui';
import { useState } from 'react';
import { CheckboxConfidentiel } from '../AddPreuveModal/CheckboxConfidentiel';
import { TPreuve } from './types';
import {
  useUpdateBibliothequeFichierConfidentiel,
  useUpdateBibliothequeFichierFilename,
} from './useEditPreuve';

export type EditerDocumentProps = {
  preuve: TPreuve;
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
  const { mutate: editFilename, isPending: isLoading1 } =
    useUpdateBibliothequeFichierFilename();
  const { mutate: updateConfidentiel, isPending: isLoading2 } =
    useUpdateBibliothequeFichierConfidentiel();
  const isLoading = isLoading1 || isLoading2;

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
        // Boutons pour valider / annuler les modifications
        renderFooter={({ close }) => (
          <ModalFooterOKCancel
            btnCancelProps={{ onClick: close, disabled: isLoading }}
            btnOKProps={{
              disabled: isLoading || !value,
              onClick: () => {
                if (filename && filename !== fichier.filename) {
                  editFilename({ ...preuve, updatedFilename: filename });
                }
                if (confidentiel !== fichier?.confidentiel) {
                  updateConfidentiel({
                    ...preuve,
                    updatedConfidentiel: confidentiel,
                  });
                }
                close();
              },
            }}
          />
        )}
      />
    )
  );
};
