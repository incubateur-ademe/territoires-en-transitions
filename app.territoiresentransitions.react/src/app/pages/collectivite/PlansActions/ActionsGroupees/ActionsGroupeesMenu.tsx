import { Alert } from '@/ui';
import classNames from 'classnames';
import { FicheResume } from 'packages/api/src/plan-actions';
import ExportFicheActionModal from '../ExportPdf/export-pdf-fa.modal';
import EditionPilote from './EditionPilote';
import EditionPlanning from './EditionPlanning';
import EditionPriorite from './EditionPriorite';
import EditionStatut from './EditionStatut';
import EditionTagsLibres from './EditionTagsLibres';

type ActionsGroupeesMenuProps = {
  isGroupedActionsOn: boolean;
  selectedFiches: FicheResume[];
};

const ActionsGroupeesMenu = ({
  isGroupedActionsOn,
  selectedFiches,
}: ActionsGroupeesMenuProps) => {
  const selectedIds = selectedFiches.map((fiche) => fiche.id);
  const dateDebutArray = selectedFiches
    .map((fiche) => fiche.dateDebut)
    .filter((elt) => elt !== null && elt !== undefined) as string[];

  const minDateFin = dateDebutArray.length
    ? dateDebutArray.reduce((dateFin, currDate) => {
        if (new Date(currDate).getTime() > new Date(dateFin).getTime())
          return currDate;
        else return dateFin;
      })
    : null;

  return (
    <Alert
      className={classNames(
        'fixed left-0 bottom-0 border-t border-t-info-1 pt-2 pb-4 transition-all duration-500',
        {
          'opacity-100 z-50': isGroupedActionsOn && selectedFiches.length > 1,
          'opacity-0 -z-10': selectedFiches.length <= 1,
        }
      )}
      title="Appliquer une action groupée"
      description={
        <div className="flex gap-3 flex-wrap">
          <EditionPilote selectedIds={selectedIds} />
          <EditionStatut selectedIds={selectedIds} />
          <EditionPriorite selectedIds={selectedIds} />
          <EditionPlanning selectedIds={selectedIds} minDateFin={minDateFin} />
          <EditionTagsLibres selectedIds={selectedIds} />
          <ExportFicheActionModal
            fichesIds={selectedIds}
            buttonProps={{
              icon: 'file-pdf-line',
              size: 'xs',
              variant: 'outlined',
              children: 'Exporter au format PDF',
            }}
          />
        </div>
      }
      fullPageWidth
      noIcon
    />
  );
};

export default ActionsGroupeesMenu;
