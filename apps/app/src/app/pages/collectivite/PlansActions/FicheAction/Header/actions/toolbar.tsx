import { ExportSingleFicheModal } from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportModal/export-fa-modal';
import DeleteOrRemoveFicheSharingModal from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { FicheWithRelations } from '@/domain/plans/fiches';
import ModaleEmplacement from './EmplacementFiche/ModaleEmplacement';

type Props = {
  fiche: FicheWithRelations;
  isReadonly?: boolean;
  collectiviteId: number;
  planId?: number;
  onDeleteRedirectPath: string;
};

const Toolbar = ({
  fiche,
  isReadonly = false,
  onDeleteRedirectPath,
}: Props) => {
  return (
    <div className="flex gap-4 lg:mt-3.5">
      {!isReadonly && (
        <ModaleEmplacement fiche={fiche} isReadonly={isReadonly} />
      )}

      <ExportSingleFicheModal fiche={fiche} />

      {!isReadonly && (
        <DeleteOrRemoveFicheSharingModal
          isReadonly={isReadonly}
          fiche={fiche}
          buttonClassName="!border-error-1 hover:!border-error-1"
          redirectPath={onDeleteRedirectPath}
        />
      )}
    </div>
  );
};

export default Toolbar;
