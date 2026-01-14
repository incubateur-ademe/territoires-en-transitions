import { TProfondeurAxe } from '@/app/plans/plans/types';
import { checkAxeExistInPlanProfondeur } from '@/app/plans/plans/utils';
import { FicheWithRelations } from '@tet/domain/plans';
import { Alert, Button } from '@tet/ui';
import { useFicheContext } from '../../../../../context/fiche-context';
import { usePlanActionProfondeur } from '../../../../../data/usePlanActionProfondeur';
import { useSelectAxes } from '../use-select-axes';
import { ColonneTableauEmplacement } from './ColonneTableauEmplacement';

type NouvelEmplacementFicheProps = {
  fiche: FicheWithRelations;
  onSave: () => void;
};

const NouvelEmplacementFiche = ({
  fiche,
  onSave,
}: NouvelEmplacementFicheProps) => {
  const plansProfondeur = usePlanActionProfondeur();

  const { update } = useFicheContext();

  // Tableau contenant les ids des axes de la fiche
  const ficheAxesIds = (fiche.axes ?? []).map((axe) => axe.id);

  // On retire les plans qui contiennent déjà la fiche
  const plans = plansProfondeur?.plans.filter(
    (plan) =>
      !ficheAxesIds.some((id) => checkAxeExistInPlanProfondeur(plan.plan, id))
  );

  // gestion de la sélection d'un emplacement
  const {
    selectedAxes,
    setSelectedAxes,
    handleSelectAxe: handleSelectAxeBase,
  } = useSelectAxes();

  // Gestion de la sélection d'un nouvel axe
  const handleSelectAxe = (selectedAxe: TProfondeurAxe) => {
    const selectedDepth = selectedAxe.profondeur;
    const currentDepth = selectedAxes.length - 1;
    handleSelectAxeBase(selectedAxe);

    setTimeout(() => {
      // Le setTimeout permet d'attendre que la mise à jour de 'selectedAxes' soit terminée
      // et que la nouvelle colonne soit bien affichée avant de calculer 'idToScrollTo'
      if (
        (selectedAxe.enfants &&
          selectedAxe.enfants[0].profondeur > currentDepth) ||
        (!selectedAxe.enfants && selectedDepth > currentDepth)
      ) {
        const idToScrollTo = selectedAxe.enfants
          ? selectedAxe.enfants[0].axe.id
          : selectedAxe.axe.id;
        const element = document.getElementById(idToScrollTo.toString());

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', inline: 'end' });
        }
      }
    }, 0);
  };

  // Sauvegarde du plan sélectionné
  const handleSave = () => {
    const { axe } = selectedAxes[selectedAxes.length - 1];

    const updatedAxes =
      fiche.axes?.map((currentAxe) => ({
        id: currentAxe.id,
      })) || [];
    if (!updatedAxes.find((currentAxe) => currentAxe.id === axe.id)) {
      updatedAxes.push({
        id: axe.id,
      });
      update({
        ficheId: fiche.id,
        ficheFields: {
          axes: updatedAxes,
        },
      });
    }

    setSelectedAxes([]);
    onSave();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Message d'info */}
      <Alert title="Le contenu de l'action sera mis à jour de manière synchronisée quel que soit l’emplacement" />

      {/* Arborescence des plans d'action disponibles */}
      {plans && plans.length > 0 ? (
        <div className="border border-grey-3 rounded-lg grid grid-flow-col auto-cols-[16rem] overflow-x-auto divide-x-[0.5px] divide-primary-3 py-3">
          <ColonneTableauEmplacement
            axesList={plans.map((plan) => plan.plan)}
            selectedAxesIds={selectedAxes.map((axe) => axe.axe.id)}
            maxSelectedDepth={selectedAxes.length - 1}
            onSelectAxe={handleSelectAxe}
          />

          {selectedAxes.map((axe) => {
            return axe.enfants ? (
              <ColonneTableauEmplacement
                key={axe.axe.id}
                axesList={axe.enfants}
                selectedAxesIds={selectedAxes.map((axe) => axe.axe.id)}
                maxSelectedDepth={selectedAxes.length - 1}
                onSelectAxe={handleSelectAxe}
              />
            ) : null;
          })}
        </div>
      ) : (
        <span className="text-primary-9 text-sm font-bold">
          {"Il n'existe aucun plan auquel rattacher cette action"}
        </span>
      )}

      {/* Bouton de validation */}
      {plans && plans.length > 0 && (
        <Button
          onClick={handleSave}
          disabled={!selectedAxes.length}
          aria-label="Valider"
          className="ml-auto"
        >
          Valider ce nouvel emplacement
        </Button>
      )}
    </div>
  );
};

export default NouvelEmplacementFiche;
