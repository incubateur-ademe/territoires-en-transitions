import { appLabels } from '@/app/labels/catalog';
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
import { capitalize } from '@tet/ui/labels/plural';
import { useState } from 'react';
import { IndicateurPeriodes } from '@tet/domain/indicateurs';
import type { IndicateurPeriodeValue } from '../data/prepare-indicateur-periode-data';
import { CellValue } from './cell-value';

type ConfirmDeleteProps = {
  unite: string;
  valeur: IndicateurPeriodeValue;
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
    periode,
  } = valeur;

  return (
    <Modal
      disableDismiss
      noCloseButton
      size="lg"
      title={appLabels.confirmerSuppression}
      subTitle={appLabels.indicateurSuppressionDonneesCollectivite(
        IndicateurPeriodes.format(periode)
      )}
      openState={{ isOpen, setIsOpen }}
      render={() => (
        <>
          <p className="text-center mb-0">
            {appLabels.indicateurSuppressionPeriodeAttention(
              IndicateurPeriodes.format(periode)
            )}
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
                  {`${capitalize(appLabels.indicateurResultat())} (${unite})`}
                </DEPRECATED_TCell>
                <CellValue readonly value={resultat ?? ''} />
                <DEPRECATED_TCell>{resultatCommentaire}</DEPRECATED_TCell>
              </DEPRECATED_TRow>
              <DEPRECATED_TRow>
                <DEPRECATED_TCell className="font-medium">
                  {`${capitalize(appLabels.indicateurObjectif())} (${unite})`}
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
