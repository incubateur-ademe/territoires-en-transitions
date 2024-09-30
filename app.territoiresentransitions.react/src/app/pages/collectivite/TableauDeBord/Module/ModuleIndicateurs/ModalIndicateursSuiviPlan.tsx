import { useState } from 'react';

import { Indicateurs } from '@tet/api';
import { modulesSave } from '@tet/api/plan-actions/dashboards/personal-dashboard/actions/modules.save';
import { ModuleIndicateursSelect } from '@tet/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
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
import { splitPilotePersonnesAndUsers } from 'ui/dropdownLists/PersonnesDropdown/utils';
import PlansActionDropdown from 'ui/dropdownLists/PlansActionDropdown';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import IndicateurCompletsDropdown from 'ui/dropdownLists/indicateur/IndicateurCompletsDropdown';

type Props = ModalProps & {
  module: ModuleIndicateursSelect;
  keysToInvalidate?: QueryKey[];
};

const ModalIndicateursSuiviPlan = ({
  openState,
  module,
  keysToInvalidate,
}: Props) => {
  const collectiviteId = useCollectiviteId();
  if (!collectiviteId) {
    throw new Error('Aucune collectivité associée');
  }

  const queryClient = useQueryClient();

  const [filtreState, setFiltreState] = useState<
    Indicateurs.domain.FetchFiltre | undefined
  >(module.options.filtre);

  const trackEvent = useEventTracker(
    'app/tdb/personnel/indicateurs-de-suivi-de-mes-plans'
  );

  const getPilotesValues = (filtreState?: Indicateurs.domain.FetchFiltre) => {
    const pilotes = [];
    if (filtreState?.utilisateurPiloteIds) {
      pilotes.push(...filtreState.utilisateurPiloteIds);
    }
    if (filtreState?.personnePiloteIds) {
      pilotes.push(...filtreState.personnePiloteIds.map(String));
    }
    return pilotes;
  };

  const pilotes = getPilotesValues(filtreState);

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
              onChange={({ plans, selectedPlan }) =>
                ((filtreState?.planActionIds?.length === 1 &&
                  selectedPlan !== filtreState?.planActionIds[0]) ||
                  (filtreState?.planActionIds &&
                    filtreState?.planActionIds.length > 1)) &&
                setFiltreState({
                  ...filtreState,
                  planActionIds: plans as number[],
                })
              }
            />
          </Field>
          <Field title="Pilote de l'indicateur :">
            <PersonnesDropdown
              values={pilotes.length ? pilotes : undefined}
              onChange={({ personnes }) =>
                setFiltreState({
                  ...filtreState,
                  ...splitPilotePersonnesAndUsers(personnes),
                })
              }
            />
          </Field>
          <Field title="Thématique de l'indicateur :">
            <ThematiquesDropdown
              values={filtreState?.thematiqueIds}
              onChange={({ thematiques }) =>
                setFiltreState({
                  ...filtreState,
                  thematiqueIds: thematiques.map((t) => t.id),
                })
              }
            />
          </Field>
          <Field title="Complétion indicateur :">
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
        </FormSection>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            onClick: async () => {
              trackEvent('tdb_valider_filtres_indicateurs', {
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

export default ModalIndicateursSuiviPlan;
