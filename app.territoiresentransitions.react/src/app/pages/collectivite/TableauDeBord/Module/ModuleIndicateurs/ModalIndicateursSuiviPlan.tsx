import {useState} from 'react';

import {
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
  SelectFilter,
} from '@tet/ui';
import {generateTitle} from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import {usePlansActionsListe} from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import {indicateursSuiviPlans} from 'app/pages/collectivite/TableauDeBord/Module/data';
import {useCollectiviteId} from 'core-logic/hooks/params';

type Filters = {
  planIds?: number[];
  pilotesIds?: (string | number)[];
  thematiquesIds?: number[];
  rempli?: string;
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
              <SelectFilter
                values={formState.planIds}
                options={
                  plansActions?.plans.map(p => ({
                    label: generateTitle(p.nom),
                    value: p.id,
                  })) ?? []
                }
                onChange={({values}) =>
                  setFormState({...formState, planIds: values as number[]})
                }
              />
            </Field>
            <Field title="Pilote de l'indicateur :">
              <SelectFilter
                values={formState.pilotesIds}
                options={[
                  {
                    label: 'test',
                    value: 'test',
                  },
                ]}
                onChange={({values}) =>
                  setFormState({...formState, pilotesIds: values})
                }
              />
            </Field>
            <Field title="Thématique de l'indicateur :">
              <SelectFilter
                values={formState.thematiquesIds}
                options={[
                  {
                    label: 'test',
                    value: 'test',
                  },
                ]}
                onChange={({values}) =>
                  setFormState({
                    ...formState,
                    thematiquesIds: values as number[],
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
                ]}
                onChange={({values, selectedValue}) =>
                  setFormState({
                    ...formState,
                    rempli: selectedValue as string,
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
