import { FicheAccessBulkEditorModalButton } from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/fiche-access-bulk-editor.modal';
import { useBulkFichesEdit } from '@/app/plans/fiches/list-all-fiches/data/use-bulk-fiches-edit';
import { Filters } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { cn, VisibleWhen } from '@tet/ui';

import { SortOptions } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useShareFicheEnabled } from '@/app/plans/fiches/share-fiche/use-share-fiche-enabled';
import { ExportMultipleFichesModal } from '@/app/plans/fiches/show-fiche/header/menu/actions/pdf-export/ExportModal/export-fa-modal';
import EditionPilote from './EditionPilote';
import EditionPlanning from './EditionPlanning';
import EditionPriorite from './EditionPriorite';
import EditionReferent from './EditionReferent';
import EditionService from './EditionService';
import EditionStatut from './EditionStatut';
import EditionTagsLibres from './EditionTagsLibres';

type ActionsGroupeesMenuProps = {
  isVisible: boolean;
  selectedFicheIds: number[] | 'all';
  totalFilteredCount: number;
  filters: Filters;
  sort?: SortOptions;
};

const ExportButton = ({
  selectedFicheIds,
  totalFilteredCount,
  filters,
  sort,
}: {
  selectedFicheIds: number[] | 'all';
  totalFilteredCount: number;
  filters: Filters;
  sort?: SortOptions;
}) => {
  return (
    <ExportMultipleFichesModal
      selectedFicheIds={selectedFicheIds}
      totalFilteredCount={totalFilteredCount}
      filters={filters}
      sort={sort}
    />
  );
};

const ActionsGroupeesMenu = ({
  isVisible,
  selectedFicheIds,
  totalFilteredCount,
  filters,
  sort,
}: ActionsGroupeesMenuProps) => {
  const { mutate } = useBulkFichesEdit({ filters, selectedFicheIds });
  const shareFicheFlagEnabled = useShareFicheEnabled();
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 bg-info-2 border-t border-t-info-1 transition-all duration-500',
        {
          'opacity-100 z-50': isVisible,
          'opacity-0 -z-10': !isVisible,
        }
      )}
    >
      <div className="mx-auto max-w-8xl p-6">
        <div className="mb-3 font-bold text-info-1">
          Appliquer une action groupée
        </div>
        <div className="flex gap-3 flex-wrap">
          <EditionPilote onUpdate={mutate('pilotes')} />
          <EditionStatut onUpdate={mutate('statut')} />
          <EditionPriorite onUpdate={mutate('priorite')} />
          <EditionReferent onUpdate={mutate('referents')} />
          <EditionService onUpdate={mutate('services')} />
          <EditionPlanning onUpdate={mutate('dateFin')} />
          <EditionTagsLibres onUpdate={mutate('libreTags')} />
          <ExportButton
            selectedFicheIds={selectedFicheIds}
            totalFilteredCount={totalFilteredCount}
            filters={filters}
            sort={sort}
          />
          <VisibleWhen condition={shareFicheFlagEnabled === true}>
            <FicheAccessBulkEditorModalButton onUpdate={mutate('acces')} />
          </VisibleWhen>
        </div>
      </div>
    </div>
  );
};

export default ActionsGroupeesMenu;
