import {useState} from 'react';

import {modulesSave} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/actions/modules.save';
import {ModuleIndicateursSelect} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {Filtre} from '@tet/api/dist/src/indicateurs/indicateurs.list/domain/fetch_options.schema';
import {
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
  Select,
  SelectMultiple,
} from '@tet/ui';
import {generateTitle} from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import {usePlansActionsListe} from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useQueryClient} from 'react-query';
import {getQueryKey} from '../useModulesFetch';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';

type Props = ModalProps & {
  module: ModuleIndicateursSelect;
};

const ModalIndicateursSuiviPlan = ({openState, module}: Props) => {
  const collectiviteId = useCollectiviteId();
  if (!collectiviteId) {
    throw new Error('Aucune collectivité associée');
  }

  const plansActions = usePlansActionsListe(collectiviteId);
  const queryClient = useQueryClient();
  const userId = useAuth().user?.id;

  const [filtreState, setFiltreState] = useState<Filtre>(module.options.filtre);

  return (
    <Modal
      openState={openState}
      render={() => (
        <>
          <h3 className="mb-4 text-center text-2xl">{module.titre}</h3>
          <FormSection title="Filtrer sur :" className="!grid-cols-1">
            <Field title="Nom du plan :">
              <SelectMultiple
                values={filtreState.planActionIds}
                options={
                  plansActions?.plans.map(p => ({
                    label: generateTitle(p.nom),
                    value: p.id,
                  })) ?? []
                }
                onChange={({values, selectedValue}) =>
                  ((filtreState.planActionIds?.length === 1 &&
                    selectedValue !== filtreState.planActionIds[0]) ||
                    (filtreState.planActionIds &&
                      filtreState.planActionIds.length > 1)) &&
                  setFiltreState({
                    ...filtreState,
                    planActionIds: values as number[],
                  })
                }
              />
            </Field>
            <Field title="Pilote de l'indicateur :">
              <PersonnesDropdown
                values={filtreState.personnePiloteIds?.map(String)}
                onChange={pilotesIds =>
                  setFiltreState({
                    ...filtreState,
                    personnePiloteIds: pilotesIds.map(Number),
                  })
                }
              />
            </Field>
            <Field title="Thématique de l'indicateur :">
              <ThematiquesDropdown
                values={filtreState.thematiqueIds}
                onChange={thematiquesIds =>
                  setFiltreState({
                    ...filtreState,
                    thematiqueIds: thematiquesIds.map(Number),
                  })
                }
              />
            </Field>
            <Field title="Complétion indicateur :">
              <Select
                values={
                  filtreState.estComplet === undefined
                    ? undefined
                    : filtreState.estComplet
                    ? 'rempli'
                    : 'incomplet'
                }
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
                  setFiltreState({
                    ...filtreState,
                    estComplet:
                      value === undefined ? undefined : value === 'rempli',
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
            onClick: async () => {
              await modulesSave({
                dbClient: supabaseClient,
                module: {
                  ...module,
                  options: {
                    ...module.options,
                    filtre: filtreState,
                  },
                },
              });

              queryClient.invalidateQueries(
                getQueryKey(collectiviteId, userId)
              );

              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModalIndicateursSuiviPlan;
