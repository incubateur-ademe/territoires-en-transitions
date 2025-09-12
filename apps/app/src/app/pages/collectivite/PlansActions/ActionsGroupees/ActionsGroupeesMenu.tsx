import { FicheAccessBulkEditorModalButton } from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/fiche-access-bulk-editor.modal';
import { Alert } from '@/ui';
import classNames from 'classnames';
import ExportFicheActionModal from '../ExportPdf/ExportModal/export-fa-modal';
import EditionPilote from './EditionPilote';
import EditionPlanning from './EditionPlanning';
import EditionPriorite from './EditionPriorite';
import EditionStatut from './EditionStatut';
import EditionTagsLibres from './EditionTagsLibres';

type ActionsGroupeesMenuProps = {
  isGroupedActionsOn: boolean;
  selectedFicheIds: number[];
};

const MAX_NB_OF_FICHES_IN_PDF = 30;

const ActionsGroupeesMenu = ({
  isGroupedActionsOn,
  selectedFicheIds,
}: ActionsGroupeesMenuProps) => {
  return (
    <Alert
      className={classNames(
        'fixed left-0 bottom-0 border-t border-t-info-1 pt-2 pb-4 transition-all duration-500',
        {
          'opacity-100 z-50':
            isGroupedActionsOn && selectedFicheIds.length >= 1,
          'opacity-0 -z-10': selectedFicheIds.length < 1,
        }
      )}
      title="Appliquer une action groupée"
      description={
        <div className="flex gap-3 flex-wrap">
          <EditionPilote selectedIds={selectedFicheIds} />
          <EditionStatut selectedIds={selectedFicheIds} />
          <EditionPriorite selectedIds={selectedFicheIds} />
          <EditionPlanning selectedIds={selectedFicheIds} minDateFin={null} />
          <EditionTagsLibres selectedIds={selectedFicheIds} />
          <ExportFicheActionModal
            fichesIds={selectedFicheIds}
            buttonProps={{
              icon: 'file-pdf-line',
              size: 'xs',
              variant: 'outlined',
              children: 'Exporter au format PDF',
              disabled: selectedFicheIds.length > MAX_NB_OF_FICHES_IN_PDF,
              title:
                selectedFicheIds.length > MAX_NB_OF_FICHES_IN_PDF
                  ? `Pour des raisons de performance, l'export PDF n'est pas possible au delà de ${MAX_NB_OF_FICHES_IN_PDF} fiches`
                  : `Exporter au format PDF (max ${MAX_NB_OF_FICHES_IN_PDF} fiches)`,
            }}
          />
          <FicheAccessBulkEditorModalButton selectedIds={selectedFicheIds} />
        </div>
      }
      fullPageWidth
      noIcon
    />
  );
};

export default ActionsGroupeesMenu;
