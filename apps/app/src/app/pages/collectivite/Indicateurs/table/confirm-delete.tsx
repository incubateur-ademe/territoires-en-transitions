import { appLabels } from '@/app/labels/catalog';
import {
  Modal,
  ModalFooterOKCancel,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { useState } from 'react';
import { IndicateurPeriodes } from '@tet/domain/indicateurs';
import type { PreparedValue } from '../data/prepare-data';
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
          <div className="overflow-x-auto rounded-xl border border-grey-3">
            <Table className="table-auto">
              <TableHead>
                <tr>
                  <TableHeaderCell />
                  <TableHeaderCell title={appLabels.confirmDeleteValeur} />
                  <TableHeaderCell title={appLabels.commentaire} />
                </tr>
              </TableHead>
              <tbody>
                <TableRow>
                  <TableCell className="font-medium">
                    {`${capitalize(appLabels.indicateurResultat())} (${unite})`}
                  </TableCell>
                  <CellValue value={resultat ?? ''} />
                  <TableCell>{resultatCommentaire}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    {`${capitalize(appLabels.indicateurObjectif())} (${unite})`}
                  </TableCell>
                  <CellValue value={objectif ?? ''} />
                  <TableCell>{objectifCommentaire}</TableCell>
                </TableRow>
              </tbody>
            </Table>
          </div>
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
