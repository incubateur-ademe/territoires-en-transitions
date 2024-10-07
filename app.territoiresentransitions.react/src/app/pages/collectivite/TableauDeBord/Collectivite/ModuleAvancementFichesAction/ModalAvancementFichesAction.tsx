import { useState } from 'react';
import { QueryKey, useQueryClient } from 'react-query';

import {
  ButtonGroup,
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
} from '@tet/ui';

import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  splitPilotePersonnesAndUsers,
} from 'ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from 'ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import { ModuleDisplaySettings } from 'app/pages/collectivite/TableauDeBord/components/Module';
import PartenairesDropdown from 'ui/dropdownLists/PartenairesDropdown/PartenairesDropdown';
import CiblesDropdown from 'ui/dropdownLists/ficheAction/CiblesDropdown/CiblesDropdown';
import PlansActionDropdown from 'ui/dropdownLists/PlansActionDropdown';
import { ModuleFicheActionCountByStatusSelect } from '@tet/api/plan-actions/dashboards/collectivite-dashboard/domain/module.schema';
import { Filtre } from '@tet/api/plan-actions/dashboards/collectivite-dashboard/domain/fiches-synthese.schema';
import { TFicheActionCibles } from 'types/alias';
import { modulesSave } from '@tet/api/plan-actions/dashboards/collectivite-dashboard';
import { supabaseClient } from 'core-logic/api/supabase';

type Props = ModalProps & {
  module: ModuleFicheActionCountByStatusSelect;
  displaySettings: ModuleDisplaySettings;
  keysToInvalidate?: QueryKey[];
};

const ModalAvancementFichesAction = ({
  openState,
  module,
  displaySettings,
  keysToInvalidate,
}: Props) => {
  const queryClient = useQueryClient();

  const [filtreState, setFiltreState] = useState<Filtre>(module.options.filtre);

  return (
    <Modal
      openState={openState}
      title={module.titre}
      render={() => (
        <>
          <FormSection
            title="Appliquer des filtres sur le module"
            className="!grid-cols-1"
          >
            <Field title="Plans d'action :">
              <PlansActionDropdown
                values={filtreState.planActionIds}
                onChange={({ plans }) =>
                  setFiltreState({
                    ...filtreState,
                    planActionIds: plans,
                  })
                }
              />
            </Field>
            <Field title="Personne pilote :">
              <PersonnesDropdown
                values={getPilotesValues(filtreState)}
                onChange={({ personnes }) =>
                  setFiltreState({
                    ...filtreState,
                    ...splitPilotePersonnesAndUsers(personnes),
                  })
                }
              />
            </Field>
            <Field title="Direction ou service pilote :">
              <ServicesPilotesDropdown
                values={
                  filtreState.servicePiloteIds?.length
                    ? filtreState.servicePiloteIds
                    : undefined
                }
                onChange={({ services }) =>
                  setFiltreState({
                    ...filtreState,
                    servicePiloteIds: services.map((s) => s.id),
                  })
                }
              />
            </Field>
            <Field title="Partenaires :">
              <PartenairesDropdown
                values={filtreState.partenaireIds}
                onChange={({ partenaires }) =>
                  setFiltreState({
                    ...filtreState,
                    partenaireIds: partenaires.map((p) => p.id),
                  })
                }
              />
            </Field>
            <Field title="Cibles :">
              <CiblesDropdown
                values={filtreState.cibles as TFicheActionCibles[]}
                onChange={({ cibles }) =>
                  setFiltreState({ ...filtreState, cibles })
                }
              />
            </Field>
          </FormSection>
        </>
      )}
      renderFooter={({ close }) => (
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
                    filtre: filtreState,
                  },
                },
              });

              keysToInvalidate?.forEach((key) =>
                queryClient.invalidateQueries(key)
              );
              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModalAvancementFichesAction;
