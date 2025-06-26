import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { modulesSave } from '@/api/plan-actions/dashboards/personal-dashboard';
import { ModuleMesuresSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { useUser } from '@/api/users/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { RouterInput } from '@/api/utils/trpc/client';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { ReferentielId } from '@/domain/referentiels';
import {
  Event,
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  SelectFilter,
  useEventTracker,
} from '@/ui';
import { OpenState } from '@/ui/utils/types';

type ActionListFilters =
  RouterInput['referentiels']['actions']['listActions']['filters'];

type Props = {
  module: ModuleMesuresSelect;
  openState: OpenState;
  keysToInvalidate?: QueryKey[];
};

const MesuresDontJeSuisLePiloteModal = ({
  module,
  openState,
  keysToInvalidate,
}: Props) => {
  const tracker = useEventTracker();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const { id: userId } = useUser();

  const [filtreState, setFiltreState] = useState<ActionListFilters>(
    module.options.filtre
  );

  return (
    <Modal
      openState={openState}
      title={module.titre}
      render={() => (
        <FormSection title="Filtrer sur :" className="!grid-cols-1">
          <Field title="Référentiel">
            <SelectFilter
              values={filtreState?.referentielIds}
              options={[
                {
                  label: 'Climat, air, énergie',
                  value: 'cae',
                },
                {
                  label: 'Économie circulaire',
                  value: 'eci',
                },
              ]}
              onChange={({ values }) =>
                setFiltreState({
                  ...filtreState,
                  referentielIds: values as ReferentielId[],
                })
              }
            />
          </Field>
          <Field title="Personne pilote">
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
              tracker(Event.tdb.validateFiltresMesures);
              await modulesSave({
                dbClient: supabase,
                module: {
                  ...module,
                  options: {
                    ...module.options,
                    filtre: filtreState ?? {},
                  },
                },
              });

              keysToInvalidate?.forEach((key) =>
                queryClient.invalidateQueries({ queryKey: key })
              );

              close();
            },
          }}
        />
      )}
    />
  );
};

export default MesuresDontJeSuisLePiloteModal;
