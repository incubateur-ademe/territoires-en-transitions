import { appLabels } from '@/app/labels/catalog';
import { Field, Input } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useState } from 'react';
import { TPreuve } from './types';
import { useUpdatePreuveLien } from './useEditPreuve';

export type EditerLienProps = {
  preuve: Pick<TPreuve, 'id' | 'lien' | 'collectivite_id' | 'preuve_type'>;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
};

/**
 * Affiche la modale d'édition d'un lien
 */
export const EditerLienModal = (props: EditerLienProps) => {
  const { preuve, isOpen, setIsOpen } = props;
  const { lien } = preuve;
  const [titre, setTitre] = useState(lien?.titre || '');
  const [url, setUrl] = useState(lien?.url || '');

  const { mutate: editLien, isPending } = useUpdatePreuveLien();

  if (!lien) {
    return null;
  }

  return (
    <Modal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }}>
      <Modal.Header>
        <Modal.Title>{appLabels.editerLien}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Field title={appLabels.titreDuLien}>
          <Input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.currentTarget.value)}
          />
        </Field>
        <Field title={appLabels.lien}>
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value.trim())}
          />
        </Field>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel disabled={isPending}>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok
          disabled={isPending || !titre.trim() || !url}
          onClick={() => {
            editLien({
              id: preuve.id,
              preuve_type: preuve.preuve_type,
              collectivite_id: preuve.collectivite_id,
              lien: { titre, url },
            });
            setIsOpen(false);
          }}
        >
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};
