import Chemins from './Chemins';
import FicheActionSupprimerModal from '../FicheActionSupprimerModal';
import {useDeleteFicheAction} from '../data/useDeleteFicheAction';
import {FicheAction} from '../data/types';
import {usePlanActionProfondeur} from '../../PlanAction/data/usePlanActionProfondeur';
import FicheActionRangerModal from '../FicheActionRangerModal/FicheActionRangerModal';
import {useExportFicheAction} from '../data/useExportFicheAction';
import ToggleButton from 'ui/shared/designSystem/ToggleButton';
import {useEditFicheAction} from '../data/useUpsertFicheAction';
import {Tooltip} from '@tet/ui';

type TFicheActionHeader = {
  fiche: FicheAction;
  isReadonly?: boolean;
};

const FicheActionHeader = ({fiche, isReadonly}: TFicheActionHeader) => {
  const {mutate: updateFiche} = useEditFicheAction();
  const {mutate: exportFiche, isLoading} = useExportFicheAction(fiche.id);
  const {mutate: deleteFiche} = useDeleteFicheAction({
    ficheId: fiche.id!,
    axeId: null,
  });
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
          <div className="mr-auto">
            <Tooltip
              label={
                <p className="w-96">
                  Si le mode privé est activé la fiche action n'est plus
                  consultable par les personnes n’étant pas membres de votre
                  collectivité.
                  <br />
                  <br />
                  La fiche reste consultable par l’ADEME et le service support
                  de la plateforme.
                </p>
              }
            >
              <ToggleButton
                data-test="FicheToggleConfidentialite"
                isChecked={fiche.restreint}
                onClick={() =>
                  updateFiche({...fiche, restreint: !fiche.restreint})
                }
                description="Fiche action en mode privé"
              />
            </Tooltip>
          </div>
          {plansProfondeur?.plans && plansProfondeur.plans.length > 0 && (
            <FicheActionRangerModal
              fiche={fiche}
              toggleButtonTitle={generateButtonTitle()}
            />
          )}
          <FicheActionSupprimerModal
            isInMultipleAxes={(fiche.axes && fiche.axes.length > 1) || false}
            onDelete={() => deleteFiche()}
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
