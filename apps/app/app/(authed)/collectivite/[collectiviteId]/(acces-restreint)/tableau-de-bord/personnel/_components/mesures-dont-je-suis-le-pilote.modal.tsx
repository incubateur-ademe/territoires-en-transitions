import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { ModuleMesuresSelect } from '@tet/api/plan-actions';
import { useUser } from '@tet/api/users';
import { ListActionsInput, ReferentielId } from '@tet/domain/referentiels';
import { useTdbPersoUpsertModule } from '../_hooks/use-tdb-perso-upsert-module';
import {
  Event,
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  SelectFilter,
  useEventTracker,
} from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

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
  const { mutateAsync: upsertModule } = useTdbPersoUpsertModule();

  const { id: userId } = useUser();

  const [filtreState, setFiltreState] = useState<ListActionsInput>(
    module.options.filtre
  );

  return (
    <Modal
      openState={openState}
      title={module.titre}
      render={() => (
        <FormSection title="Filtrer sur :" className="!grid-cols-1">
          <Field title="Référentiel">
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
          <Field title="Personne pilote">
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
