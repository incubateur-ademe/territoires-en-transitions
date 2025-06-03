import { useState } from 'react';
import { QueryKey, useQueryClient } from 'react-query';

import { Indicateurs } from '@/api';
import { modulesSave } from '@/api/plan-actions/dashboards/personal-dashboard';
import { ModuleIndicateursSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { splitPilotePersonnesAndUsers } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import IndicateurCompletsDropdown from '@/app/ui/dropdownLists/indicateur/IndicateurCompletsDropdown';
import { Alert, Field, FormSection, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';

type Props = {
  module: ModuleIndicateursSelect;
  openState: OpenState;
  keysToInvalidate?: QueryKey[];
};

const IndicateursSuiviMesPlansModal = ({
  module,
  openState,
  keysToInvalidate,
}: Props) => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const [filtreState, setFiltreState] = useState<
    Indicateurs.domain.FetchFiltre | undefined
  >(module.options.filtre);

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
        <>
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
                onChange={({ thematiques }) =>
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
          </FormSection>
          <Alert title="Seuls les indicateurs rattachés à des fiches actions sont considérés dans ce module" />
        </>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            onClick: async () => {
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

export default IndicateursSuiviMesPlansModal;
