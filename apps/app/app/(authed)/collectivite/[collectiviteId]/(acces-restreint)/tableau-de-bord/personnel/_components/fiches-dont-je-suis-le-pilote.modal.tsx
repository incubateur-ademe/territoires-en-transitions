import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import {
  PrioriteOrNot,
  StatutOrNot,
} from '@/app/plans/fiches/list-all-fiches/filters/types';
import PrioritesFilterDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';
import StatutsFilterDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import { useSupabase } from '@tet/api';
import { ModuleFicheActionsSelect, modulesSave } from '@tet/api/plan-actions';
import { useUser } from '@tet/api/users';
import {
  ListFichesRequestFilters,
  Priorite,
  SANS_PRIORITE_LABEL,
  SANS_STATUT_LABEL,
  Statut,
} from '@tet/domain/plans';
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
  const formStatuts: StatutOrNot[] = [
    ...(statuts ?? []),
    ...(noStatut ? [SANS_STATUT_LABEL] : []),
  ];
  const formPriorites: PrioriteOrNot[] = [
    ...(priorites ?? []),
    ...(noPriorite ? [SANS_PRIORITE_LABEL] : []),
  ];
  return {
    ...rest,
    statuts: formStatuts.length > 0 ? formStatuts : undefined,
    priorites: formPriorites.length > 0 ? formPriorites : undefined,
  };
};

const toApiFilters = (formState: FormState): ListFichesRequestFilters => {
  const { statuts: formStatuts, priorites: formPriorites, ...rest } = formState;

  const withNoStatut = formStatuts?.includes(SANS_STATUT_LABEL);
  const statutsWithoutSansStatut = formStatuts?.filter(
    (s): s is Statut => s !== SANS_STATUT_LABEL
  );

  const withNoPriorite = formPriorites?.includes(SANS_PRIORITE_LABEL);
  const prioritesWithoutSansPriorite = formPriorites?.filter(
    (p): p is Priorite => p !== SANS_PRIORITE_LABEL
  );

  return {
    ...rest,
    statuts:
      statutsWithoutSansStatut && statutsWithoutSansStatut.length > 0
        ? statutsWithoutSansStatut
        : undefined,
    noStatut: withNoStatut || undefined,
    priorites:
      prioritesWithoutSansPriorite && prioritesWithoutSansPriorite.length > 0
        ? prioritesWithoutSansPriorite
        : undefined,
    noPriorite: withNoPriorite || undefined,
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
  const supabase = useSupabase();
  const queryClient = useQueryClient();

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
              await modulesSave({
                dbClient: supabase,
                module: {
                  ...module,
                  options: {
                    ...module.options,
                    filtre: toApiFilters(filtreState),
                  },
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
