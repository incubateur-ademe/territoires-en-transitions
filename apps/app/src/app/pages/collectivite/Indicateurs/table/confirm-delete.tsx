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
} from '@/ui';
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
      title="Confirmer la suppression"
      subTitle={`des données de la collectivité pour l'année ${annee}`}
      openState={{ isOpen, setIsOpen }}
      render={() => (
        <>
          <p className="text-center mb-0">
            Attention, les données existantes pour l&apos;année <b>{annee}</b>{' '}
            seront supprimées.
          </p>
          <DEPRECATED_Table>
            <DEPRECATED_THead>
              <DEPRECATED_THeadRow>
                <DEPRECATED_THeadCell>&nbsp;</DEPRECATED_THeadCell>
                <DEPRECATED_THeadCell>Valeur</DEPRECATED_THeadCell>
                <DEPRECATED_THeadCell>Commentaire</DEPRECATED_THeadCell>
              </DEPRECATED_THeadRow>
            </DEPRECATED_THead>
            <DEPRECATED_TBody>
              <DEPRECATED_TRow>
                <DEPRECATED_TCell className="font-medium">
                  Résultat ({unite})
                </DEPRECATED_TCell>
                <CellValue readonly value={resultat ?? ''} />
                <DEPRECATED_TCell>{resultatCommentaire}</DEPRECATED_TCell>
              </DEPRECATED_TRow>
              <DEPRECATED_TRow>
                <DEPRECATED_TCell className="font-medium">
                  Objectif ({unite})
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
            children: 'Confirmer',
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
