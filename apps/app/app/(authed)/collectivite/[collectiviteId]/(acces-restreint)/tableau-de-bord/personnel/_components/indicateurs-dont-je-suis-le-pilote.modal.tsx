import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useSupabase } from '@/api';
import { ModuleIndicateursSelect, modulesSave } from '@/api/plan-actions';
import { useUser } from '@/api/users';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import IndicateurCompletsDropdown from '@/app/ui/dropdownLists/indicateur/IndicateurCompletsDropdown';
import { ListDefinitionsInputFilters } from '@/domain/indicateurs';
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

  const [filtreState, setFiltreState] = useState<ListDefinitionsInputFilters>(
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
              values={filtreState?.planIds}
              onChange={({ plans }) =>
                setFiltreState({
                  ...filtreState,
                  planIds: plans,
                })
              }
            />
          </Field>
          <Field title="Direction ou service pilote de l'indicateur :">
            <ServicesPilotesDropdown
              values={filtreState?.serviceIds}
              onChange={({ services }) => {
                setFiltreState({
                  ...filtreState,
                  serviceIds: services.map((s) => s.id),
                });
              }}
            />
          </Field>
          <Field title="Thématique de l'indicateur :">
            <ThematiquesDropdown
              values={filtreState?.thematiqueIds}
              onChange={(thematiqueIds: number[]) =>
                setFiltreState({
                  ...filtreState,
                  thematiqueIds,
                })
              }
            />
          </Field>
          <Field title="Indicateur complété par la collectivité :">
            <IndicateurCompletsDropdown
              values={
                filtreState?.estRempli === undefined
                  ? undefined
                  : filtreState?.estRempli
                  ? 'rempli'
                  : 'incomplet'
              }
              onChange={(value) => {
                setFiltreState({
                  ...filtreState,
                  estRempli:
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
