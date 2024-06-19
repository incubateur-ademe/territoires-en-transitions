import {useState} from 'react';

import {modulesSave} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/actions/modules.save';
import {ModuleFicheActionsSelect} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
  Select,
  SelectFilter,
  SelectMultiple,
} from '@tet/ui';
import {generateTitle} from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import {usePlansActionsListe} from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {QueryKey, useQueryClient} from 'react-query';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {Filtre as FiltreFichesAction} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';
import {
  TModifiedSince,
  ficheActionModifiedSinceOptions,
  ficheActionStatutOptions,
} from 'app/pages/collectivite/PlansActions/FicheAction/data/options/listesStatiques';
import {TFicheActionStatuts} from 'types/alias';
import BadgeStatut from 'app/pages/collectivite/PlansActions/components/BadgeStatut';
import {splitPersonnesAndUsers} from 'ui/dropdownLists/PersonnesDropdown/utils';

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

  const getPilotesValues = (filtreState: FiltreFichesAction) => {
    const pilotes = [];
    if (filtreState.utilisateurPiloteIds) {
      pilotes.push(...filtreState.utilisateurPiloteIds);
    }
    if (filtreState.personnePiloteIds) {
      pilotes.push(...filtreState.personnePiloteIds.map(String));
    }
    return pilotes;
  };

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
                values={pilotes.length ? pilotes : undefined}
                onChange={personnes => {
                  setFiltreState({
                    ...filtreState,
                    ...splitPersonnesAndUsers(personnes),
                  });
                }}
              />
            </Field>
            <Field title="Statut">
              <SelectFilter
                values={filtreState.statuts ?? undefined}
                options={ficheActionStatutOptions}
                onChange={({values}) =>
                  setFiltreState({
                    ...filtreState,
                    statuts: values as TFicheActionStatuts[],
                  })
                }
                customItem={item => (
                  <BadgeStatut statut={item.value as TFicheActionStatuts} />
                )}
              />
            </Field>
            <Field title="Période de modification : ">
              <Select
                values={filtreState.modifiedSince}
                options={ficheActionModifiedSinceOptions}
                onChange={value =>
                  setFiltreState({
                    ...filtreState,
                    modifiedSince: value as TModifiedSince,
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
