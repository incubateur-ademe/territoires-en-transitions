import { ExportFicheModal } from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportModal/export-fa-modal';
import { DeleteOrRemoveFicheSharingModal } from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { PermissionOperation } from '@tet/domain/users';
import { Fiche } from '../../data/use-get-fiche';
import ModaleEmplacement from './EmplacementFiche/ModaleEmplacement';

type Props = {
  fiche: Fiche;
  permissions: PermissionOperation[];
  collectiviteId: number;
  onDeleteCallback: () => void;
};

const Toolbar = ({ fiche, permissions, onDeleteCallback }: Props) => {
  return (
    <div className="flex gap-4 lg:mt-3.5">
      {hasPermission(permissions, 'plans.mutate') && (
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
