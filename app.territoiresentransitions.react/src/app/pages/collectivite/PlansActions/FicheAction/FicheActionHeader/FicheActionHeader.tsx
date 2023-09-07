import Chemins from './Chemins';
import FicheActionSupprimerModal from '../FicheActionSupprimerModal';
import {useDeleteFicheAction} from '../data/useDeleteFicheAction';
import {FicheAction} from '../data/types';
import {usePlanActionProfondeur} from '../../PlanAction/data/usePlanActionProfondeur';
import FicheActionRangerModal from '../FicheActionRangerModal/FicheActionRangerModal';
import {useExportFicheAction} from '../data/useExportFicheAction';

type TFicheActionHeader = {
  fiche: FicheAction;
  isReadonly?: boolean;
};

const FicheActionHeader = ({fiche, isReadonly}: TFicheActionHeader) => {
  const {mutate: exportFiche, isLoading} = useExportFicheAction(fiche.id);
  const {mutate: deleteFiche} = useDeleteFicheAction();
  const plansProfondeur = usePlanActionProfondeur();

  const generateButtonTitle = () => {
    if (!fiche.axes || fiche.axes.length === 0) {
      return 'Ranger la fiche dans un plan d’actions';
    } else {
      return 'Mutualiser l’emplacement de la fiche';
    }
  };

  return (
    <div className="py-6">
      {/** Actions */}
      {!isReadonly && (
        <div className="mb-6 flex items-center justify-end gap-4">
          {plansProfondeur?.plans && plansProfondeur.plans.length > 0 && (
            <FicheActionRangerModal
              fiche={fiche}
              toggleButtonTitle={generateButtonTitle()}
            />
          )}
          <FicheActionSupprimerModal
            fiche={fiche}
            onDelete={() => deleteFiche(fiche.id!)}
          />
          <button
            className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-download-line"
            disabled={isLoading}
            title="Exporter cette fiche"
            onClick={() => exportFiche('docx')}
          />
        </div>
      )}
      {/** Fils d'ariane */}
      <Chemins fiche={fiche} />
    </div>
  );
};

export default FicheActionHeader;
