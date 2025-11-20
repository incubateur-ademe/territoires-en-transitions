import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import {
  Button,
  Field,
  Modal,
  ModalFooter,
  ModalFooterOKCancel,
  Textarea,
} from '@tet/ui';
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

  return (
    <Modal
      openState={openState}
      disableDismiss
      title={`Mes ${getSourceTypeLabel(type)} (${definition.unite}) : ${annee}`}
      render={() => {
        return (
          <Field title="Commentaire">
            <Textarea
              rows={10}
              value={commentaire ?? ''}
              onChange={(e) => setCommentaire(e.target.value)}
              disabled={isReadonly}
              autoFocus
            />
          </Field>
        );
      }}
      renderFooter={({ close }) =>
        !isReadonly ? (
          <ModalFooterOKCancel
            btnOKProps={{
              onClick: () => {
                onChange(commentaire ?? '');
                close();
              },
            }}
            btnCancelProps={{ onClick: close }}
          />
        ) : (
          <ModalFooter>
            <Button type="button" variant="outlined" onClick={close}>
              Fermer
            </Button>
          </ModalFooter>
        )
      }
    />
  );
};
