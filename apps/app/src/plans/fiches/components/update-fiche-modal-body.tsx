import { SharedFicheUpdateAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-update.alert';
import { FicheWithRelations } from '@tet/domain/plans';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { ReactNode } from 'react';

type Props = {
  fiche: FicheWithRelations;
  children: ReactNode;
  className?: string;
};

/**
 * À utiliser à la place de `<Modal.Body>` dans toute modale qui modifie une
 * fiche. Affiche en première position l'avertissement « cette fiche est
 * partagée avec d'autres collectivités, vos modifications seront visibles ».
 */
export const UpdateFicheModalBody = ({ fiche, children, className }: Props) => (
  <Modal.Body className={className}>
    <SharedFicheUpdateAlert fiche={fiche} />
    {children}
  </Modal.Body>
);

/**
 * Variante AlertModal de `UpdateFicheModalBody`. À utiliser à la place de
 * `<AlertModal.Body>` dans toute modale destructive sur une fiche partagée.
 */
export const UpdateFicheAlertModalBody = ({
  fiche,
  children,
  className,
}: Props) => (
  <AlertModal.Body className={className}>
    <SharedFicheUpdateAlert fiche={fiche} />
    {children}
  </AlertModal.Body>
);
