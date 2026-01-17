import { ExportFicheModal } from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportModal/export-fa-modal';
import { DeleteOrRemoveFicheSharingModal } from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { PermissionOperation } from '@tet/domain/users';
import { Fiche } from '../../data/use-get-fiche';
import ModaleEmplacement from './EmplacementFiche/ModaleEmplacement';

type Props = {
  fiche: Fiche;
  hasCollectivitePermission: (permission: PermissionOperation) => boolean;
  onDeleteCallback: () => void;
};

const Toolbar = ({ fiche, hasCollectivitePermission, onDeleteCallback }: Props) => {
  return (
    <div className="flex gap-4 lg:mt-3.5">
      {hasCollectivitePermission('plans.mutate') && (
        <ModaleEmplacement fiche={fiche} />
      )}

      <ExportFicheModal fiche={fiche} />

      <DeleteOrRemoveFicheSharingModal
        fiche={fiche}
        buttonClassName="!border-error-1 hover:!border-error-1"
        onDeleteCallback={onDeleteCallback}
      />
    </div>
  );
};

export default Toolbar;
