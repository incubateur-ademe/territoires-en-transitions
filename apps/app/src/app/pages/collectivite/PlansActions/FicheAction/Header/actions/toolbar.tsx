import { ExportFicheModal } from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportModal/export-fa-modal';
import DeleteOrRemoveFicheSharingModal from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { FicheWithRelations } from '@/domain/plans';
import { PermissionOperation } from '@/domain/users';
import ModaleEmplacement from './EmplacementFiche/ModaleEmplacement';

type Props = {
  fiche: FicheWithRelations;
  permissions: PermissionOperation[];
  collectiviteId: number;
  onDeleteRedirectPath: string;
};

const Toolbar = ({ fiche, permissions, onDeleteRedirectPath }: Props) => {
  return (
    <div className="flex gap-4 lg:mt-3.5">
      {hasPermission(permissions, 'plans.mutate') && (
        <ModaleEmplacement fiche={fiche} />
      )}

      <ExportFicheModal fiche={fiche} />

      <DeleteOrRemoveFicheSharingModal
        fiche={fiche}
        buttonClassName="!border-error-1 hover:!border-error-1"
        redirectPath={onDeleteRedirectPath}
      />
    </div>
  );
};

export default Toolbar;
