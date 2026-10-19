import { PERSONAL_MODULE_TITRES } from '@/app/tableaux-de-bord/modules/personal-module-titres';
import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { appLabels } from '@/app/labels/catalog';
import { useMesuresModuleFiltre } from '@/app/tableaux-de-bord/referentiels/use-mesures-module-filtre';
import { useUser } from '@tet/api/users';
import { ModuleMesuresSelect } from '@tet/domain/metrics';
import { ListActionsInput, ReferentielId } from '@tet/domain/referentiels';
import {
  Event,
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  SelectFilter,
  useEventTracker,
} from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { OpenState } from '@tet/ui/utils/types';
import { useUpsertModuleTdbPerso } from '../_hooks/use-tdb-perso-upsert-module';

type Props = {
  module: ModuleMesuresSelect;
  openState: OpenState;
  keysToInvalidate?: QueryKey[];
};

const MesuresDontJeSuisLePiloteModal = ({
  module,
  openState,
  keysToInvalidate,
}: Props) => {
  const tracker = useEventTracker();
  const queryClient = useQueryClient();
  const { mutateAsync: upsertModule } = useUpsertModuleTdbPerso();

  const { id: userId } = useUser();

  const { displayedReferentielIds, referentielOptions } =
    useMesuresModuleFiltre(module.options.filtre);

  const [filtreState, setFiltreState] = useState<ListActionsInput>(
    module.options.filtre
  );

  // Filtré au rendu et non dans l'état initial : le feature flag TE peut
  // encore être en chargement au montage. Sans référentiel sélectionné, le
  // module affiche les référentiels par défaut (cf. resolveMesuresReferentielIds) :
  // on ne les pré-remplit pas pour ne pas figer un choix qui doit suivre la bascule.
  const selectedReferentielIds = filtreState.referentielIds?.filter((id) =>
    displayedReferentielIds.includes(id)
  );

  return (
    <Modal
      openState={openState}
      title={PERSONAL_MODULE_TITRES[module.defaultKey]}
      render={() => (
        <FormSection
          title={`${capitalize(appLabels.filtrerSur)} :`}
          className="!grid-cols-1"
        >
          <Field title={capitalize(appLabels.referentiel({ plural: true }))}>
            <SelectFilter
              values={selectedReferentielIds}
              options={referentielOptions}
              onChange={({ values }) =>
                setFiltreState({
                  ...filtreState,
                  referentielIds: values as ReferentielId[],
                })
              }
            />
          </Field>
          <Field title={capitalize(appLabels.personnePilote())}>
            <PersonneTagDropdown
              values={[userId]}
              onChange={() => null}
              disabled
              disabledOptionsIds={[userId]}
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
              tracker(Event.tdb.validateFiltresMesures);
              await upsertModule({
                ...module,
                options: {
                  ...module.options,
                  filtre: filtreState ?? {},
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

export default MesuresDontJeSuisLePiloteModal;
