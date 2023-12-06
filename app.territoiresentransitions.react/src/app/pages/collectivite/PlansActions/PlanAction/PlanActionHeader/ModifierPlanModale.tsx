import {useEffect, useState} from 'react';

import Modal from 'ui/shared/floating-ui/Modal';
import PlanTypeDropdown from '../PlanTypeDropdown';
import FormField from 'ui/shared/form/FormField';
import {PlanNode} from '../data/types';
import {useEditAxe} from '../data/useEditAxe';
import {TPlanType} from 'types/alias';

type Props = {
  children: JSX.Element;
  type?: TPlanType;
  axe: PlanNode;
  isAxePage: boolean;
};

/**
 * Modale pour modifier un plan d'action.
 */
const ModifierPlanModale = ({children, type, axe, isAxePage}: Props) => {
  const {mutate: updateAxe} = useEditAxe(axe.id);

  const initialTypedPlan = {...axe, type};

  const [typedPlan, setTypedPlan] = useState(initialTypedPlan);

  useEffect(() => {
    setTypedPlan(initialTypedPlan);
  }, [type]);

  const handleEditAxe = (close: () => void) => {
    updateAxe(typedPlan);
    close();
  };

  return (
    <Modal
      onClose={() => setTypedPlan(initialTypedPlan)}
      render={({labelId, close}) => {
        return (
          <div data-test="ModifierPlanTitreModale" className="mt-2">
            <h4 id={labelId} className="fr-h4 text-center !mb-8">
              {isAxePage ? "Modifier l'axe" : 'Modifier le plan d’action'}
            </h4>
            <FormField
              label={!isAxePage ? 'Nom du plan d’action' : "Titre de l'axe"}
              hint={
                !isAxePage
                  ? 'Exemple : Plan Climat Air Énergie territorial 2022-2026'
                  : ''
              }
            >
              <input
                data-test="PlanNomInput"
                className="fr-input"
                value={typedPlan.nom}
                onChange={e =>
                  setTypedPlan({...typedPlan, nom: e.target.value})
                }
                placeholder="Sans titre"
                autoFocus
              />
            </FormField>
            {!isAxePage && (
              <PlanTypeDropdown
                type={typedPlan?.type?.id}
                onSelect={type => setTypedPlan({...typedPlan, type})}
              />
            )}
            <div className="mt-12 fr-btns-group fr-btns-group--right fr-btns-group--inline-lg">
              <button
                onClick={close}
                className="fr-btn fr-btn--secondary"
                aria-label="Annuler"
              >
                Annuler
              </button>
              <button className="fr-btn" onClick={() => handleEditAxe(close)}>
                Valider
              </button>
            </div>
          </div>
        );
      }}
    >
      {children}
    </Modal>
  );
};

export default ModifierPlanModale;
