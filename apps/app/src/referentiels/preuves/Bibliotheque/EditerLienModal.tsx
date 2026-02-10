import { Field, Input, Modal, ModalFooterOKCancel } from '@tet/ui';
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

  return (
    !!lien && (
      <Modal
        dataTest="edit-lien"
        openState={{ isOpen, setIsOpen }}
        title="Editer le lien"
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
        // Boutons pour valider / annuler les modifications
        renderFooter={({ close }) => (
          <ModalFooterOKCancel
            btnCancelProps={{ onClick: close, disabled: isPending }}
            btnOKProps={{
              disabled: isPending || !titre.trim() || !url,
              onClick: () => {
                editLien({
                  id: preuve.id,
                  preuve_type: preuve.preuve_type,
                  collectivite_id: preuve.collectivite_id,
                  lien: { titre, url },
                });
                close();
              },
            }}
          />
        )}
      />
    )
  );
};
