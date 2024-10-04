import { useState } from 'react';
import { QueryKey, useQueryClient } from 'react-query';

import {
  ButtonGroup,
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
} from '@tet/ui';

import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  splitPilotePersonnesAndUsers,
} from 'ui/dropdownLists/PersonnesDropdown/utils';
import { getDisplayButtons } from 'app/pages/collectivite/TableauDeBord/Module/utils';
import {
  ModuleDisplay,
  ModuleDisplaySettings,
} from 'app/pages/collectivite/TableauDeBord/Module/Module';
import PlansActionDropdown from 'ui/dropdownLists/PlansActionDropdown';
import { ModulePlanActionListSelect } from '@tet/api/plan-actions/dashboards/collectivite-dashboard/domain/module.schema';
import { modulesSave } from '@tet/api/plan-actions/dashboards/collectivite-dashboard';
import { supabaseClient } from 'core-logic/api/supabase';
import { FetchFilter } from '@tet/api/plan-actions/plan-actions.list/domain/fetch-options.schema';

type Props = ModalProps & {
  module: ModulePlanActionListSelect;
  displaySettings: ModuleDisplaySettings;
  keysToInvalidate?: QueryKey[];
};

const ModalSuiviPlansAction = ({
  openState,
  module,
  displaySettings,
  keysToInvalidate,
}: Props) => {
  const queryClient = useQueryClient();

  const [display, setDisplay] = useState<ModuleDisplay>(
    displaySettings.display
  );

  const [filtreState, setFiltreState] = useState<FetchFilter>(
    module.options.filtre
  );

  return (
    <Modal
      openState={openState}
      title={module.titre}
      render={() => (
        <>
          <FormSection title="Filtrer sur :" className="!grid-cols-1">
            <Field title="Plans d'action :">
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
            <Field title="Personne pilote :">
              <PersonnesDropdown
                values={getPilotesValues(filtreState)}
                onChange={({ personnes }) =>
                  setFiltreState({
                    ...filtreState,
                    ...splitPilotePersonnesAndUsers(personnes),
                  })
                }
              />
            </Field>
          </FormSection>
          <FormSection title="Affichage" className="!grid-cols-1">
            <ButtonGroup
              activeButtonId={display}
              buttons={getDisplayButtons({
                onClick: (display) => setDisplay(display),
                texts: {
                  circular: 'Carte avec diagramme',
                  row: 'Carte barre de progression',
                },
              })}
              size="sm"
              fillContainer
            />
          </FormSection>
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
                dbClient: supabaseClient,
                module: {
                  ...module,
                  options: {
                    filtre: filtreState,
                  },
                },
              });

              displaySettings.display !== display &&
                displaySettings.setDisplay(display);

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

export default ModalSuiviPlansAction;
