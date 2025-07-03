import ExportFicheActionModal from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportModal/export-fa-modal';
import {
  makeCollectivitePlanActionUrl,
  makeCollectiviteToutesLesFichesUrl,
} from '@/app/app/paths';
import DeleteOrRemoveFicheSharingModal from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { FicheWithRelations } from '@/domain/plans/fiches';
import ModaleEmplacement from './EmplacementFiche/ModaleEmplacement';

type Props = {
  fiche: FicheWithRelations;
  isReadonly?: boolean;
  collectiviteId: number;
  planId?: number;
};

const Toolbar = ({
  fiche,
  isReadonly = false,
  collectiviteId,
  planId,
}: Props) => {
  const { id, titre, axes } = fiche;

  return (
    <div className="flex gap-4 lg:mt-3.5">
      {/* Rangement de la fiche */}
      {!isReadonly && <ModaleEmplacement {...{ fiche, isReadonly }} />}

      {/* Export PDF de la fiche */}
      <ExportFicheActionModal {...{ fiche }} />

      {/* Suppression de la fiche */}
      {!isReadonly && (
        <DeleteOrRemoveFicheSharingModal
          isReadonly={isReadonly}
          fiche={fiche}
          buttonClassName="!border-error-1 hover:!border-error-1"
          redirectPath={
            planId
              ? makeCollectivitePlanActionUrl({
                  collectiviteId: collectiviteId,
                  planActionUid: planId.toString(),
                })
              : makeCollectiviteToutesLesFichesUrl({
                  collectiviteId: collectiviteId,
                })
          }
        />
      )}
    </div>
  );
};

export default Toolbar;
