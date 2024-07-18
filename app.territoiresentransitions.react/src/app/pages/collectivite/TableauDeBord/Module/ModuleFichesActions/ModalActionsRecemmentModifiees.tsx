import {useState} from 'react';

import {modulesSave} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/actions/modules.save';
import {ModuleFicheActionsSelect} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {
  Filtre as FiltreFichesAction,
  ModifiedSince,
} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';
import {
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
  Select,
  SelectMultiple,
  useEventTracker,
} from '@tet/ui';
import {generateTitle} from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import {usePlansActionsListe} from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {QueryKey, useQueryClient} from 'react-query';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  splitPilotePersonnesAndUsers,
} from 'ui/dropdownLists/PersonnesDropdown/utils';
import {ficheActionModifiedSinceOptions} from 'ui/dropdownLists/listesStatiques';
import StatutsFilterDropdown from 'ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';

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

  const plansActions = usePlansActionsListe(collectiviteId!);

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
      render={() => (
        <>
          <h3 className="mb-4 text-center text-2xl">{module.titre}</h3>
          <FormSection title="Filtrer sur :" className="!grid-cols-1">
            <Field title="Plans d'action :">
              <SelectMultiple
                values={filtreState.planActionIds}
                options={
                  plansActions?.plans.map(p => ({
                    label: generateTitle(p.nom),
                    value: p.id,
                  })) ?? []
                }
                onChange={({values}) =>
                  setFiltreState({
                    ...filtreState,
                    planActionIds: values as number[],
                  })
                }
              />
            </Field>
            <Field title="Pilote">
              <PersonnesDropdown
                values={pilotes}
                onChange={({personnes}) => {
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
                onChange={({statuts}) =>
                  setFiltreState({
                    ...filtreState,
                    statuts,
                  })
                }
              />
            </Field>
            <Field title="Période de modification : ">
              <Select
                values={filtreState.modifiedSince}
                options={ficheActionModifiedSinceOptions}
                onChange={value =>
                  value &&
                  setFiltreState({
                    ...filtreState,
                    modifiedSince: value as ModifiedSince,
                  })
                }
              />
            </Field>
          </FormSection>
        </>
      )}
      renderFooter={({close}) => (
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

              keysToInvalidate?.forEach(key =>
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
