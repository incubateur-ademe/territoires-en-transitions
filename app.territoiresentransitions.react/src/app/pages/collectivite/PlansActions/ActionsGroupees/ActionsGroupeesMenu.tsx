import { Alert } from '@/ui';
import classNames from 'classnames';
import ExportFicheActionGroupeesButton from '../ExportPdf/ExportFicheActionGroupeesButton';
import EditionPilote from './EditionPilote';
import EditionStatut from './EditionStatut';

type ActionsGroupeesMenuProps = {
  isGroupedActionsOn: boolean;
  selectedIds: number[];
};

const ActionsGroupeesMenu = ({
  isGroupedActionsOn,
  selectedIds,
}: ActionsGroupeesMenuProps) => {
  return (
    <Alert
      className={classNames(
        'absolute left-0 bottom-0 border-t border-t-info-1 pt-2 pb-4 transition-all duration-500',
        {
          'opacity-100 z-50': isGroupedActionsOn && selectedIds.length > 1,
          'opacity-0 -z-10': selectedIds.length <= 1,
        }
      )}
      title="Appliquer une action groupée"
      description={
        <div className="flex gap-3 flex-wrap">
          <EditionPilote selectedIds={selectedIds} />
          <EditionStatut selectedIds={selectedIds} />
          <ExportFicheActionGroupeesButton fichesIds={selectedIds} />
        </div>
      }
      fullPageWidth
      noIcon
    />
  );
};

export default ActionsGroupeesMenu;
