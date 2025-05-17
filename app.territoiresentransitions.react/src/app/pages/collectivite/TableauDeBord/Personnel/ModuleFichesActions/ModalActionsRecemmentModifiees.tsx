import { modulesSave } from '@/api/plan-actions/dashboards/personal-dashboard/actions/modules.save';
import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCurrentCollectivite } from '@/app/collectivites/collectivite-context';
import StatutsFilterDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import PeriodeDropdown from '@/app/ui/dropdownLists/PeriodeDropdown';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  splitPilotePersonnesAndUsers,
} from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import { ListFichesRequestFilters } from '@/domain/plans/fiches';
import { ModifiedSince } from '@/domain/utils';
import {
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
  useEventTracker,
} from '@/ui';
import { useState } from 'react';
import { QueryKey, useQueryClient } from 'react-query';

type Props = ModalProps & {
  module: ModuleFicheActionsSelect;
  keysToInvalidate?: QueryKey[];
};

const ModalActionsRecemmentModifiees = ({
  openState,
  module,
  keysToInvalidate,
}: Props) => {
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const [filtreState, setFiltreState] = useState<ListFichesRequestFilters>(
    module.options.filtre
  );

  const trackEvent = useEventTracker(
    'app/tdb/personnel/actions-recemment-modifiees'
  );

  const pilotes = getPilotesValues(filtreState);

  return (
    <Modal
      openState={openState}
      title={module.titre}
      render={() => (
        <FormSection title="Filtrer sur :" className="!grid-cols-1">
          <Field title="Plans d'action">
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
              trackEvent('tdb_valider_filtres_actions_modifiees', {
                collectiviteId,
                niveauAcces,
                role,
              });
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

export default ModalActionsRecemmentModifiees;
