import {useState} from 'react';
import SpinnerLoader from 'ui/shared/SpinnerLoader';

import {TProfondeurAxe} from '../../PlanAction/data/types';
import {usePlanActionProfondeur} from '../../PlanAction/data/usePlanActionProfondeur';
import {checkAxeExistInPlanProfondeur} from '../../PlanAction/data/utils';
import {TAxeInsert} from 'types/alias';
import {FicheAction} from '../data/types';
import {useAddFicheToAxe} from '../data/useAddFicheToAxe';
import TableauAxe from './TableauAxe';

/**
 * Renvoi un tableau de chiffre, représentant les différentes colonnes: [0,1,2,3],
 * en fonction de la profondeur des axes sélectionnés et leurs enfants.
 * Permet de faire un .map() sur ce tableau afin de générer les colonnes en HTML.
 */
const generateColonnes = (axes: TProfondeurAxe[]) =>
  axes.reduce(
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

type Props = {
  fiche: FicheAction;
};

const TableauNouvelEmplacement = ({fiche}: Props) => {
  const plansProfondeur = usePlanActionProfondeur();
  const {mutate: addFicheToAxe, isLoading} = useAddFicheToAxe();

  // Tableau contenant les ids des axes de la fiche
  const ficheAxesIds = fiche.axes
    ? fiche.axes.map((axe: TAxeInsert) => axe.id)
    : [];

  // On retire les plans qui contiennent déjà la fiche
  const plans = plansProfondeur?.plans.filter(
    plan =>
      !ficheAxesIds
        .map(id => checkAxeExistInPlanProfondeur(plan.plan, id!))
        .includes(true)
  );

  // L'axe sélectionné et ceux dont il est l'enfant
  const [selectedAxes, setSelectedAxes] = useState<TProfondeurAxe[]>([]);

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
            {generateColonnes(selectedAxes).map(colonne => (
              <div
                key={colonne}
                className="flex flex-col gap-4 pr-4 border-r border-gray-200"
              >
                {colonne === 0
                  ? // Dans la 1ere colonne, on affiche les plans d'actions
                    plans.map(plan => (
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
                  : // Pour les autres colonnes, on cherche dans les axes sélectionnés
                    // l'axe qui à une profondeur correspondant à la colonne précédemment affichée
                    // afin d'afficher les axes enfants s'il y en a.
                    selectedAxes
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
