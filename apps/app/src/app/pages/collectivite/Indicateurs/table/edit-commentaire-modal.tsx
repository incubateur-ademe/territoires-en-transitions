import { appLabels } from '@/app/labels/catalog';
import {
  Button,
  Field,
  Modal,
  ModalFooter,
  ModalFooterOKCancel,
  Tab,
  Tabs,
  Textarea,
} from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { capitalize } from '@tet/ui/labels/plural';
import { SourceType } from '../types';

export type EditCommentaireModalProps = {
  periodeLabel: string;
  commentaires: Record<SourceType, string>;
  openState: OpenState;
  onChange: (commentaires: Record<SourceType, string>) => Promise<boolean>;
  isReadonly?: boolean;
};

/**
 * Édite ensemble les commentaires du résultat et de l'objectif d'une période.
 */
export const EditCommentaireModal = (props: EditCommentaireModalProps) => {
  const {
    periodeLabel,
    commentaires: commentairesInitiaux,
    openState,
    onChange,
    isReadonly = false,
  } = props;
  const [isSaving, setIsSaving] = useState(false);
  const [commentaires, setCommentaires] = useState(commentairesInitiaux);

  return (
    <Modal
      openState={openState}
      disableDismiss
      title={appLabels.indicateurCommentairesPeriode(periodeLabel)}
      render={() => (
        <Tabs>
          {(['resultat', 'objectif'] as const).map((type) => (
            <Tab
              key={type}
              label={capitalize(
                type === 'resultat'
                  ? appLabels.indicateurResultat({ plural: true })
                  : appLabels.indicateurObjectif({ plural: true })
              )}
            >
              <Field title={appLabels.commentaire}>
                <Textarea
                  rows={10}
                  value={commentaires[type]}
                  onChange={(event) =>
                    setCommentaires((previous) => ({
                      ...previous,
                      [type]: event.target.value,
                    }))
                  }
                  disabled={isReadonly || isSaving}
                  autoFocus
                />
              </Field>
            </Tab>
          ))}
        </Tabs>
      )}
      renderFooter={({ close }) =>
        !isReadonly ? (
          <ModalFooterOKCancel
            btnOKProps={{
              disabled: isSaving,
              onClick: async () => {
                setIsSaving(true);
                try {
                  const saved = await onChange(commentaires);
                  if (saved !== false) close();
                } finally {
                  setIsSaving(false);
                }
              },
            }}
            btnCancelProps={{ onClick: close, disabled: isSaving }}
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
