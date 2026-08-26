import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { appLabels } from '@/app/labels/catalog';
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

  const [filtreState, setFiltreState] = useState<ListActionsInput>(
    module.options.filtre
  );

  return (
    <Modal
      openState={openState}
      title={module.titre}
      render={() => (
        <FormSection
          title={`${capitalize(appLabels.filtrerSur)} :`}
          className="!grid-cols-1"
        >
          <Field title={capitalize(appLabels.referentiel({ plural: true }))}>
            <SelectFilter
              values={filtreState?.referentielIds}
              options={[
                {
                  label: 'Climat, air, énergie',
                  value: 'cae',
                },
                {
                  label: 'Économie circulaire',
                  value: 'eci',
                },
              ]}
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
