import { useState } from 'react';

import { FetchFilter } from '@/api/plan-actions/plan-actions.list/domain/fetch-options.schema';
import { useCollectiviteModuleUpsert } from '@/app/app/pages/collectivite/TableauDeBord/Collectivite/useCollectiviteModuleUpsert';
import {
  ModuleDisplay,
  ModuleDisplaySettings,
} from '@/app/app/pages/collectivite/TableauDeBord/components/Module';
import { getDisplayButtons } from '@/app/app/pages/collectivite/TableauDeBord/components/utils';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  splitPilotePersonnesAndUsers,
} from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import { ModulePlanActionListType } from '@/domain/collectivites';
import {
  ButtonGroup,
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
} from '@/ui';

type Props = ModalProps & {
  module: ModulePlanActionListType;
  displaySettings: ModuleDisplaySettings;
};

const ModalSuiviPlansAction = ({
  openState,
  module,
  displaySettings,
}: Props) => {
  const { mutate: upsertCollectiviteModule } = useCollectiviteModuleUpsert();

  const [display, setDisplay] = useState<ModuleDisplay>(
    displaySettings.display
  );

  const [filtreState, setFiltreState] = useState<FetchFilter>(
    module.options.filtre ?? {}
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
              upsertCollectiviteModule(module);

              displaySettings.display !== display &&
                displaySettings.setDisplay(display);

              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModalSuiviPlansAction;
