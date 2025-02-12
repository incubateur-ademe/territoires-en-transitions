import { useState } from 'react';

import { modulesSave } from '@/api/plan-actions/dashboards/personal-dashboard/actions/modules.save';
import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { Filtre as FiltreFichesAction } from '@/api/plan-actions/fiche-resumes.list/domain/fetch-options.schema';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import PrioritesFilterDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';
import StatutsFilterDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPilotesValues } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import { useUser } from '@/app/users/user-provider';
import {
  Field,
  FormSection,
  FormSectionGrid,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
  useEventTracker,
} from '@/ui';
import { QueryKey, useQueryClient } from 'react-query';

type Props = ModalProps & {
  module: ModuleFicheActionsSelect;
  keysToInvalidate?: QueryKey[];
};

const ModalActionsDontJeSuisLePilote = ({
  openState,
  module,
  keysToInvalidate,
}: Props) => {
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;
  const queryClient = useQueryClient();
  const userId = useUser().id;
  const supabase = useSupabase();

  const [filtreState, setFiltreState] = useState<FiltreFichesAction>(
    module.options.filtre
  );

  const trackEvent = useEventTracker(
    'app/tdb/personnel/actions-dont-je-suis-pilote'
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
          <FormSectionGrid>
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
            <Field title="Niveau de priorité">
              <PrioritesFilterDropdown
                values={filtreState.priorites}
                onChange={({ priorites }) =>
                  setFiltreState({
                    ...filtreState,
                    priorites,
                  })
                }
              />
            </Field>
          </FormSectionGrid>
          <Field title="Personne pilote">
            <PersonnesDropdown
              values={pilotes.length ? pilotes : undefined}
              onChange={() => null}
              disabled
              disabledOptionsIds={[userId!]}
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
              trackEvent('tdb_valider_filtres_actions_pilotes', {
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

export default ModalActionsDontJeSuisLePilote;
