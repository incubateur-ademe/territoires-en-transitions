import { useState } from 'react';
import { Field, Input, Modal, ModalFooterOKCancel } from '@tet/ui';
import { TPreuve } from './types';
import { CheckboxConfidentiel } from '../AddPreuveModal/CheckboxConfidentiel';
import {
  useUpdateBibliothequeFichierConfidentiel,
  useUpdateBibliothequeFichierFilename,
} from './useEditPreuve';
import { useEditFilenameState } from 'core-logic/hooks/useEditState';

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
  const { mutate: editFilename, isLoading: isLoading1 } =
    useUpdateBibliothequeFichierFilename();
  const { mutate: updateConfidentiel, isLoading: isLoading2 } =
    useUpdateBibliothequeFichierConfidentiel();
  const isLoading = isLoading1 || isLoading2;

  return (
    !!fichier && (
      <Modal
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
