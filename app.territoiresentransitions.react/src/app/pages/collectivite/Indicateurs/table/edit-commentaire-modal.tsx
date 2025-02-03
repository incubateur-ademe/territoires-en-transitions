import { AutoResizedTextarea, Field, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import { getSourceTypeLabel } from '../constants';
import { SourceType, TIndicateurDefinition } from '../types';

export type EditCommentaireModalProps = {
  annee: number;
  commentaire: string;
  definition: TIndicateurDefinition;
  type: SourceType;
  openState: OpenState;
  onChange: (commentaire: string) => void;
};

/**
 * Affiche la modale d'édition d'un commentaire d'une valeur d'un indicateur
 */
export const EditCommentaireModal = (props: EditCommentaireModalProps) => {
  const {
    definition,
    annee,
    commentaire: commentaireInitial,
    type,
    openState,
    onChange,
  } = props;
  const [commentaire, setCommentaire] = useState<string | null>(
    commentaireInitial
  );

  return (
    <Modal
      openState={openState}
      disableDismiss
      title={`Mes ${getSourceTypeLabel(type)} (${definition.unite}) : ${annee}`}
      render={() => {
        return (
          <Field title="Commentaire">
            <AutoResizedTextarea
              rows={10}
              value={commentaire ?? ''}
              onChange={(e) => setCommentaire(e.target.value)}
            />
          </Field>
        );
      }}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            onClick: () => {
              onChange(commentaire ?? '');
              close();
            },
          }}
          btnCancelProps={{ onClick: close }}
        />
      )}
    />
  );
};
