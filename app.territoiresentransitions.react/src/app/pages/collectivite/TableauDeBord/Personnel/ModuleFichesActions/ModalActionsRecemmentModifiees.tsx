import { useState } from 'react';

import { modulesSave } from '@tet/api/plan-actions/dashboards/personal-dashboard/actions/modules.save';
import { ModuleFicheActionsSelect } from '@tet/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import {
  Filtre as FiltreFichesAction,
  ModifiedSince,
} from '@tet/api/plan-actions/fiche-resumes.list/domain/fetch-options.schema';
import {
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
  useEventTracker,
} from '@tet/ui';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { QueryKey, useQueryClient } from 'react-query';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  splitPilotePersonnesAndUsers,
} from 'ui/dropdownLists/PersonnesDropdown/utils';
import StatutsFilterDropdown from 'ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import PeriodeDropdown from 'ui/dropdownLists/PeriodeDropdown';
import PlansActionDropdown from 'ui/dropdownLists/PlansActionDropdown';

type Props = ModalProps & {
  module: ModuleFicheActionsSelect;
  keysToInvalidate?: QueryKey[];
};

const ModalActionsRecemmentModifiees = ({
  openState,
  module,
  keysToInvalidate,
}: Props) => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();

  const [filtreState, setFiltreState] = useState<FiltreFichesAction>(
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
                collectivite_id: collectiviteId!,
              });
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
