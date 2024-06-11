import {useState} from 'react';

import {
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
  Select,
  SelectMultiple,
} from '@tet/ui';
import FiltrePersonnes from 'app/pages/collectivite/Indicateurs/lists/FiltrePersonnes';
import FiltreThematiques from 'app/pages/collectivite/Indicateurs/lists/FiltreThematiques';
import {generateTitle} from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import {usePlansActionsListe} from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {ModuleSelect} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';

type Filters = {
  planIds?: number[];
  pilotesIds?: string[];
  thematiquesIds?: string[];
  rempli?: string;
};

type Props = ModalProps & {
  module: ModuleSelect;
};

const ModalIndicateursSuiviPlan = ({openState, module}: Props) => {
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
          <h3 className="mb-4 text-center text-2xl">{module.titre}</h3>
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
              <Select
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
                onChange={value =>
                  setFormState({
                    ...formState,
                    rempli: value as string,
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
