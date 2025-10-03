import { FicheAccessBulkEditorModalButton } from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/fiche-access-bulk-editor.modal';
import { useBulkFichesEdit } from '@/app/plans/fiches/list-all-fiches/data/use-bulk-fiches-edit';
import { Filters } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { Alert, VisibleWhen } from '@/ui';
import classNames from 'classnames';

import { ExportFichesModal } from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportModal/export-fa-modal';
import { useShareFicheEnabled } from '@/app/plans/fiches/share-fiche/use-share-fiche-enabled';
import { SortOptions } from '@/domain/plans/fiches';
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
};

const MAX_NB_OF_FICHES_IN_PDF = 30;

const ActionsGroupeesMenu = ({
  isVisible,
  selectedFicheIds,
  filters,
  sort,
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
          <ExportFichesModal
            selectedFicheIds={selectedFicheIds}
            disabled={selectedFicheIds.length > MAX_NB_OF_FICHES_IN_PDF}
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
