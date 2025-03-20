import { FicheAction } from '@/api/plan-actions';
import ExportFicheActionModal from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportModal/export-fa-modal';
import ModaleEmplacement from './EmplacementFiche/ModaleEmplacement';
import ModaleSuppression from './ModaleSuppression';

type Props = {
  fiche: FicheAction;
  isReadonly?: boolean;
};

const Toolbar = ({ fiche, isReadonly = false }: Props) => {
  const { id, titre, axes } = fiche;

  return (
    <div className="flex gap-4 lg:mt-3.5">
      {/* Rangement de la fiche */}
      {!isReadonly && <ModaleEmplacement {...{ fiche, isReadonly }} />}

      {/* Export PDF de la fiche */}
      <ExportFicheActionModal {...{ fiche }} />

      {/* Suppression de la fiche */}
      {!isReadonly && (
        <ModaleSuppression
          isReadonly={isReadonly}
          ficheId={id}
          title={titre}
          isInMultipleAxes={!!axes && axes.length > 1}
          buttonClassName="!border-error-1 hover:!border-error-1"
          redirect
        />
      )}
    </div>
  );
};

export default Toolbar;
