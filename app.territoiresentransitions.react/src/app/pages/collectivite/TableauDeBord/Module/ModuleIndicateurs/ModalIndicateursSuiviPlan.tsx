import {useState} from 'react';

import {
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
  OptionValue,
  SelectFilter,
  SelectMultiple,
} from '@tet/ui';
import {generateTitle} from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import {usePlansActionsListe} from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import {indicateursSuiviPlans} from 'app/pages/collectivite/TableauDeBord/Module/data';
import {useCollectiviteId} from 'core-logic/hooks/params';
import FiltreThematiques from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/FiltreThematiques';
import FiltrePersonnes from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/FiltrePersonnes';

type Filters = {
  planIds?: number[];
  pilotesIds?: (string | number)[];
  thematiquesIds?: string[];
  rempli?: string[];
};

const ModalIndicateursSuiviPlan = ({openState}: ModalProps) => {
  const collectivite_id = useCollectiviteId();
  const plansActions = usePlansActionsListe(collectivite_id!);

  const [formState, setFormState] = useState<Filters>({
    planIds: plansActions?.plans.map(p => p.id),
  });

  return (
    <Modal
      openState={openState}
      render={() => (
        <>
          <h3 className="mb-4 text-center text-2xl">
            {indicateursSuiviPlans.title}
          </h3>
          <FormSection title="Filtrer sur :" className="!grid-cols-1">
            <Field title="Nom du plan :">
              <SelectMultiple
                values={formState.planIds}
                options={
                  plansActions?.plans.map(p => ({
                    label: generateTitle(p.nom),
                    value: p.id,
                  })) ?? []
                }
                onChange={({values, selectedValue}) =>
                  ((formState.planIds?.length === 1 &&
                    selectedValue !== formState.planIds[0]) ||
                    (formState.planIds && formState.planIds.length > 1)) &&
                  setFormState({...formState, planIds: values as number[]})
                }
              />
            </Field>
            <Field title="Pilote de l'indicateur :">
              <FiltrePersonnes
                values={formState.pilotesIds}
                onSelect={pilotesIds =>
                  setFormState({
                    ...formState,
                    pilotesIds,
                  })
                }
              />
            </Field>
            <Field title="Thématique de l'indicateur :">
              <FiltreThematiques
                values={formState.thematiquesIds}
                onSelect={thematiquesIds =>
                  setFormState({
                    ...formState,
                    thematiquesIds,
                  })
                }
              />
            </Field>
            <Field title="Complétion indicateur :">
              <SelectFilter
                values={formState.rempli}
                options={[
                  {
                    label: 'Complet',
                    value: 'rempli',
                  },
                  {
                    label: 'Incomplet',
                    value: 'incomplet',
                  },
                ]}
                onChange={({values}) =>
                  setFormState({
                    ...formState,
                    rempli: values as string[],
                  })
                }
              />
            </Field>
          </FormSection>
        </>
      )}
      renderFooter={({close}) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            onClick: () => {
              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModalIndicateursSuiviPlan;
