import { appLabels } from '@/app/labels/catalog';
import { Field, Input } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
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

  if (!fichier) {
    return null;
  }

  const handleOk = () => {
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
    <Modal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }}>
      <Modal.Header>
        <Modal.Title>{appLabels.editerDocument}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Field title={appLabels.nomDuDocument}>
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
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel disabled={isLoading}>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok disabled={isLoading || !value} onClick={handleOk}>
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};
