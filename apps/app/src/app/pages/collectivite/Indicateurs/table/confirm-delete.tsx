import {
  DEPRECATED_Table,
  DEPRECATED_TBody,
  DEPRECATED_TCell,
  DEPRECATED_THead,
  DEPRECATED_THeadCell,
  DEPRECATED_THeadRow,
  DEPRECATED_TRow,
} from '@tet/ui';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
import { appLabels } from '@/app/labels/catalog';
import { useState } from 'react';
import { PreparedValue } from '../data/prepare-data';
import { CellValue } from './cell-value';

type ConfirmDeleteProps = {
  unite: string;
  valeur: PreparedValue;
  onDismissConfirm: (overwrite: boolean) => void;
};

/** Affiche un dialogue de confirmation avant suppression d'une valeur */
export const ConfirmDelete = (props: ConfirmDeleteProps) => {
  const { valeur, unite, onDismissConfirm } = props;
  const [isOpen, setIsOpen] = useState(true);
  const {
    objectif,
    objectifCommentaire,
    resultat,
    resultatCommentaire,
    annee,
  } = valeur;

  return (
    <AlertModal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }} size="lg">
      <AlertModal.Header>
        <AlertModal.Title>{appLabels.confirmerSuppression}</AlertModal.Title>
        <AlertModal.Subtitle>
          {appLabels.suppressionDonneesCollectivite({ annee })}
        </AlertModal.Subtitle>
      </AlertModal.Header>
      <AlertModal.Body>
        <AlertModal.Description>
          {appLabels.suppressionAnneeAttention({ annee })}
        </AlertModal.Description>
        <DEPRECATED_Table>
          <DEPRECATED_THead>
            <DEPRECATED_THeadRow>
              <DEPRECATED_THeadCell>&nbsp;</DEPRECATED_THeadCell>
              <DEPRECATED_THeadCell>
                {appLabels.confirmDeleteValeur}
              </DEPRECATED_THeadCell>
              <DEPRECATED_THeadCell>
                {appLabels.commentaire}
              </DEPRECATED_THeadCell>
            </DEPRECATED_THeadRow>
          </DEPRECATED_THead>
          <DEPRECATED_TBody>
            <DEPRECATED_TRow>
              <DEPRECATED_TCell className="font-medium">
                {appLabels.confirmDeleteResultatUnite({ unite })}
              </DEPRECATED_TCell>
              <CellValue readonly value={resultat ?? ''} />
              <DEPRECATED_TCell>{resultatCommentaire}</DEPRECATED_TCell>
            </DEPRECATED_TRow>
            <DEPRECATED_TRow>
              <DEPRECATED_TCell className="font-medium">
                {appLabels.confirmDeleteObjectifUnite({ unite })}
              </DEPRECATED_TCell>
              <CellValue readonly value={objectif ?? ''} />
              <DEPRECATED_TCell>{objectifCommentaire}</DEPRECATED_TCell>
            </DEPRECATED_TRow>
          </DEPRECATED_TBody>
        </DEPRECATED_Table>
      </AlertModal.Body>
      <AlertModal.Footer>
        <AlertModal.Cancel onClick={() => onDismissConfirm(false)}>
          {appLabels.annuler}
        </AlertModal.Cancel>
        <AlertModal.Action onClick={() => onDismissConfirm(true)}>
          {appLabels.confirmer}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
};
