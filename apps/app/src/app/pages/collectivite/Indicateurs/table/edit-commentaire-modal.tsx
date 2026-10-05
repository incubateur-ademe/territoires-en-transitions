import { appLabels } from '@/app/labels/catalog';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
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

type EditCommentaireModalProps = {
  periodeLabel: string;
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
    periodeLabel,
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
      title={appLabels.commentaireIndicateurTitre({
        sourceTypeLabel: getSourceTypeLabel(type) ?? appLabels.nonRenseigne,
        unite: definition.unite,
        periode: periodeLabel,
      })}
      render={() => {
        return (
          <Field title={appLabels.commentaire}>
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
              {appLabels.fermer}
            </Button>
          </ModalFooter>
        )
      }
    />
  );
};
