import { appLabels } from '@/app/labels/catalog';
import { PasteError } from './grid-model';
import { CellError, ErrorReason } from './paste-values';

const ERROR_REASON_LABEL: Record<ErrorReason, string> = {
  out_of_grid: appLabels.demarchePcaetPolluantsErreurHorsGrille,
  not_numeric: appLabels.demarchePcaetPolluantsErreurNonNumerique,
};

const describeCellError = (error: CellError): string =>
  appLabels.demarchePcaetPolluantsErreurCellule({
    ligne: error.row + 1,
    colonne: error.column + 1,
    valeur: error.rawValue,
    raison: ERROR_REASON_LABEL[error.reason],
  });

export const formatPasteErrors = (
  errors: PasteError[],
  labelByIndicatorId: Map<number, string>
): string[] =>
  errors.map((pasteError) =>
    pasteError.kind === 'cell'
      ? describeCellError(pasteError.error)
      : appLabels.demarchePcaetPolluantsErreurRelativeSansReference({
          indicateur:
            labelByIndicatorId.get(pasteError.indicateurId) ??
            pasteError.indicateurId,
          annee: pasteError.year,
        })
  );
