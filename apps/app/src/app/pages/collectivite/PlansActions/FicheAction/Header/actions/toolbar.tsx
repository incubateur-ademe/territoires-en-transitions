import { ExportSingleFicheModal } from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportModal/export-fa-modal';
import { FichePiloteRequestModale } from '@/app/app/pages/collectivite/PlansActions/FicheAction/FicheActionDescription/FichePiloteRequestModale.modal';
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
  planId,
  onDeleteRedirectPath,
}: Props) => {
  return (
    <div className="flex gap-4 lg:mt-3.5">
      {/* Modification de la fiche */}
      {!isReadonly && !fiche.canBeModifiedByCurrentUser && (
        <FichePiloteRequestModale {...{ fiche, planId }} />
      )}

      {!isReadonly && fiche.canBeModifiedByCurrentUser && (
        <ModaleEmplacement fiche={fiche} isReadonly={isReadonly} />
      )}

      <ExportSingleFicheModal fiche={fiche} />

      {!isReadonly && fiche.canBeModifiedByCurrentUser && (
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
