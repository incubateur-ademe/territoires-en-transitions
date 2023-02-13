import {useState} from 'react';
import SpinnerLoader from 'ui/shared/SpinnerLoader';

import {TProfondeurAxe} from '../../PlanAction/data/types/profondeurPlan';
import {usePlanActionProfondeur} from '../../PlanAction/data/usePlanActionProfondeur';
import {TAxeInsert} from '../data/types/alias';
import {FicheActionVueRow} from '../data/types/ficheActionVue';
import {useAddFicheToAxe} from '../data/useAddFicheToAxe';
import TableauAxe from './TableauAxe';

type Props = {
  fiche: FicheActionVueRow;
};

const TableauNouvelEmplacement = ({fiche}: Props) => {
  const plansProfondeur = usePlanActionProfondeur();

  // Tableau contenant les ids des axes de la fiche
  const ficheAxesIds = fiche.axes
    ? fiche.axes.map((axe: TAxeInsert) => axe.id)
    : [];

  // fonction recursive qui vérifie si un axe est présent dans un plan
  const checkAxeExistInPlan = (
    plan: TProfondeurAxe,
    axeId: number
  ): boolean => {
    const getAllAxeIds = (plan: TProfondeurAxe): number[] => {
      let ids: number[] = [];
      ids.push(plan.axe.id);
      if (plan.enfants) {
        plan.enfants.forEach(enfant => {
          ids = ids.concat(getAllAxeIds(enfant));
        });
      }
      return ids;
    };

    return getAllAxeIds(plan).includes(axeId);
  };

  // On retire les plans qui contiennent déjà la fiche
  const plans = plansProfondeur?.plans.filter(
    plan =>
      !ficheAxesIds
        .map(id => checkAxeExistInPlan(plan.plan, id!))
        .includes(true)
  );

  const {mutate: addFicheToAxe, isLoading} = useAddFicheToAxe();

  // L'axe sélectionné et ceux dont il est l'enfant
  const [selectedAxes, setSelectedAxes] = useState<TProfondeurAxe[]>([]);

  // Détermine le nombre de colonne en fonction de la profondeur des axes sélectionnés
  const colonnes = selectedAxes.reduce(
    (acc: number[], curr) => {
      if (!acc.includes(curr.profondeur)) {
        acc.push(curr.profondeur);
      }
      if (curr.enfants) {
        curr.enfants.forEach(axe => {
          if (!acc.includes(axe.profondeur)) {
            acc.push(axe.profondeur);
          }
        });
      }
      return acc;
    },
    [0]
  );

  const selectAxe = (clickedAxe: TProfondeurAxe) => {
    // Si l'axe cliqué n'est pas déjà sélectionné
    if (!selectedAxes.includes(clickedAxe)) {
      // on ne garde que les axes de profondeur inférieur à l'axe cliqué
      // et on l'ajoute aux axes sélectionné
      setSelectedAxes([
        ...selectedAxes.filter(axe => axe.profondeur < clickedAxe.profondeur),
        clickedAxe,
      ]);
    }
    // Si l'axe cliqué est déjà sélectionné
    else {
      // Et qu'il est le dernier sous-axe sélectionné
      if (clickedAxe.profondeur === selectedAxes.length - 1) {
        // on le retire des axes sélectionnés,
        setSelectedAxes(
          selectedAxes.filter(
            (axe: TProfondeurAxe) => axe.axe.id !== clickedAxe.axe.id
          )
        );
      }
      // Et que ce n'est pas le dernier sous-axe sélectionné
      else {
        // on retire tous les axes de profondeur supérieur
        setSelectedAxes(
          selectedAxes.filter(
            (axe: TProfondeurAxe) => axe.profondeur <= clickedAxe.profondeur
          )
        );
      }
    }
  };

  return (
    <div className="flex flex-col p-4 border border-gray-200 rounded-lg">
      {plans && plans.length > 0 ? (
        <div className="flex flex-col">
          <div className="grid grid-flow-col auto-cols-[16rem] gap-4 overflow-x-auto pb-6 mb-2">
            {colonnes.map(colonne => (
              <div
                key={colonne}
                className="flex flex-col gap-4 pr-4 border-r border-gray-200"
              >
                {colonne === 0
                  ? plans.map(plan => (
                      <TableauAxe
                        key={plan.id}
                        axe={plan.plan}
                        selectAxe={selectAxe}
                        isSelected={
                          selectedAxes.includes(plan.plan) &&
                          plan.plan.profondeur === selectedAxes.length - 1
                        }
                        containSelectedAxe={selectedAxes.includes(plan.plan)}
                      />
                    ))
                  : selectedAxes
                      .find(axe => axe.profondeur === colonne - 1)
                      ?.enfants?.map(axe => (
                        <TableauAxe
                          key={axe.axe.id}
                          axe={axe}
                          selectAxe={selectAxe}
                          isSelected={
                            selectedAxes.includes(axe) &&
                            axe.profondeur === selectedAxes.length - 1
                          }
                          containSelectedAxe={selectedAxes.includes(axe)}
                        />
                      ))}
              </div>
            ))}
          </div>
          <button
            aria-label="Confirmer"
            className="fr-btn ml-auto"
            onClick={() => {
              addFicheToAxe({
                axe: selectedAxes[selectedAxes.length - 1],
                fiche_id: fiche.id!,
                planAction_id: selectedAxes[0].axe.id,
              });
              setSelectedAxes([]);
            }}
            disabled={selectedAxes.length < 1}
          >
            {isLoading ? (
              <SpinnerLoader className="mx-20" />
            ) : (
              'Valider cet emplacement'
            )}
          </button>
        </div>
      ) : (
        <div className="flex h-24 text-sm text-gray-500">
          <span className="m-auto">
            Il n'existe aucun plan auquel rattacher cette fiche
          </span>
        </div>
      )}
    </div>
  );
};

export default TableauNouvelEmplacement;
