import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import StatutsFilterDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import PeriodeDropdown from '@/app/ui/dropdownLists/PeriodeDropdown';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  splitPilotePersonnesAndUsers,
} from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import { useSupabase } from '@tet/api';
import { ModuleFicheActionsSelect, modulesSave } from '@tet/api/plan-actions';
import { ListFichesRequestFilters } from '@tet/domain/plans';
import { ModifiedSince } from '@tet/domain/utils';
import {
  Event,
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  useEventTracker,
} from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

type Props = {
  module: ModuleFicheActionsSelect;
  openState: OpenState;
  keysToInvalidate?: QueryKey[];
};

const FichesRecemmentModifieesModal = ({
  module,
  openState,
  keysToInvalidate,
}: Props) => {
  const tracker = useEventTracker();
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const [filtreState, setFiltreState] = useState<ListFichesRequestFilters>(
    module.options.filtre
  );

  const pilotes = getPilotesValues(filtreState);

  return (
    <Modal
      openState={openState}
      title={module.titre}
      render={() => (
        <FormSection title="Filtrer sur :" className="!grid-cols-1">
          <Field title="Plans">
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
          <Field title="Personne pilote">
            <PersonnesDropdown
              values={pilotes}
              onChange={({ personnes }) => {
                setFiltreState({
                  ...filtreState,
                  ...splitPilotePersonnesAndUsers(personnes),
                });
              }}
            />
          </Field>
          <Field title="Statut">
            <StatutsFilterDropdown
              values={filtreState.statuts}
              onChange={({ statuts }) =>
                setFiltreState({
                  ...filtreState,
                  statuts,
                })
              }
            />
          </Field>
          <Field title="Période de modification">
            <PeriodeDropdown
              values={filtreState.modifiedSince}
              onChange={(value) =>
                value &&
                setFiltreState({
                  ...filtreState,
                  modifiedSince: value as ModifiedSince,
                })
              }
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
              tracker(Event.tdb.validateFiltresActionsModifiees);
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

export default FichesRecemmentModifieesModal;
