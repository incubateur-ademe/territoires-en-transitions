import { FicheAccessBulkEditorModalButton } from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/fiche-access-bulk-editor.modal';
import { useBulkFichesEdit } from '@/app/plans/fiches/list-all-fiches/data/use-bulk-fiches-edit';
import { Filters } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { Alert, Button, VisibleWhen } from '@/ui';
import classNames from 'classnames';

import { ExportMultipleFichesModal } from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportModal/export-fa-modal';
import { useShareFicheEnabled } from '@/app/plans/fiches/share-fiche/use-share-fiche-enabled';
import { SortOptions } from '@/domain/plans';
import EditionPilote from './EditionPilote';
import EditionPlanning from './EditionPlanning';
import EditionPriorite from './EditionPriorite';
import EditionStatut from './EditionStatut';
import EditionTagsLibres from './EditionTagsLibres';

type ActionsGroupeesMenuProps = {
  isVisible: boolean;
  selectedFicheIds: number[] | 'all';
  filters: Filters;
  sort?: SortOptions;
  fichesCountExportedToPDF: number;
};

const ExportButton = ({
  fichesCountExportedToPDF,
  selectedFicheIds,
  filters,
  sort,
}: {
  selectedFicheIds: number[] | 'all';
  filters: Filters;
  sort?: SortOptions;
  fichesCountExportedToPDF: number;
}) => {
  const MAX_NB_OF_FICHES_IN_PDF = 30;

  const tooManyFichesToExportPDF =
    fichesCountExportedToPDF > MAX_NB_OF_FICHES_IN_PDF;

  if (tooManyFichesToExportPDF) {
    return (
      <Button variant="outlined" size="xs" disabled icon="alert-fill">
        {`Export limité à ${MAX_NB_OF_FICHES_IN_PDF} fiches`}
      </Button>
    );
  }

  return (
    <ExportMultipleFichesModal
      selectedFicheIds={selectedFicheIds}
      filters={filters}
      sort={sort}
    />
  );
};

const ActionsGroupeesMenu = ({
  isVisible,
  selectedFicheIds,
  filters,
  sort,
  fichesCountExportedToPDF,
}: ActionsGroupeesMenuProps) => {
  const { mutate } = useBulkFichesEdit({ filters, selectedFicheIds });
  const shareFicheFlagEnabled = useShareFicheEnabled();
  return (
    <Alert
      className={classNames(
        'fixed left-0 bottom-0 border-t border-t-info-1 pt-2 pb-4 transition-all duration-500',
        {
          'opacity-100 z-50': isVisible,
          'opacity-0 -z-10': !isVisible,
        }
      )}
      title="Appliquer une action groupée"
      description={
        <div className="flex gap-3 flex-wrap">
          <EditionPilote onUpdate={mutate('pilotes')} />
          <EditionStatut onUpdate={mutate('statut')} />
          <EditionPriorite onUpdate={mutate('priorite')} />
          <EditionPlanning onUpdate={mutate('dateFin')} />
          <EditionTagsLibres onUpdate={mutate('libreTags')} />
          <ExportButton
            fichesCountExportedToPDF={fichesCountExportedToPDF}
            selectedFicheIds={selectedFicheIds}
            filters={filters}
            sort={sort}
          />
          <VisibleWhen condition={shareFicheFlagEnabled === true}>
            <FicheAccessBulkEditorModalButton onUpdate={mutate('acces')} />
          </VisibleWhen>
        </div>
      }
      fullPageWidth
      noIcon
    />
  );
};

export default ActionsGroupeesMenu;
