import { appLabels } from '@/app/labels/catalog';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { Field, Textarea } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { getSourceTypeLabel } from '../constants';
import { SourceType } from '../types';

export type EditCommentaireModalProps = {
  annee: number;
  commentaire: string;
  definition: IndicateurDefinition;
  type: SourceType;
  openState: OpenState;
  onChange: (commentaire: string) => void;
  isReadonly?: boolean;
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
    isReadonly = false,
  } = props;
  const [commentaire, setCommentaire] = useState<string | null>(
    commentaireInitial
  );

  const title = appLabels.commentaireIndicateurTitre({
    sourceTypeLabel: getSourceTypeLabel(type) ?? appLabels.nonRenseigne,
    unite: definition.unite,
    annee,
  });

  return (
    <Modal
      openState={{ isOpen: openState.isOpen, setIsOpen: openState.setIsOpen }}
      dismissable={isReadonly}
    >
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Field title={appLabels.commentaire}>
          <Textarea
            rows={10}
            value={commentaire ?? ''}
            onChange={(e) => setCommentaire(e.target.value)}
            disabled={isReadonly}
            autoFocus
          />
        </Field>
      </Modal.Body>
      <Modal.Footer>
        {isReadonly ? (
          <Modal.Cancel>{appLabels.fermer}</Modal.Cancel>
        ) : (
          <>
            <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
            <Modal.Ok
              onClick={() => {
                onChange(commentaire ?? '');
                openState.setIsOpen(false);
              }}
            >
              {appLabels.valider}
            </Modal.Ok>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};
