import {
  DEPRECATED_Table,
  DEPRECATED_TBody,
  DEPRECATED_TCell,
  DEPRECATED_THead,
  DEPRECATED_THeadCell,
  DEPRECATED_THeadRow,
  DEPRECATED_TRow,
  Modal,
  ModalFooterOKCancel,
} from '@tet/ui';
import { appLabels } from '@/app/labels/catalog';
import { useState } from 'react';
import { PreparedValue } from '../data/prepare-data';
import { CellValue } from './cell-value';

type ConfirmDeleteProps = {
  unite: string;
  valeur: PreparedValue;
  onDismissConfirm: (overwrite: boolean) => void;
};

/** Affiche un dialogue de confirmation avant suppression d'une valeur
 */
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
    <Modal
      disableDismiss
      noCloseButton
      size="lg"
      title={appLabels.confirmerSuppression}
      subTitle={appLabels.suppressionDonneesCollectivite({ annee })}
      openState={{ isOpen, setIsOpen }}
      render={() => (
        <>
          <p className="text-center mb-0">
            {appLabels.suppressionAnneeAttention({ annee })}
          </p>
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
        </>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            children: appLabels.confirmer,
            onClick: () => {
              onDismissConfirm(true);
              close();
            },
          }}
          btnCancelProps={{
            onClick: () => {
              onDismissConfirm(false);
              close();
            },
          }}
        />
      )}
    />
  );
};
