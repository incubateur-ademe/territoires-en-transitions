import ExportFicheActionModal from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportModal/export-fa-modal';
import { FichePiloteRequestModale } from '@/app/app/pages/collectivite/PlansActions/FicheAction/FicheActionDescription/FichePiloteRequestModale.modal';
import DeleteOrRemoveFicheSharingModal from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { FicheWithRelations } from '@/domain/plans/fiches';
import ModaleEmplacement from './EmplacementFiche/ModaleEmplacement';

type Props = {
  fiche: FicheWithRelations;
  isReadonly?: boolean;
  isEditable: boolean;
  collectiviteId: number;
  planId?: number;
  onDeleteRedirectPath: string;
};

const Toolbar = ({
  fiche,
  isReadonly = false,
  isEditable,
  planId,
  onDeleteRedirectPath,
}: Props) => {
  return (
    <div className="flex gap-4 lg:mt-3.5">
      {/* Modification de la fiche */}
      {!isReadonly && !isEditable && (
        <FichePiloteRequestModale {...{ fiche, planId }} />
      )}

      {/* Rangement de la fiche */}
      {!isReadonly && isEditable && (
        <ModaleEmplacement {...{ fiche, isReadonly }} />
      )}

      {/* Export PDF de la fiche */}
      <ExportFicheActionModal {...{ fiche }} />

      {/* Suppression de la fiche */}
      {!isReadonly && isEditable && (
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
