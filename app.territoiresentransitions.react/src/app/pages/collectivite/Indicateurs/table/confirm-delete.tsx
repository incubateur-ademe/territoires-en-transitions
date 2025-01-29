import {
  Modal,
  ModalFooterOKCancel,
  Table,
  TBody,
  TCell,
  THead,
  THeadCell,
  THeadRow,
  TRow,
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
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>&nbsp;</THeadCell>
                <THeadCell>Valeur</THeadCell>
                <THeadCell>Commentaire</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              <TRow>
                <TCell className="font-medium">Résultat ({unite})</TCell>
                <CellValue readonly value={resultat ?? ''} />
                <TCell>{resultatCommentaire}</TCell>
              </TRow>
              <TRow>
                <TCell className="font-medium">Objectif ({unite})</TCell>
                <CellValue readonly value={objectif ?? ''} />
                <TCell>{objectifCommentaire}</TCell>
              </TRow>
            </TBody>
          </Table>
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
