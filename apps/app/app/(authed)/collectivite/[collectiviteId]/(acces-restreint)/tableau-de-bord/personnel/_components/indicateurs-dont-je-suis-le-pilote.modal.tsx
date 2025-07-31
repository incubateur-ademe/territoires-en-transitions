import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { modulesSave } from '@/api/plan-actions/dashboards/personal-dashboard';
import { ModuleIndicateursSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { useUser } from '@/api/users/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import IndicateurCompletsDropdown from '@/app/ui/dropdownLists/indicateur/IndicateurCompletsDropdown';
import { ListIndicateursRequestFilters } from '@/domain/indicateurs';
import {
  Event,
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  useEventTracker,
} from '@/ui';
import { OpenState } from '@/ui/utils/types';

type Props = {
  module: ModuleIndicateursSelect;
  openState: OpenState;
  keysToInvalidate?: QueryKey[];
};

const IndicateursDontJeSuisLePiloteModal = ({
  module,
  openState,
  keysToInvalidate,
}: Props) => {
  const tracker = useEventTracker();
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const { id: userId } = useUser();

  const [filtreState, setFiltreState] = useState<ListIndicateursRequestFilters>(
    module.options.filtre
  );

  return (
    <Modal
      openState={openState}
      title={module.titre}
      render={() => (
        <FormSection title="Filtrer sur :" className="!grid-cols-1">
          <Field title="Nom du plan :">
            <PlansActionDropdown
              type="multiple"
              values={filtreState?.planActionIds}
              onChange={({ plans }) =>
                setFiltreState({
                  ...filtreState,
                  planActionIds: plans,
                })
              }
            />
          </Field>
          <Field title="Direction ou service pilote de l'indicateur :">
            <ServicesPilotesDropdown
              values={filtreState?.servicePiloteIds}
              onChange={({ services }) => {
                setFiltreState({
                  ...filtreState,
                  servicePiloteIds: services.map((s) => s.id),
                });
              }}
            />
          </Field>
          <Field title="Thématique de l'indicateur :">
            <ThematiquesDropdown
              values={filtreState?.thematiqueIds}
              onChange={(thematiques) =>
                setFiltreState({
                  ...filtreState,
                  thematiqueIds: thematiques.map((t) => t.id),
                })
              }
            />
          </Field>
          <Field title="Indicateur complété par la collectivité :">
            <IndicateurCompletsDropdown
              values={
                filtreState?.estComplet === undefined
                  ? undefined
                  : filtreState?.estComplet
                  ? 'rempli'
                  : 'incomplet'
              }
              onChange={(value) => {
                setFiltreState({
                  ...filtreState,
                  estComplet:
                    value === undefined || value.length === 0
                      ? undefined
                      : value === 'rempli',
                });
              }}
            />
          </Field>
          <Field title="Pilote de l'indicateur :">
            <PersonnesDropdown
              values={[userId]}
              onChange={() => null}
              disabled
              disabledOptionsIds={[userId]}
            />
          </Field>
        </FormSection>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            onClick: async () => {
              tracker(Event.tdb.validateFiltresIndicateurs);
              await modulesSave({
                dbClient: supabase,
                module: {
                  ...module,
                  options: {
                    ...module.options,
                    filtre: filtreState,
                  },
                },
              });

              keysToInvalidate?.forEach((key) => {
                queryClient.invalidateQueries({ queryKey: key });
              });

              close();
            },
          }}
        />
      )}
    />
  );
};

export default IndicateursDontJeSuisLePiloteModal;
