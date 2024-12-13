import { useState } from 'react';
import { QueryKey, useQueryClient } from 'react-query';

import {
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
} from '@/ui';

import { modulesSave } from '@/api/plan-actions/dashboards/collectivite-dashboard';
import { Filtre } from '@/api/plan-actions/dashboards/collectivite-dashboard/domain/fiches-synthese.schema';
import { ModuleFicheActionCountByStatusSelect } from '@/api/plan-actions/dashboards/collectivite-dashboard/domain/module.schema';
import { ModuleDisplaySettings } from '@/app/app/pages/collectivite/TableauDeBord/components/Module';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { TFicheActionCibles } from '@/app/types/alias';
import CiblesDropdown from '@/app/ui/dropdownLists/ficheAction/CiblesDropdown/CiblesDropdown';
import PartenairesDropdown from '@/app/ui/dropdownLists/PartenairesDropdown/PartenairesDropdown';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  splitPilotePersonnesAndUsers,
} from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';

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
