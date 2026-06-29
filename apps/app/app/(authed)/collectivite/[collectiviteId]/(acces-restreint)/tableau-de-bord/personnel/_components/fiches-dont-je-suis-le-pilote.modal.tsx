import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import {
  fromApiPrioritesToFormPriorites,
  fromApiStatutsToFormStatuts,
  fromFormPrioritesToApiPriorites,
  fromFormStatutsToApiStatuts,
} from '@/app/plans/fiches/list-all-fiches/filters/filter-converter';
import {
  PrioriteOrNot,
  StatutOrNot,
} from '@/app/plans/fiches/list-all-fiches/filters/types';
import PrioritesFilterDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';
import StatutsFilterDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import { useUser } from '@tet/api/users';
import { ModuleFicheActionsSelect } from '@tet/domain/collectivites/tableau-de-bord';
import { ListFichesRequestFilters } from '@tet/domain/plans';
import { useTdbPersoUpsertModule } from '../_hooks/use-tdb-perso-upsert-module';
import {
  Event,
  Field,
  FormSection,
  FormSectionGrid,
  Modal,
  ModalFooterOKCancel,
  useEventTracker,
} from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

type FormState = Omit<
  ListFichesRequestFilters,
  'statuts' | 'noStatut' | 'priorites' | 'noPriorite'
> & {
  statuts?: StatutOrNot[];
  priorites?: PrioriteOrNot[];
};

const toFormState = (filters: ListFichesRequestFilters): FormState => {
  const { noStatut, statuts, noPriorite, priorites, ...rest } = filters;
  return {
    ...rest,
    statuts: fromApiStatutsToFormStatuts(statuts, noStatut),
    priorites: fromApiPrioritesToFormPriorites(priorites, noPriorite),
  };
};

const toApiFilters = (formState: FormState): ListFichesRequestFilters => {
  const { statuts: formStatuts, priorites: formPriorites, ...rest } = formState;
  return {
    ...rest,
    ...fromFormStatutsToApiStatuts(formStatuts),
    ...fromFormPrioritesToApiPriorites(formPriorites),
  };
};

type Props = {
  module: ModuleFicheActionsSelect;
  openState: OpenState;
  keysToInvalidate?: QueryKey[];
};

const FichesDontJeSuisLePiloteModal = ({
  module,
  openState,
  keysToInvalidate,
}: Props) => {
  const tracker = useEventTracker();
  const queryClient = useQueryClient();
  const { mutateAsync: upsertModule } = useTdbPersoUpsertModule();

  const { id: userId } = useUser();

  const [filtreState, setFiltreState] = useState<FormState>(() =>
    toFormState(module.options.filtre)
  );

  return (
    <Modal
      openState={openState}
      title={module.titre}
      render={() => (
        <FormSection title="Filtrer sur :" className="!grid-cols-1">
          <Field title="Plans">
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
                onChange={(statuts) =>
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
                onChange={(priorites) =>
                  setFiltreState({
                    ...filtreState,
                    priorites,
                  })
                }
              />
            </Field>
          </FormSectionGrid>
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
              tracker(Event.tdb.validateFiltresActionsPilotes);
              await upsertModule({
                ...module,
                options: {
                  ...module.options,
                  filtre: toApiFilters(filtreState),
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

export default FichesDontJeSuisLePiloteModal;
