import { useState } from 'react';

import { modulesSave } from '@tet/api/plan-actions/dashboards/personal-dashboard/actions/modules.save';
import { ModuleFicheActionsSelect } from '@tet/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import {
  Field,
  FormSection,
  FormSectionGrid,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
  SelectMultiple,
  useEventTracker,
} from '@tet/ui';
import { generateTitle } from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { usePlansActionsListe } from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { QueryKey, useQueryClient } from 'react-query';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { Filtre as FiltreFichesAction } from '@tet/api/plan-actions/fiche-resumes.list/domain/fetch-options.schema';
import { useAuth } from 'core-logic/api/auth/AuthProvider';
import { getPilotesValues } from 'ui/dropdownLists/PersonnesDropdown/utils';
import StatutsFilterDropdown from 'ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import PrioritesFilterDropdown from 'ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';

type Props = ModalProps & {
  module: ModuleFicheActionsSelect;
  keysToInvalidate?: QueryKey[];
};

const ModalActionsDontJeSuisLePilote = ({
  openState,
  module,
  keysToInvalidate,
}: Props) => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const userId = useAuth().user?.id;

  const plansActions = usePlansActionsListe(collectiviteId!);

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
            <SelectMultiple
              values={filtreState.planActionIds}
              options={
                plansActions?.plans.map((p) => ({
                  label: generateTitle(p.nom),
                  value: p.id,
                })) ?? []
              }
              onChange={({ values }) =>
                setFiltreState({
                  ...filtreState,
                  planActionIds: values as number[],
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

export default ModalActionsDontJeSuisLePilote;
